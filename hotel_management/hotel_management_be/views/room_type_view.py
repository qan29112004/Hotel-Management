import datetime
import json
from constants.hotel_constants import HotelConstants
from hotel_management_be.serializers.amenity_serializer import AmenitySerializer
from utils.swagger_decorators import auto_schema_post, auto_schema_get, auto_schema_delete, auto_schema_patch
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
from hotel_management_be.serializers.hotel_serializer import *
from hotel_management_be.serializers.room_serializer import *
from django.contrib.auth import authenticate
from constants.error_codes import ErrorCodes
from django.contrib.auth.models import update_last_login
from libs.Redis import RedisUtils, RedisWrapper
from libs.querykit.querykit import Querykit
from libs.querykit.querykit_serializer import (
    QuerykitSerializer,
)
from django.db.models.functions import Cast
from django.db.models import *
from django.db import transaction
from utils.utils import Utils
from libs.pagination import MyPagination



@auto_schema_post(RoomTypeCreateSerializer)
@api_view(["POST"])
@permission_classes([IsAdminUser])
def add_room_type(request):
    if 'thumbnail' in request.data:
        thumbnail = Utils.upload_thumnail(request, 'thumbnail')
        request.data['thumbnail'] = thumbnail
    try:
        serializers = RoomTypeCreateSerializer(data=request.data)
        if serializers.is_valid():
            new_room_type = serializers.save()
            return AppResponse.success(SuccessCodes.CREATE_ROOM_TYPE, data={"data": RoomTypeCreateSerializer(new_room_type).data})
        return AppResponse.error(ErrorCodes.CREATE_ROOM_TYPE_FAIL, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_ROOM_TYPE_FAIL, str(e))
    
@auto_schema_post(RoomSerializer)
@api_view(["POST"])
@permission_classes([IsAdminUser])
def add_room(request):
    try:
        serializers = RoomSerializer(data=request.data)
        if serializers.is_valid():
            new_room = serializers.save()
            return AppResponse.success(SuccessCodes.CREATE_ROOM_TYPE, data={"data": RoomSerializer(new_room).data})
        return AppResponse.error(ErrorCodes.CREATE_ROOM_TYPE_FAIL, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_ROOM_TYPE_FAIL, str(e))
    
@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_room_type(request):
    try:
        room_type = RoomType.objects.annotate(int_size = Cast('size', IntegerField())).filter(int_size__gte=0).order_by('int_size')
        print(room_type)
        paginated_roomtype, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=room_type).values()
        serializer = RoomTypeSerializer(paginated_roomtype,many=True)
        return AppResponse.success(SuccessCodes.LIST_ROOM_TYPE, data={'data':serializer.data})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_ROOM_TYPE_FAIL, str(e))
    

@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_room(request):
    try:
        room = Room.objects.all()
        paginated_roomtype, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=room).values()
        serializer = RoomListSerializer(paginated_roomtype,many=True)
        return AppResponse.success(SuccessCodes.LIST_ROOM_TYPE, data={'data':serializer.data})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_ROOM_TYPE_FAIL, str(e))
    
    
@auto_schema_patch(RoomSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(RoomSerializer)
@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def room_detail(request, uuid):
    try:
        room = Room.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':

            # Xử lý xóa images
            deleted_images = request.data.getlist('deleted_images[]')
            if deleted_images:
                for path in deleted_images:
                    path = Utils.get_path_from_url(path)
                    RoomImage.objects.filter(room=room, image_url__icontains=path).delete()
                    default_storage.delete(path.replace('/media/', ''))
            serializer = RoomSerializer(room, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": RoomSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            room_images = RoomImage.objects.filter(room=room)
            for img in room_images:
                if img.image_url:
                    try:
                        print("delete image", img.image_url)
                        default_storage.delete(img.image_url.replace('/media/', ''))
                    except Exception as e:
                        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
            room.delete()
            return AppResponse.success(SuccessCodes.DELETE_AMENITY)

    except Room.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Amenity not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
@auto_schema_patch(RoomTypeSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(RoomTypeSerializer)
@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def room_type_detail(request, uuid):
    try:
        room = RoomType.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':
            if 'thumbnail' in request.data:
                thumbnail = Utils.upload_thumnail(request, 'thumbnail')
                print("thumnail", thumbnail)
                request.data['thumbnail'] = thumbnail
            deleted_thumbnail = Utils.get_path_from_url(request.data.get('deleted_thumbnail'))
            if deleted_thumbnail and deleted_thumbnail == room.thumbnail:
                default_storage.delete(deleted_thumbnail.replace('/media/', ''))
                room.thumbnail = None

            # Xử lý xóa images
            deleted_images = request.data.getlist('deleted_images[]')
            if deleted_images:
                for path in deleted_images:
                    path = Utils.get_path_from_url(path)
                    RoomTypeImage.objects.filter(room_type=room, image_url__icontains=path).delete()
                    default_storage.delete(path.replace('/media/', ''))
            serializer = RoomTypeCreateSerializer(room, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": RoomTypeSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            room_images = RoomTypeImage.objects.filter(room_type=room)
            print("room_images", room_images)
            for img in room_images:
                if img.image_url:
                    try:
                        print("delete image", img.image_url)
                        default_storage.delete(img.image_url.replace('/media/', ''))
                    except Exception as e:
                        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
            if room.thumbnail not in [None, '']:
                print("delete thumbnail", room.thumbnail)
                default_storage.delete(room.thumbnail.replace('/media/', ''))
            room.delete()
            return AppResponse.success(SuccessCodes.DELETE_AMENITY)

    except RoomType.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Amenity not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
    
@api_view(['GET'])
def get_room_type_by_hotel_id(request):
    try:
        hotel_id = request.data.get('hotel_id',None)
        
    except Exception as e:
        return AppResponse.error(ErrorCodes.NOT_FOUND, str(e))
    
    
@api_view(["POST"])
def cal_price_per_night(request):
    from datetime import date, timedelta, datetime
    from hotel_management_be.models.offer import RatePlan
    from hotel_management_be.models.booking import HoldRecord
    from hotel_management_be.views.booking_view import ensure_inventory_for_range
    try:
        hotel = request.data.get('hotel','')
        check_in = request.data.get('check_in','')
        check_out = request.data.get('check_out','')
        code = request.data.get('code','')
        rooms = request.data.get('rooms',[])    
        index_room = request.data.get('index_room','')
        session_id=request.data.get('session_id','')
        
        total_rooms_needed = len(rooms)
        room_requirements = [room['adults'] + room['children'] for room in rooms]
        total_guest = sum(room_requirements)
        count_children = sum([room['children'] for room in rooms])
        check_in_date =  datetime.strptime(check_in, "%Y-%m-%d").date()
        check_out_date =  datetime.strptime(check_out, "%Y-%m-%d").date()
        hotel = Hotel.objects.prefetch_related('RoomType', 'rate_plans_hotel').get(name=hotel)
        booked_rooms = Utils.get_booked_rooms(check_in, check_out)
        print("booked_room", booked_rooms)
        available_room_types = []
        room_types = hotel.RoomType.all()
            
        for room_type in room_types:
            # Lấy tất cả phòng của room type này
            ensure_inventory_for_range(hotel.uuid, room_type.uuid, datetime.strptime(check_in, "%Y-%m-%d").date(), datetime.strptime(check_out, "%Y-%m-%d").date())
            ok = RedisUtils.check_inventory_for_range(hotel.uuid, room_type.uuid, check_in, check_out, quantity=1)
            # exist_session, _ = RedisUtils.check_session(session_id)
            exist_hold = HoldRecord.objects.filter(session__uuid = session_id, room_type=room_type).first()
            if not ok and not exist_hold:continue

            all_rooms = room_type.room.filter(status='Available')
            print("all rooom", all_rooms)
            # Đếm số phòng chưa bị book
            available_count = sum(
                1 for room in all_rooms 
                if not booked_rooms or room.uuid not in booked_rooms
            ) 
            
            print("available rooom", available_count)
            
            if available_count and available_count > 0:
                # Thêm field available_rooms vào room_type object
                room_type.available_rooms = available_count
                available_room_types.append(room_type)
        
        # Prepare data cho can_accommodate
        hotel_availability = [
            rt for rt in available_room_types
        ]
        
        result_rt = []
        #check xem khach san co du phong khong
        check, list_rt = Utils.can_accommodate_roomtype(hotel_availability, room_requirements, total_rooms_needed)
        if check:
            _,result_rt = Utils.check_accomodate_roomtype(hotel_availability,room_requirements[int(index_room)], 1)
        rate_plan = hotel.rate_plans_hotel.all()
        response_json = []
        data = Utils.compute_price_per_night(rate_plan, result_rt, check_in_date, check_out_date, count_children,total_guest)
        return AppResponse.success(SuccessCodes.get_room_type_by_hotel_id, data)
    except Exception as e:
        return AppResponse.error(ErrorCodes.INTERNAL_SERVER_ERROR, str(e))