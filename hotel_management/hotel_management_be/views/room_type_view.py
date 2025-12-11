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
from hotel_management_be.models.booking import BookingRoom, Booking
from datetime import date

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
            hotel_id = new_room.room_type_id.hotel_id.uuid
            room_type_id = new_room.room_type_id.uuid
            RedisUtils.atomic_increment_all_existing_inventory(hotel_id=hotel_id,room_type_id= room_type_id)
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
        return AppResponse.success(SuccessCodes.LIST_ROOM_TYPE, data={'data':serializer.data, 'total':total})
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
        return AppResponse.success(SuccessCodes.LIST_ROOM_TYPE, data={'data':serializer.data, 'total':total})
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
            # Check for active bookings if changing room_type
            data = request.data.copy()

            # Danh sách field được bỏ qua khi so sánh
            ignore_fields = ['is_lock']

            # Lấy dữ liệu cũ của room để so sánh
            old_data = RoomSerializer(room).data

            # Kiểm tra xem có field nào thay đổi (trừ is_lock)
            has_changes_except_is_lock = False
            for key, new_value in data.items():
                if key in ignore_fields:
                    continue
                old_value = old_data.get(key)

                # So sánh kiểu str vì request.data luôn là string
                if str(old_value) != str(new_value):
                    has_changes_except_is_lock = True
                    break

            # Nếu có thay đổi khác is_lock → check active bookings
            if has_changes_except_is_lock:
                today = date.today()
                active_bookings = BookingRoom.objects.filter(
                    room_id=room,
                    booking_id__check_out__gte=today,
                    booking_id__status__in=['Pending', 'Confirm', 'Check In']
                )

                if active_bookings.exists():
                    # Get the furthest checkout date from the bookings
                    furthest_checkout = Utils.get_furthest_checkout_date(
                        active_bookings.values_list('booking_id', flat=True).distinct()
                    )
                    return AppResponse.error(
                        ErrorCodes.VALIDATION_ERROR,
                        f"Không thể thay đổi loại phòng do phòng đang được đặt trong tương lai. Bạn chỉ có thể thực hiện thao tác này sau ngày {furthest_checkout.strftime('%d/%m/%Y') if furthest_checkout else 'N/A'}"
                    )

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
                    # Kiểm tra xem is_lock có thay đổi từ False -> True không
                    old_is_lock = room.is_lock
                    updated = serializer.save(updated_by=request.user)
                    new_is_lock = updated.is_lock
                    
                    # Nếu phòng vừa bị lock (False -> True), giảm inventory trong Redis
                    if not old_is_lock and new_is_lock:
                        hotel_id = updated.room_type_id.hotel_id.uuid
                        room_type_id = updated.room_type_id.uuid
                        RedisUtils.atomic_decrement_all_existing_inventory(
                            hotel_id=hotel_id,
                            room_type_id=room_type_id
                        )
                    
                    # Nếu phòng vừa được unlock (True -> False), tăng inventory trong Redis
                    elif old_is_lock and not new_is_lock:
                        hotel_id = updated.room_type_id.hotel_id.uuid
                        room_type_id = updated.room_type_id.uuid
                        RedisUtils.atomic_increment_all_existing_inventory(
                            hotel_id=hotel_id,
                            room_type_id=room_type_id
                        )
                        
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": RoomSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            # Check for active bookings
            today = date.today()
            active_bookings = BookingRoom.objects.filter(
                room_id=room,
                booking_id__check_out__gte=today,
                booking_id__status__in=['Pending', 'Confirm', 'Check In']
            )
            if active_bookings.exists():
                # Get the furthest checkout date
                booking_ids = active_bookings.values_list('booking_id', flat=True).distinct()
                furthest_checkout = Utils.get_furthest_checkout_date(Booking.objects.filter(uuid__in=booking_ids))
                return AppResponse.error(
                    ErrorCodes.VALIDATION_ERROR, 
                    f"Không thể xóa phòng do phòng đang được đặt trong tương lai. Bạn chỉ có thể thực hiện thao tác này sau ngày {furthest_checkout.strftime('%d/%m/%Y') if furthest_checkout else 'N/A'}"
                )


            room_images = RoomImage.objects.filter(room=room)
            for img in room_images:
                if img.image_url:
                    try:
                        print("delete image", img.image_url)
                        default_storage.delete(img.image_url.replace('/media/', ''))
                    except Exception as e:
                        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
            hotel_id = room.room_type_id.hotel_id.uuid
            room_type_id = room.room_type_id.uuid
            RedisUtils.atomic_decrement_all_existing_inventory(hotel_id=hotel_id,room_type_id= room_type_id)
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
            # Check for active bookings only if changing critical fields
            data = request.data.copy()

            # Danh sách field được phép update ngay cả khi có booking
            # Bao gồm cả các field không phải model fields (deleted_*, images, etc.)
            allowed_fields = ['name', 'description', 'thumbnail', 'total_rooms', 'deleted_thumbnail', 
                            'deleted_images[]','amenity', 'status', 'images', 'max_occupancy', 'size', 'updated_by']

            # Lấy dữ liệu cũ của room type để so sánh
            old_data = RoomTypeSerializer(room).data

            # Kiểm tra xem có field quan trọng nào thay đổi không (base_price, hotel_id)
            has_critical_changes = False
            changed_fields = []
            
            for key, new_value in data.items():
                # Bỏ qua allowed fields
                if key in allowed_fields:
                    continue
                
                # Chỉ kiểm tra các field có trong serializer data
                if key not in old_data:
                    continue
                    
                old_value = old_data.get(key)

                # Xử lý None values
                old_value_str = str(old_value) if old_value is not None else ''
                new_value_str = str(new_value) if new_value is not None else ''
                
                # So sánh
                if old_value_str != new_value_str:
                    has_critical_changes = True
                    changed_fields.append(key)
                    print(f"Critical field changed: {key}, old: {old_value_str}, new: {new_value_str}")

            # Nếu có thay đổi critical fields → check active bookings
            if has_critical_changes:
                today = date.today()
                active_bookings = BookingRoom.objects.filter(
                    room_id__room_type_id=room,
                    booking_id__check_out__gte=today,
                    booking_id__status__in=['Pending', 'Confirm', 'Check In']
                )
                
                if active_bookings.exists():
                    booking_ids = active_bookings.values_list('booking_id', flat=True).distinct()
                    furthest_checkout = Utils.get_furthest_checkout_date(Booking.objects.filter(uuid__in=booking_ids))
                    return AppResponse.error(
                        ErrorCodes.VALIDATION_ERROR,
                        f"Không thể cập nhật do có phòng đang được đặt trong tương lai. Bạn chỉ có thể thực hiện thao tác này sau ngày {furthest_checkout.strftime('%d/%m/%Y') if furthest_checkout else 'N/A'}"
                    )
            
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
            # Check if any room of this type has active bookings
            today = date.today()
            active_bookings = BookingRoom.objects.filter(
                room_id__room_type_id=room,
                booking_id__check_out__gte=today,
                booking_id__status__in=['Pending', 'Confirm', 'Check In']
            )
            
            if active_bookings.exists():
                booking_ids = active_bookings.values_list('booking_id', flat=True).distinct()
                furthest_checkout = Utils.get_furthest_checkout_date(Booking.objects.filter(uuid__in=booking_ids))
                return AppResponse.error(
                    ErrorCodes.VALIDATION_ERROR, 
                    f"Không thể xóa loại phòng do có phòng đang được đặt trong tương lai. Bạn chỉ có thể thực hiện thao tác này sau ngày {furthest_checkout.strftime('%d/%m/%Y') if furthest_checkout else 'N/A'}"
                )


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
            exist_hold = HoldRecord.objects.filter(session__uuid = session_id, room_type=room_type, status='Hold').first()
            if not ok and not exist_hold:continue

            all_rooms = room_type.room.filter(status='Available', is_lock = False)
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
            # Validate index_room
            try:
                index_room_int = int(index_room) if index_room != '' else 0
                if index_room_int >= len(room_requirements):
                    return AppResponse.error(ErrorCodes.VALIDATION_ERROR, f"index_room {index_room_int} vượt quá số lượng phòng yêu cầu")
                
                _,result_rt = Utils.check_accomodate_roomtype(hotel_availability, room_requirements[index_room_int], 1)
            except (ValueError, IndexError) as e:
                return AppResponse.error(ErrorCodes.VALIDATION_ERROR, f"index_room không hợp lệ: {str(e)}")
        
        # Check if rate_plan exists
        rate_plan = hotel.rate_plans_hotel.all()
        if not rate_plan.exists():
            return AppResponse.error(ErrorCodes.NOT_FOUND, "Khách sạn chưa có rate plan nào")
        
       
        
        response_json = []
        data = Utils.compute_price_per_night(rate_plan, result_rt, check_in_date, check_out_date, count_children, total_guest)
        return AppResponse.success(SuccessCodes.get_room_type_by_hotel_id, data)
    except Exception as e:
        return AppResponse.error(ErrorCodes.INTERNAL_SERVER_ERROR, str(e))