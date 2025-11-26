import hashlib
from django.utils import timezone
import os
from django.conf import settings
import pytz
import importlib
from django.utils.encoding import force_str
from django.utils.http import urlsafe_base64_decode
import re
from django.contrib.contenttypes.models import ContentType
import logging
from constants.error_codes import ErrorCodes
import difflib
import datetime
from datetime import time
import holidays
import requests
from django.conf import settings
from hotel_management_be.models.offer import PriceRule, Service
import hashlib, hmac, urllib.parse
from datetime import datetime
from django.conf import settings




class Utils:
    @staticmethod
    def get_token_from_header(request):
        auth_header = request.META.get("HTTP_AUTHORIZATION", "")
        if auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]
        return None

    @staticmethod
    def hash_lib_sha(val):
        return hashlib.sha256(val.encode()).hexdigest()

    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
        if x_forwarded_for:
            return x_forwarded_for.split(",")[0]
        return request.META.get("REMOTE_ADDR")

    @staticmethod
    def get_current_datetime():
        vie_tz = pytz.timezone("Asia/Ho_Chi_Minh")
        return timezone.now().astimezone(vie_tz)

    @staticmethod
    def validate_uidb64(uidb64):
        return force_str(urlsafe_base64_decode(uidb64))

    @staticmethod
    def get_setting(key, default=None, cast_type=None):
        value = getattr(settings, key, os.getenv(key, default))
        if value in [None, ""]:
            return default
        if cast_type:
            try:
                return cast_type(value)
            except (ValueError, TypeError):
                return default
        return value

    # Logging utils
    @staticmethod
    def get_class_with_importlib(module_path: str, wanted_class: str):
        module = importlib.import_module(module_path)
        return getattr(module, wanted_class)

    @staticmethod
    def logger():
        return logging.getLogger(__name__)

    @staticmethod
    def extract_content_type(value):
        if not value:
            raise ValueError(ErrorCodes.CONTENT_TYPE_NOT_FOUND)
        special_case_map = {
            "auth.user": "user.user",
            "django.user": "user.user",
            "default.user": "user.user",
        }
        user_field_keywords = {"created_by", "updated_by", "assigned_by", "modified_by"}
        if any(keyword in value.lower() for keyword in user_field_keywords):
            user_cts = ContentType.objects.filter(model="user")
            if not user_cts.exists():
                raise ValueError(ErrorCodes.CONTENT_TYPE_NOT_FOUND)
            for ct in user_cts:
                if ct.app_label == "user":
                    return ct
            return user_cts.first()

        if "." in value:
            try:
                app_label, model_name = value.strip().split(".")
                app_model = f"{app_label.lower()}.{model_name.lower()}"
                mapped_model = special_case_map.get(app_model, app_model)
                app_label, model_name = mapped_model.split(".")
                return ContentType.objects.get(app_label=app_label, model=model_name)
            except (ValueError, ContentType.DoesNotExist):
                pass

        value_lower = value.lower()
        words = re.findall(r"\b\w+\b", value_lower)
        all_model_paths = []
        model_path_map = {}

        for ct in ContentType.objects.all():
            full_model_path = f"{ct.app_label}.{ct.model}"
            all_model_paths.append(full_model_path)
            model_path_map[full_model_path] = ct

        joined = " ".join(words)
        close_matches = difflib.get_close_matches(
            joined, all_model_paths, n=1, cutoff=0.3
        )

        if close_matches:
            best_match = close_matches[0]
            mapped_match = special_case_map.get(best_match, best_match)
            return model_path_map.get(mapped_match)

        raise ValueError(ErrorCodes.CONTENT_TYPE_NOT_FOUND)
    
    @staticmethod
    def get_path_from_url(url: str) -> str:
        """
        Extracts the file path from a given URL by removing the MEDIA_URL prefix.
        """
        if not url:
            return ""
        if url.startswith('http'):
            url = url.split(settings.MEDIA_URL, 1)[-1]
            url = settings.MEDIA_URL + url
            return url
        
    @staticmethod
    def upload_thumnail(request, field):
        from hotel_management_be.serializers.hotel_serializer import ThumbnailSerializer

        try:
            if f'{field}' in request.data:
                file = request.data[f'{field}']
                serializer = ThumbnailSerializer(data={'file': file}, context={'request': request, 'field': field})
                
                if serializer.is_valid():
                    path_file = serializer.save()
                    return path_file
            
            
        except Exception as e:
            raise e
        
    @staticmethod
    def get_offer_multiplier(hotel, date:None, number_of_day:int=None, min_price:float = None, start_day=None, end_day=None) -> float:
        from hotel_management_be.models.offer import Offer, PriceRule
        from hotel_management_be.models.booking import Booking, BookingRoom
        from hotel_management_be.models.hotel import Room
        

        from django.db.models import Q
        percentage:float = 0
        today = timezone.now().date()
        overlap_booking = hotel.hotel_booking.filter(~Q(status__in=['Cancelled', 'Rejected']), Q(check_in__gte=date)& Q(check_out__lte=date),)
        booked_room_uuids = BookingRoom.objects.filter(
            booking_id__in=overlap_booking
        ).values_list('room_id', flat=True)
        all_room_hotel = Room.objects.filter(room_type_id__hotel_id = hotel)
        if booked_room_uuids and all_room_hotel:
            per =len(booked_room_uuids)/len(all_room_hotel)
            print("ckech Per:", per >= 0.5)
            if per >= 0.5:
                price_rule = PriceRule.objects.get(rule_type = 'Occupancy')
                percentage += price_rule.multiplier
                print("check per value: ",percentage)
        offers = hotel.offers_hotel.all()
        for offer in offers:
            if(offer.amount_days and offer.amount_days < number_of_day):
                percentage += offer.discount_percentage
            if(offer.min_price and offer.min_price < min_price):
                percentage += offer.discount_percentage
            if((offer.start_date and offer.end_date) and (offer.start_date <= start_day and offer.end_date >= end_day)):
                percentage += offer.discount_percentage
        return percentage
    
    @staticmethod
    def compute_calendar_runtime(hotel_id, selected_date, total_guest,list_total_room, amount_children):
        from hotel_management_be.models.hotel import Hotel
        from hotel_management_be.models.offer import PriceRule
        from datetime import date, timedelta, datetime
        from decimal import Decimal
        import holidays
        hotel = Hotel.objects.get(uuid=hotel_id)
        cheapest_room = hotel.RoomType.order_by('base_price').first()
        if cheapest_room:
            base_price = Decimal(cheapest_room.base_price or 0)
        else:
            base_price = 0
        first_day = selected_date.replace(day=1)
        if selected_date.month == 12:
            next_month = selected_date.replace(year=selected_date.year + 1, month=1, day=1)
        else:
            next_month = selected_date.replace(month=selected_date.month + 1, day=1)

        # ngày cuối cùng của tháng là ngày trước ngày đầu tiên của tháng sau
        last_day = next_month - timedelta(days=1)
        rules = PriceRule.objects.all()
        # lấy multiplier của từng rule ra sẵn
        weekend_mul = Decimal(next((r.multiplier for r in rules if r.rule_type == "Weekend"), 1))
        holiday_mul = Decimal(next((r.multiplier for r in rules if r.rule_type == "Holiday"), 1))
        result = []
        for i in range((last_day - first_day).days + 1):
            d = first_day + timedelta(days=i)
            final_price = base_price * Decimal(total_guest) * Decimal(len(list_total_room)) * Decimal((0.9 * amount_children)) if amount_children > 0 else base_price * Decimal(total_guest) * Decimal(len(list_total_room))
            if Utils.get_offer_multiplier(hotel=hotel,date=d) != 0:
                final_price *= Utils.get_offer_multiplier(hotel=hotel, date=d)
            
            is_has_available_room = Utils.check_availavle_room_in_a_date(d, hotel, list_total_room)
            if d.weekday() >=5:
                print(f"{d} | weekday={d.weekday()} | weekend={d.weekday() >= 5}")
                final_price *= weekend_mul
            if Utils.is_holiday(d):
                final_price *= holiday_mul
            result.append({
                "date": d.isoformat(),
                "price": str(final_price),
                "is_available_room":is_has_available_room
            })
            # break
        return result
    
    @staticmethod
    def compute_price_per_night(rate_plan, room_types, check_in, check_out, amount_chilren=0, total_guest=1):
        from decimal import Decimal
        from datetime import timedelta
        from hotel_management_be.serializers.rate_plan_serializer import RatePlanSerializer
        from hotel_management_be.serializers.hotel_serializer import RoomTypeSerializer

        hotel = rate_plan[0].hotel
        rules = PriceRule.objects.all()
        weekend_mul = Decimal(next((r.multiplier for r in rules if r.rule_type == "Weekend"), 1))
        holiday_mul = Decimal(next((r.multiplier for r in rules if r.rule_type == "Holiday"), 1))
        # Tính multiplier sẵn cho từng ngày
        date_multipliers = {}
        total_days = (check_out - check_in).days +1
        for offset in range(total_days):
            day = check_in + timedelta(days=offset)
            mul = Decimal(1)
            if day.weekday() >= 5:
                mul *= weekend_mul
            if Utils.is_holiday(day):
                mul *= holiday_mul
            date_multipliers[day] = mul
            
        print("date_multipliers: ", date_multipliers)

        # Cache serializer
        rate_plan_data = {rp.uuid: RatePlanSerializer(rp).data for rp in rate_plan}
        room_type_data = {rt.uuid: RoomTypeSerializer(rt).data for rt in room_types}

        print("check room type:",room_type_data )
        # Cache offer multiplier
        offer_mul_cache = {}
        for offset in range(total_days):
            day = check_in + timedelta(days=offset)
            offer_mul = Utils.get_offer_multiplier(
                hotel=hotel,
                date=day,
                number_of_day=total_days,
                min_price=None,
            )
            offer_mul_cache[day] = Decimal(offer_mul or 1)
        # offer_mul_cache = {}
        # for rp in rate_plan:
        #     if rp.uuid not in offer_mul_cache:
        #         offer_mul_cache[rp.uuid] = Decimal(Utils.get_offer_multiplier(rp.hotel) or 1) * rp.price_modifier
        print("offer_mul_cache: ",offer_mul_cache)
        result = []
        for rt in room_types:
            base_price = Decimal(rt.base_price or 0)
            room_info = {**room_type_data[rt.uuid], "rate": []}

            for rp in rate_plan:
                rp_data = rate_plan_data[rp.uuid]
                # offer_mul = offer_mul_cache[rp.uuid]
                rp_modified = rp.price_modifier
                included_services = Service.objects.filter(
                    sv_service_rate_plan__rate_plan=rp,
                    type="Include"
                )

                if len(included_services)>0:
                    included_service_total = sum([
                        Decimal(s.price or 0) for s in included_services
                    ]) if included_services else 0
                else:included_service_total = 0
                price_list = []
                for day, mul in date_multipliers.items():
                    final_price = base_price *total_guest * offer_mul_cache[day] * rp_modified * mul  * Decimal(0.9 * amount_chilren) + included_service_total if amount_chilren > 0 else base_price * mul *  offer_mul_cache[day] * rp_modified *total_guest + included_service_total
                    price_list.append({"date": day.isoformat(), "price": str(final_price)})

                room_info["rate"].append({**rp_data, "price": price_list})

            result.append(room_info)

        return result
    
    @staticmethod
    def check_availavle_room_in_a_date(date, hotel,room_requirements ):
        """
        Kieemr tra xem ngày cụ thể của khách sạn cụ thể này còn phòng trống hay không
        """
        from django.db.models import Q
        from hotel_management_be.models.booking import Booking, BookingRoom
        from libs.Redis import RedisUtils
        date_str = date.isoformat()

        # 2) Redis KEYS pattern
        # inventory:<hotel_id>:<room_type_id>:<date_str>
        pattern = f"inventory:{hotel.uuid}:*:{date_str}"
        
        # 3) Find all matching keys
        keys = RedisUtils.r.keys(pattern)
        print('check pattern: ', pattern)
        if keys:
            total_available = 0
            # 4) Get all values using mget
            values = RedisUtils.r.mget(keys)

            for v in values:
                if v is not None:
                    total_available += int(v)

            # 5) Compare with required room quantity
            required_quantity = len(room_requirements)
            if (total_available<required_quantity):return False
        all_room = 0
        room_type_of_hotel = hotel.RoomType.all().prefetch_related('room')
        overlapping_bookings = Booking.objects.filter(
            Q(check_in__lte=date) & Q(check_out__gte=date),
            ~Q(status__in=['Cancelled', 'Rejected']),
            hotel_id = hotel
        )
        print('check booking overlap: ', overlapping_bookings)
        
        booked_room_uuids = BookingRoom.objects.filter(
            booking_id__in=overlapping_bookings
        ).values_list('room_id', flat=True)
        print('check room booking overlap: ', booked_room_uuids)
        
        available_rooms = []

        for rt in room_type_of_hotel:
            rooms = rt.room.filter(status='Available')

            for room in rooms:
                if room.uuid not in booked_room_uuids:
                    # Thêm tuple (room, capacity)
                    available_rooms.append({
                        "room": room,
                        "capacity": rt.max_occupancy
                    })
        print('check available room overlap: ', available_rooms, len(room_requirements))
        if len(available_rooms) < len(room_requirements):
            return False
    
        available_rooms.sort(key=lambda r: r["capacity"], reverse=True)
        room_requirements_sorted = sorted(room_requirements, reverse=True)
        for required_capacity in room_requirements_sorted:
            found = False

            for i, room_info in enumerate(available_rooms):
                if room_info["capacity"] >= required_capacity:
                    print("check capacity: ",room_info["capacity"], required_capacity, room_info["capacity"] >= required_capacity )
                    # Chọn phòng này, xoá khỏi list
                    available_rooms.pop(i)
                    found = True
                    break

            if not found:
                return False
        return True
    
    @staticmethod
    def get_booked_rooms(check_in, check_out):
        """
        Lấy danh sách UUID các phòng đã được book trong khoảng thời gian
        """
        from django.db.models import Q
        from hotel_management_be.models.booking import Booking, BookingRoom
        print(check_in, check_out)
        overlapping_bookings = Booking.objects.filter(
            Q(check_in__lt=check_out) & Q(check_out__gt=check_in),
            ~Q(status__in=['Cancelled', 'Rejected'])
        )
        
        booked_room_uuids = BookingRoom.objects.filter(
            booking_id__in=overlapping_bookings
        ).values_list('room_id', flat=True)
        
        return set(booked_room_uuids)
    
    @staticmethod
    def get_count_hold_rooms(roomType):
        from hotel_management_be.models.booking import HoldRecord
        count_hold_room = HoldRecord.objects.filter(room_type = roomType, status="Hold").count()
        print("count hold room: ", count_hold_room)
        return count_hold_room
    
    @staticmethod
    def can_accommodate(hotel_availability, room_requirements, total_rooms_needed):
        """
        Kiểm tra xem hotel có thể đáp ứng yêu cầu không
        
        Args:
            hotel_availability: List dict có keys 'max_occupancy' và 'available_rooms'
            room_requirements: List số người cho mỗi phòng cần book
            total_rooms_needed: Tổng số phòng cần
        """
        
        print("check data hotel asdas", hotel_availability, room_requirements, total_rooms_needed)
        if not hotel_availability:
            return False
        
        # Sắp xếp yêu cầu theo số người giảm dần
        sorted_requirements = sorted(room_requirements, reverse=True)
        
        # Tạo pool các phòng có sẵn
        room_pool = []
        for rt in hotel_availability:
            for _ in range(rt['available_rooms']):
                room_pool.append(rt['max_occupancy'])
        
        # Sắp xếp room pool theo capacity tăng dần
        room_pool.sort()
        
        # Kiểm tra xem có đủ phòng không
        if len(room_pool) < total_rooms_needed:
            return False
        
        # Greedy matching
        for requirement in sorted_requirements:
            suitable_room_found = False
            for i, capacity in enumerate(room_pool):
                if capacity >= requirement:
                    room_pool.pop(i)
                    suitable_room_found = True
                    break
            
            if not suitable_room_found:
                return False
        
        return True
    
    @staticmethod
    def can_accommodate_roomtype(hotel_availability, room_requirements, total_rooms_needed):
        """
        Kiểm tra xem hotel có thể đáp ứng yêu cầu không
        
        Args:
            hotel_availability: List dict có keys 'max_occupancy' và 'available_rooms'
            room_requirements: List số người cho mỗi phòng cần book
            total_rooms_needed: Tổng số phòng cần
        """
        if not hotel_availability:
            return False, []
        
        # Sắp xếp yêu cầu theo số người giảm dần
        sorted_requirements = sorted(room_requirements, reverse=True)
        
        # Tạo pool các phòng có sẵn
        result_rt=[]
        room_pool = []
        for rt in hotel_availability:
            for _ in range(rt.available_rooms):
                room_pool.append(rt)
        
        # Sắp xếp room pool theo capacity tăng dần
        room_pool.sort(key=lambda x: x.max_occupancy)
        
        # Kiểm tra xem có đủ phòng không
        if len(room_pool) < total_rooms_needed:
            return False, []
        
        # Greedy matching
        for requirement in sorted_requirements:
            suitable_room_found = False
            for i, capacity in enumerate(room_pool):
                if capacity.max_occupancy >= requirement:
                    a = room_pool.pop(i)
                    result_rt.append(a)
                    suitable_room_found = True
                    break
            
            if not suitable_room_found:
                return False, []
        
        return True, result_rt
    @staticmethod
    def check_accomodate_roomtype(hotel_availability, room_requirements, total_rooms_needed):
        if not hotel_availability:
            return False,[]
        result_rt=[]
        hotel_availability.sort(key=lambda x: x.max_occupancy)
        room_pool = []
        for rt in hotel_availability:
            for _ in range(rt.available_rooms):
                room_pool.append(rt)
        
        # Sắp xếp room pool theo capacity tăng dần
        room_pool.sort(key=lambda x: x.max_occupancy)
        # Kiểm tra xem có đủ phòng không
        if len(room_pool) < total_rooms_needed:
            return False,[]
        
        
        for i, capacity in enumerate(hotel_availability):
            if capacity.max_occupancy >= room_requirements:
                result_rt.append(capacity)
        return True,result_rt
        
    
    @staticmethod
    def is_holiday(date: datetime.date) -> bool:
        vn_holidays = holidays.Vietnam(years=date.year)
        return date in vn_holidays
    
    @staticmethod
    def generate_vnpay_url(booking, request=None, session_id=None):
        vnp = settings.VNPAY_CONFIG
        order_id = booking.uuid
        amount = int(booking.total_price) * 100

        # Lấy IP thật (nếu có)
        client_ip = "127.0.0.1"
        if request:
            client_ip = Utils.get_client_ip(request)

        # ===== 1️⃣ Tạo dictionary params =====
        params = {
            "vnp_Version": "2.1.0",
            "vnp_Command": "pay",
            "vnp_TmnCode": vnp["vnp_TmnCode"],
            "vnp_Amount": str(amount),
            "vnp_CurrCode": "VND",
            "vnp_TxnRef": str(order_id),
            "vnp_OrderInfo": f"{session_id}",
            "vnp_OrderType": "other",
            "vnp_Locale": "vn",
            "vnp_ReturnUrl": vnp["vnp_ReturnUrl"],
            "vnp_IpAddr": client_ip,
            "vnp_CreateDate": datetime.now().strftime("%Y%m%d%H%M%S")
        }

        # ===== 2️⃣ Sắp xếp và tạo hash =====
        sorted_params = sorted(params.items())
        queryString = ''
        hasData = ''
        seq = 0
        for key, val in sorted_params:
            if seq == 1:
                queryString = queryString + "&" + key + '=' + urllib.parse.quote_plus(str(val))
            else:
                seq = 1
                queryString = key + '=' + urllib.parse.quote_plus(str(val))

        hashValue = Utils.__hmacsha512(vnp['vnp_HashSecret'], queryString)

        return vnp['vnp_Url'] + "?" + queryString + '&vnp_SecureHash=' + hashValue
    @staticmethod
    def capture_paypal_payment(order_id):
        token = Utils.get_paypal_token()
        url = f"{settings.PAYPAL_CONFIG['api_base']}/v2/checkout/orders/{order_id}/capture"
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        res = requests.post(url, headers=headers)
        res.raise_for_status()
        return res.json()
    @staticmethod
    def get_paypal_token():
        url = f"{settings.PAYPAL_CONFIG['api_base']}/v1/oauth2/token"
        response = requests.post(
            url,
            auth=(
                settings.PAYPAL_CONFIG["client_id"],
                settings.PAYPAL_CONFIG["client_secret"]
            ),
            data={"grant_type": "client_credentials"}
        )
        response.raise_for_status()
        return response.json()["access_token"]
    @staticmethod
    def create_paypal_order(total_price, currency="USD"):
        token = Utils.get_paypal_token()
        url = f"{settings.PAYPAL_CONFIG['api_base']}/v2/checkout/orders"
        payload = {
            "intent": "CAPTURE",
            "purchase_units": [{
                "amount": {"currency_code": currency, "value": str(total_price)}
            }]
        }
        headers = {
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        }
        res = requests.post(url, json=payload, headers=headers)
        res.raise_for_status()
        return res.json()
    
    
    @staticmethod
    def get_client_ip(request):
        x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
        if x_forwarded_for:
            ip = x_forwarded_for.split(',')[0].strip()
        else:
            ip = request.META.get('REMOTE_ADDR')
        return ip
    
    
    @staticmethod
    def __hmacsha512(key, data):
        byteKey = key.encode('utf-8')
        byteData = data.encode('utf-8')
        return hmac.new(byteKey, byteData, hashlib.sha512).hexdigest()
    
    @staticmethod
    
    def validate_response(secret_key, vnp_SecureHash, queryString):
        vnp_SecureHash_Value = vnp_SecureHash
        # Remove hash params
        if 'vnp_SecureHash' in queryString.keys():
            queryString.pop('vnp_SecureHash')

        if 'vnp_SecureHashType' in queryString.keys():
            queryString.pop('vnp_SecureHashType')

        inputData = sorted(queryString.items())
        hasData = ''
        seq = 0
        for key, val in inputData:
            if str(key).startswith('vnp_'):
                if seq == 1:
                    hasData = hasData + "&" + str(key) + '=' + urllib.parse.quote_plus(str(val))
                else:
                    seq = 1
                    hasData = str(key) + '=' + urllib.parse.quote_plus(str(val))
        hashValue = Utils.__hmacsha512(secret_key, hasData)

        print(
            'Validate debug, HashData:' + hasData + "\n HashValue:" + hashValue + "\nInputHash:" + vnp_SecureHash_Value)

        return vnp_SecureHash_Value == hashValue
    @staticmethod
    def format_time(t: time) -> str:
        if not t:
            return None
        hour = t.hour
        minute = t.minute
        ampm = 'a.m' if hour < 12 else 'p.m'
        hour_12 = hour % 12
        if hour_12 == 0:
            hour_12 = 12
        return f"{hour_12}:{minute:02d} {ampm}"
    