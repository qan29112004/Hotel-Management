import json
from datetime import date, timedelta, datetime
from django_redis import get_redis_connection
from rest_framework.response import Response
from libs.Redis import RedisWrapper
from utils.utils import Utils
from utils.swagger_decorators import auto_schema_post
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny,IsAuthenticated
from constants.success_codes import SuccessCodes
from constants.error_codes import ErrorCodes
from libs.response_handle import AppResponse


@auto_schema_post()
@api_view(['POST'])
@permission_classes([AllowAny])
def get_calendar_prices(request):
    from hotel_management_be.models.offer import DailyHotelPrice
    from hotel_management_be.celery_hotel.task import compute_hotel_calendar_prices
    hotel_id = request.data.get('hotel_id')
    crr_date = request.data.get('crr_date')
    year_month = "-".join(crr_date.split('-')[:2])
    redis_key = f"hotel:{hotel_id}:calendar_prices:{year_month}"

    # 1️⃣ Kiểm tra cache trong Redis
    cached_data = RedisWrapper.get(redis_key)
    if cached_data:
        return AppResponse.success(SuccessCodes.CALENDAR_PRICE,cached_data)

    # 2️⃣ Nếu chưa có, check DB (DailyHotelPrice)
    selected_date = datetime.strptime(crr_date, "%Y-%m-%d").date()
    first_day = selected_date.replace(day=1)
    if selected_date.month == 12:
        next_month = selected_date.replace(year=selected_date.year + 1, month=1, day=1)
    else:
        next_month = selected_date.replace(month=selected_date.month + 1, day=1)

    # ngày cuối cùng của tháng là ngày trước ngày đầu tiên của tháng sau
    last_day = next_month - timedelta(days=1)
    # qs = DailyHotelPrice.objects.filter(
    #     hotel_id=hotel_id,
    #     date__range=(first_day, last_day)
    # ).order_by("date")

    # if qs.exists():
    #     data = [{"date": p.date.isoformat(), "final_price": float(p.final_price)} for p in qs]
    #     # Cache lại vào Redis (TTL = 3 giờ)
    #     RedisWrapper.save(redis_key, data, 600)
    #     return AppResponse.success(SuccessCodes.CALENDAR_PRICE,data)

    # 3️⃣ Nếu DB chưa có → tạm tính runtime và trigger Celery
    # compute_hotel_calendar_prices.delay(hotel_id, selected_date)
    data = Utils.compute_calendar_runtime(hotel_id, selected_date)
    RedisWrapper.save(redis_key, data, 600)
    return AppResponse.success(SuccessCodes.CALENDAR_PRICE,data)
