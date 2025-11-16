import datetime
import json
from uuid import uuid4
from constants.hotel_constants import HotelConstants
from utils.swagger_decorators import auto_schema_post, auto_schema_get, auto_schema_patch, auto_schema_delete
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny,IsAuthenticated, IsAdminUser
from libs.response_handle import AppResponse
from hotel_management_be.models.user import User
from rest_framework.decorators import api_view
from constants.success_codes import SuccessCodes
from configuration.jwt_config import JwtConfig
from hotel_management_be.serializers.booking_serializer import *
from django.contrib.auth import authenticate
from constants.error_codes import ErrorCodes
from django.contrib.auth.models import update_last_login
from libs.Redis import RedisWrapper
from libs.querykit.querykit_serializer import (
    QuerykitSerializer,
)
from django.db import transaction
from libs.querykit.querykit import Querykit
from utils.utils import Utils
from libs.Redis import RedisUtils, RedisWrapper
from django.conf import settings
from django.utils import timezone
from datetime import datetime, timedelta
from hotel_management_be.celery_hotel.task import monitor_session_task
from hotel_management_be.models.hotel import *
from rest_framework.response import Response
from rest_framework import status


@auto_schema_post(BookingSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def add_booking(request):
    try:
        
        serializers = BookingSerializer(data=request.data, context={'request':request})
        if serializers.is_valid():
            new_booking = serializers.save(created_by = request.user)
            return AppResponse.success(SuccessCodes.CREATE_AMENITY, data={"data":BookingSerializer(new_booking).data})
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, str(e))
    
@auto_schema_patch(BookingSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(BookingSerializer)
@permission_classes([IsAdminUser])
@api_view(['PATCH', 'DELETE'])
def booking_detail(request, uuid):
    try:
        booking = Booking.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':
            
            serializer = BookingSerializer(booking, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": BookingSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            booking.delete()
            return AppResponse.success(SuccessCodes.DELETE_AMENITY)

    except Booking.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Booking not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
    
@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_booking(request):
    try:
        list_booking = Booking.objects.all()
        paginated_booking, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=list_booking).values()
        serializers = BookingSerializer(paginated_booking, many=True)
        return AppResponse.success(SuccessCodes.LIST_AMENITY, data={'data':serializers.data, 'total':total})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_AMENITY_FAIL, str(e))
    
    
HOLD_TTL_SECONDS = getattr(settings, "HOLD_TTL_SECONDS", 10*60)
SESSION_TTL_SECONDS = getattr(settings, "SESSION_TTL_SECONDS", 2*60)

# Utility: ensure inventory keys exist for requested range (init from DB)
def ensure_inventory_for_range(hotel_id, room_type_id, checkin, checkout):
    rt = RoomType.objects.get(uuid=room_type_id)
    set_room_booked = Utils.get_booked_rooms(checkin, checkout)
    available_room = Room.objects.filter(room_type_id=rt).exclude(uuid__in=set_room_booked).count()
    cur = checkin
    today = timezone.now().date()
    while cur < checkout:
        key = RedisUtils.inventory_key(hotel_id, room_type_id, cur.isoformat())
        # chỉ tạo nếu chưa tồn tại
        RedisUtils.r.setnx(key, available_room)
        
        # TTL = (checkout - today).days + 3 ngày dự phòng
        ttl_days = max((checkout - today).days + 3, 3)
        RedisUtils.r.expire(key, ttl_days * 86400)
        
        cur += timedelta(days=1)

@api_view(['POST'])
def create_booking_session(request):
    """
    Create a booking session (user indicates checkin/checkout and requested room count).
    BE does not lock anything yet (unless you choose to pre-hold).
    """
    serializer = CreateSessionSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    hotel_name = data['hotel_name']
    checkin = data['checkin']
    checkout = data['checkout']
    requested_rooms = data.get('requested_rooms', 1)
    user_id = data.get('user_id', '')
    hotel = Hotel.objects.get(name=hotel_name)
    # create session record with expires_at
    expires_at = timezone.now() + timedelta(seconds=SESSION_TTL_SECONDS)
    session = (
        BookingSession.objects
        .filter(
            hotel=hotel,
            checkin=checkin,
            checkout=checkout,
            expires_at__gt=timezone.now(),  # chỉ lấy session còn hiệu lực
        )
        .first()
    )

    if session:
        created = False
    else:
        session = BookingSession.objects.create(
            hotel=hotel,
            checkin=checkin,
            checkout=checkout,
            requested_rooms=requested_rooms,
            expires_at=expires_at
        )
        created = True

    # store minimal session pointer in redis (not mandatory)
    RedisUtils.r.hset(RedisUtils.session_key(str(session.uuid)), mapping={
        "hotel_id": str(hotel.uuid),
        "checkin": checkin.isoformat(),
        "checkout": checkout.isoformat(),
        "requested_rooms": str(requested_rooms),
        "created_at": timezone.now().isoformat()
    })
    RedisUtils.r.expire(RedisUtils.session_key(str(session.uuid)), SESSION_TTL_SECONDS)
    monitor_session_task.delay(str(session.uuid))
    return Response({
        "session_id": str(session.uuid),
        "expires_in": SESSION_TTL_SECONDS
    })

@api_view(['POST'])
def create_hold(request):
    """
    Called when the user selects a room (rate) for one of the rooms in session.
    Will attempt to atomically decrement inventory across date range and create a hold in Redis.
    """
    serializer = CreateHoldSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    data = serializer.validated_data
    session_id = str(data['session_id'])
    room_type_name = data['room_type_name']
    rate_plan_name = data['rate_plan_name']
    quantity = data.get('quantity', 0)
    user_id = data.get('user_id', '')
    total_price = data.get('total_price', 0)
    user_email = data.get('user_email', '')
    room_index = int(data.get('room_index', 0))

    # load session to get dates
    try:
        session = BookingSession.objects.get(uuid=session_id)
    except BookingSession.DoesNotExist:
        return Response({"error": "session_not_found"}, status=status.HTTP_404_NOT_FOUND)
    # optional: if legacy list exists, migrate to slots
    try:
        RedisUtils.migrate_session_list_to_slots(session_id, total_slots=session.requested_rooms)
    except Exception:
        pass
    
    hotel_id = session.hotel.uuid
    checkin = session.checkin.isoformat()
    checkout = session.checkout.isoformat()
    room_type = RoomType.objects.get(name = room_type_name)
    rate_plan = RatePlan.objects.get(name = rate_plan_name)
    room_type_id = room_type.uuid

    # ensure inventory keys exist
    ensure_inventory_for_range(hotel_id, room_type_id, session.checkin, session.checkout)
    
    # Before creating new hold: release existing hold in same slot (if any)
    existing_hold_id = RedisUtils.get_hold_for_room(session_id, room_index)
    if existing_hold_id:
        # load payload, increment inventory back, delete hold key and DB HoldRecord
        payload_old = RedisUtils.get_hold_from_redis(existing_hold_id)
        if payload_old:
            try:
                RedisUtils.atomic_increment_inventory_for_range(
                    payload_old['hotel_id'],
                    room_type_id,  # careful: if old hold used different room_type, adapt
                    payload_old['checkin'],
                    payload_old['checkout'],
                    payload_old.get('quantity', 1)
                )
            except Exception:
                pass
        # delete old hold key and DB record status
        RedisUtils.delete_hold_in_redis(existing_hold_id)
        HoldRecord.objects.filter(uuid=existing_hold_id).update(status='Released')


    # Attempt atomic decrement across range
    ok = RedisUtils.atomic_decrement_inventory_for_range(hotel_id, room_type_id, checkin, checkout, quantity=quantity)
    if not ok:
        return Response({"ok": False, "error": "sold_out"}, status=status.HTTP_200_OK)

    # create hold object in Redis
    hold_id = str(uuid4())
    payload = {
        "hold_id": hold_id,
        "session_id": session_id,
        "rate_plan_name": rate_plan_name,
        "room_type_name":room_type_name,
        "hotel_id": hotel_id,
        "quantity": quantity,
        "checkin": checkin,
        "checkout": checkout,
        "user_id": user_id,
        "user_email": user_email,
        "total_price":float(total_price),
        "created_at": timezone.now().isoformat()
    }
    RedisUtils.create_hold_in_redis(hold_id, payload, ttl_seconds=HOLD_TTL_SECONDS)
    RedisUtils.set_hold_for_room(session_id, room_index, hold_id, ttl_seconds=HOLD_TTL_SECONDS)

    # Persist an audit HoldRecord (optional)
    HoldRecord.objects.create(
        uuid=hold_id,
        session=session,
        room_type=room_type,
        quantity=quantity,
        rate_plan=rate_plan,
        user_email=user_email or '',
        checkin=session.checkin,
        checkout=session.checkout,
        total_price =total_price,
        status='Hold',
        expires_at=timezone.now() + timedelta(seconds=HOLD_TTL_SECONDS)
    )

    # # enqueue event to other systems async (optional)
    # # enqueue_hold_created_event.delay(payload)

    return Response({"ok": True, "hold_id": hold_id, "ttl": HOLD_TTL_SECONDS})

@api_view(['POST'])
def confirm_booking(request):
    """
    Confirm a booking for the entire session (convert holds to booking).
    Double-check that all holds for the session exist in Redis before completing.
    """
    serializer = ConfirmBookingSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    session_id = str(serializer.validated_data['session_id'])
    user_id = serializer.validated_data['user_id']
    payment_token = serializer.validated_data.get('payment_token', '')

    # read holds from redis
    hold_ids = RedisUtils.get_session_holds(session_id)
    if not hold_ids:
        return Response({"ok": False, "error": "no_holds_or_session_expired"}, status=status.HTTP_410_GONE)

    # verify each hold still present
    payloads = []
    for hid in hold_ids:
        h = RedisUtils.get_hold_from_redis(hid)
        if not h:
            # some hold expired -> fail entire confirmation
            return Response({"ok": False, "error": "hold_expired", "expired_hold": hid}, status=status.HTTP_410_GONE)
        payloads.append(h)

    # TODO: Process payment synchronously or orchestrate external payment and wait callback.
    # For demo, assume payment succeeds.
    payment_success = True

    if not payment_success:
        # do not auto-release holds here - keep TTL to allow retry
        return Response({"ok": False, "error": "payment_failed"}, status=status.HTTP_402_PAYMENT_REQUIRED)

    # Convert each hold to Booking record
    created_bookings = []
    for p in payloads:
        b = Booking.objects.create(
            session_id=session_id,
            user_id=user_id,
            room_type_id=p['room_type_id'],
            quantity=p.get('quantity', 1),
            checkin=p['checkin'],
            checkout=p['checkout'],
            amount=0,  # compute real price via rate engine
            payment_status='PAID',
            confirmed_at=timezone.now()
        )
        created_bookings.append(str(b.booking_id))
        # update HoldRecord persistent DB if exists
        HoldRecord.objects.filter(uuid=p['hold_id']).update(status='Confirmed')

        # remove hold key from redis (consumed)
        RedisUtils.delete_hold_in_redis(p['hold_id'])

    # cleanup session keys
    RedisUtils.r.delete(RedisUtils.session_holds_key(session_id))
    RedisUtils.r.delete(RedisUtils.session_key(session_id))

    # Optionally publish booking events
    # publish booking events to Kafka or other systems

    return Response({"ok": True, "bookings": created_bookings})

@api_view(["POST"])
def get_list_hold_room(request):
    try:
        session_id = request.data.get('session_id')
        # try to get session to know requested_rooms for slot scanning
        session = BookingSession.objects.filter(uuid=session_id).first()
        total_slots = session.requested_rooms if session else None

        hold_ids = RedisUtils.get_session_holds(session_id, total_slots=total_slots)
        holds = []
        for hid in hold_ids:
            hid_s = hid.decode() if isinstance(hid, bytes) else str(hid)
            h = RedisUtils.get_hold_from_redis(hid_s)
            if h:
                holds.append(h)
        return AppResponse.success(SuccessCodes.GET_LIST_ROOM_HOLD, holds)
    except Exception as e:
        return AppResponse.error(ErrorCodes.GET_LIST_ROOM_HOLD_FAIL, str(e))
    
    
@api_view(["POST"])
def check_session(request):
    try:
        session_id = request.data.get("session_id")
        return AppResponse.success(SuccessCodes.PAYMENT, {"check":session_id})
    except Exception as e:
        return AppResponse.error(ErrorCodes.PAYMENT, str(e))