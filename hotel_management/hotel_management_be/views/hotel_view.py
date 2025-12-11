import json
from constants.hotel_constants import HotelConstants
from utils.swagger_decorators import auto_schema_post, auto_schema_get, auto_schema_delete, auto_schema_patch, auto_schema_put
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from django.db.models import Q, F, FloatField, Subquery, Count, ExpressionWrapper, Sum, IntegerField, Avg
from rest_framework.permissions import AllowAny,IsAuthenticated, IsAdminUser
from libs.response_handle import AppResponse
from hotel_management_be.models.user import User
from rest_framework.decorators import api_view
from constants.success_codes import SuccessCodes
from configuration.jwt_config import JwtConfig
from hotel_management_be.serializers.hotel_serializer import *
from hotel_management_be.models.booking import Booking
from datetime import date

from django.contrib.auth import authenticate
from constants.error_codes import ErrorCodes
from django.contrib.auth.models import update_last_login
from libs.Redis import RedisWrapper
from libs.querykit.querykit_serializer import (
    QuerykitSerializer,
)
from django.db import transaction
from libs.querykit.querykit import Querykit
from libs.pagination import MyPagination
from validators.validator import Validator
from utils.utils import Utils
from django.db.models.functions import Cast, Coalesce


@auto_schema_post(HotelCreateSerializer)
@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_hotel(request):
    if 'thumbnail' in request.data:
        thumbnail = Utils.upload_thumnail(request, 'thumbnail')
        request.data['thumbnail'] = thumbnail
    try:
        serializers = HotelCreateSerializer(data=request.data)
        if serializers.is_valid():
            new_hotel = serializers.save()
            return AppResponse.success(SuccessCodes.CREATE_HOTEL, data={'hotel':HotelSerializer(new_hotel).data})
        return AppResponse.error(
            ErrorCodes.CREATE_HOTEL_FAIL,
            serializers.errors
        )
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_HOTEL_FAIL, str(e))
    
@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_hotel(request):
    try:
        list_hotel = Hotel.objects.all()
        paginated_hotel, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=list_hotel).values()
        serializers = HotelSerializer(paginated_hotel, many=True)
        return AppResponse.success(SuccessCodes.LIST_DESTINATION, data={'data':serializers.data, 'total':total})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_DESTINATION_FAIL, str(e))

@auto_schema_patch(HotelSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(HotelSerializer)
@permission_classes([IsAdminUser])
@api_view(['PATCH', 'DELETE', 'GET'])
def hotel_detail(request, uuid):
    try:
        hotel = Hotel.objects.get(uuid__icontains=uuid)
        if request.method == 'GET':
            serializer = HotelDetailSerializer(hotel)
            return AppResponse.success(SuccessCodes.GET_HOTEL_ID,serializer.data)
            
        
        if request.method == 'PATCH':
            # Check for active bookings only if changing critical fields
            data = request.data.copy()

            # Danh sách field được phép update ngay cả khi có booking
            # Bao gồm cả các field không phải model fields (deleted_*, images, etc.)
            allowed_fields = ['name', 'description', 'thumbnail', 'deleted_thumbnail', 
                            'deleted_images[]', 'status','facilities','service', 'images', 'updated_by']

            # Lấy dữ liệu cũ của hotel để so sánh
            old_data = HotelSerializer(hotel).data

            # Kiểm tra xem có field quan trọng nào thay đổi không
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
                active_bookings = Booking.objects.filter(
                    hotel_id=hotel,
                    check_out__gte=today,
                    status__in=['Pending', 'Confirm', 'Check In']
                )
                
                if active_bookings.exists():
                    furthest_checkout = Utils.get_furthest_checkout_date(active_bookings)
                    return AppResponse.error(
                        ErrorCodes.VALIDATION_ERROR, 
                        f"Không thể cập nhật do đã có phòng được book trong tương lai. Bạn chỉ có thể thực hiện thao tác này sau ngày {furthest_checkout.strftime('%d/%m/%Y')}"
                    )
            if 'thumbnail' in request.data:
                thumbnail = Utils.upload_thumnail(request, 'thumbnail')
                print("thumnail", thumbnail)
                request.data['thumbnail'] = thumbnail
            deleted_thumbnail = Utils.get_path_from_url(request.data.get('deleted_thumbnail'))
            if deleted_thumbnail and deleted_thumbnail == hotel.thumbnail:
                default_storage.delete(deleted_thumbnail.replace('/media/', ''))
                hotel.thumbnail = None

            # Xử lý xóa images
            deleted_images = request.data.getlist('deleted_images[]')
            if deleted_images:
                for path in deleted_images:
                    path = Utils.get_path_from_url(path)
                    HotelImage.objects.filter(hotel=hotel, image_url__icontains=path).delete()
                    default_storage.delete(path.replace('/media/', ''))
            serializer = HotelCreateSerializer(hotel, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_DESTINATION, data={"data": HotelSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_DESTINATION_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            # Check for active bookings
            today = date.today()
            active_bookings = Booking.objects.filter(
                hotel_id=hotel,
                check_out__gte=today,
                status__in=['Pending', 'Confirm', 'Check In']
            )
            
            if active_bookings.exists():
                furthest_checkout = Utils.get_furthest_checkout_date(active_bookings)
                return AppResponse.error(
                    ErrorCodes.VALIDATION_ERROR, 
                    f"Không thể xóa khách sạn do đã có phòng được booking trong tương lai. Bạn chỉ có thể thực hiện thao tác này sau ngày {furthest_checkout.strftime('%d/%m/%Y')}"
                )


            hotel_images = HotelImage.objects.filter(hotel=hotel)
            print("hotel_images", hotel_images)
            for img in hotel_images:
                if img.image_url:
                    try:
                        print("delete image", img.image_url)
                        default_storage.delete(img.image_url.replace('/media/', ''))
                    except Exception as e:
                        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
            if hotel.thumbnail not in [None, '']:
                print("delete thumbnail", hotel.thumbnail)
                default_storage.delete(hotel.thumbnail.replace('/media/', ''))
            hotel.delete()
            return AppResponse.success(SuccessCodes.DELETE_DESTINATION)

    except hotel.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "hotel not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
   
@api_view(['POST'])
def explore_hotels(request):
    from datetime import date, timedelta, datetime
    des = request.data.get('destination','')
    check_in = request.data.get('check_in','')
    check_out = request.data.get('check_out','')
    code = request.data.get('code','')
    rooms = request.data.get('rooms',[])
    sort = request.data.get("sort", "")
    facilities = request.data.get('facilities', [])  # Get facilities filter
    # Handle facilities as list or string
    if isinstance(facilities, str):
        facilities = [f.strip() for f in facilities.split(',') if f.strip()] if facilities else []
    elif not isinstance(facilities, list):
        facilities = []
    my_pagination = MyPagination()
    my_pagination_1 = MyPagination()
    total_rooms_needed = len(rooms)
    room_requirements = [room['adults'] + room['children'] for room in rooms]
    count_children = sum([room['children'] for room in rooms])
    if check_in and check_out:
        check_in_date = datetime.strptime(check_in, "%Y-%m-%d").date()
        check_out_date = datetime.strptime(check_out, "%Y-%m-%d").date()
    
    
    try:
        if code:
            hotels = Hotel.objects.filter(offers_hotel__code = code, status="Active").prefetch_related('RoomType__room')
        else:hotels = Hotel.objects.filter(status="Active").prefetch_related('RoomType__room')

        if des:  # chỉ lọc khi des có giá trị (không None, không rỗng)
            hotels = hotels.filter(destination__uuid=des)
        
        # Filter by facilities if provided
        if facilities and len(facilities) > 0:
            # Filter hotels that have all selected facilities
            # Use annotation to count matching facilities and filter to hotels with all
            hotels = hotels.annotate(
                matching_facilities_count=Count(
                    'hotel_facilities',
                    filter=Q(hotel_facilities__facilities__uuid__in=facilities),
                    distinct=True
                )
            ).filter(matching_facilities_count=len(facilities)).distinct()
        hotels = hotels.annotate(
            average_rating=Avg("hotel_review__rating"),
            rating_count=Count("hotel_review")
        )

        if sort == "name_asc":
            hotels = hotels.order_by("name")
        elif sort == "name_desc":
            hotels = hotels.order_by("-name")
        elif sort == "rating_desc":
            hotels = hotels.order_by("-average_rating")
        elif sort == "rating_asc":
            hotels = hotels.order_by("average_rating")
        # List để chứa các hotel object thỏa mãn
        
        available_hotels = []
        booked_rooms = set()
        print("check hotel: ",hotels)
        # Lấy các phòng đã được book trong khoảng thời gian (query 1 lần thôi)
        if check_in and check_out:
            booked_rooms = Utils.get_booked_rooms(check_in, check_out)
            print("check room da dat: ",booked_rooms )
        for hotel in hotels:
            total_price = 0
            # Lấy tất cả room types của hotel
            if check_in and check_out:
                for i in range((check_out_date - check_in_date).days):
                    date = check_in_date + timedelta(days=i)
                    total_price += Utils.compute_price_explore_hotel(hotel.uuid, date, sum(room_requirements), room_requirements, count_children)
            room_types = hotel.RoomType.all()
            print("check hotel loop: ",hotel)
            print("check roontype: ",room_types)
            # Kiểm tra từng room type xem có đủ phòng trống không
            available_room_types = []
            
            for room_type in room_types:
                # Lấy tất cả phòng của room type này
                all_rooms = room_type.room.filter(status='Available', is_lock=False)
                print("check roomtype: ", room_type)
                # Đếm số phòng chưa bị book
                available_count = sum(
                    1 for room in all_rooms 
                    if not booked_rooms or room.uuid not in booked_rooms
                )
                print("count: ", available_count)
                
                if available_count and available_count > 0:
                    # Thêm field available_rooms vào room_type object
                    room_type.available_rooms = available_count
                    available_room_types.append(room_type)
            
            # Prepare data cho can_accommodate
            hotel_availability = [
                {
                    'max_occupancy': rt.max_occupancy,
                    'available_rooms': rt.available_rooms
                }
                for rt in available_room_types
            ]
            print("check data hotel asdas",hotel_availability, room_requirements, total_rooms_needed )
            
            # Kiểm tra xem hotel có thể đáp ứng được yêu cầu không
            if Utils.can_accommodate(hotel_availability, room_requirements, total_rooms_needed):
                # Gán available_room_types vào hotel object
                hotel.available_room_types = available_room_types
                hotel.price = total_price
                # Thêm hotel object vào list
                available_hotels.append(hotel)
                
        paginated = my_pagination.paginate_queryset(available_hotels, request)
        serializers = HotelSerializer(paginated, many=True)
        exclude_hotel_id = [hotel.uuid for hotel in available_hotels]
        paginated_exclude_hotel = my_pagination_1.paginate_queryset(Hotel.objects.filter(status="Active").exclude(uuid__in =exclude_hotel_id), request, 2)
        serializers_exclude_hotel = HotelSerializer(paginated_exclude_hotel,many=True)
        return AppResponse.success(SuccessCodes.EXPLORE_HOTELS, data={**my_pagination.get_paginated_response(serializers.data),**my_pagination_1.get_paginated_exclude_response(serializers_exclude_hotel.data)})
        
    except Exception as e:
        return AppResponse.error(ErrorCodes.NOT_FOUND, str(e))
    

@api_view(['POST'])
def check_available_room(request):
    from datetime import datetime, timedelta
    check_in = request.data.get('checkin','')
    check_out = request.data.get('checkout','')
    hotel_id = request.data.get('hotel_id','')
    rooms = request.data.get('rooms',[])  
    room_requirements = [room['adults'] + room['children'] for room in rooms]
    
    hotel = Hotel.objects.get(uuid=hotel_id, status="Active")
    
    # 1) Convert string yyyy-mm-dd → date
    check_in = datetime.strptime(check_in, "%Y-%m-%d").date()
    check_out = datetime.strptime(check_out , "%Y-%m-%d").date()

    # 2) Lặp qua từng ngày từ check_in đến check_out - 1
    days = []
    cur = check_in

    while cur < check_out:
        days.append(cur)
        cur += timedelta(days=1)

    # Kiểm tra kết quả
    for d in days:
        print(d, d.isoformat())
        if(Utils.check_availavle_room_in_a_date(d, hotel,room_requirements) == False):return AppResponse.success(SuccessCodes.EXPLORE_HOTELS, {'status':False})
    return AppResponse.success(SuccessCodes.EXPLORE_HOTELS, {'status':True})