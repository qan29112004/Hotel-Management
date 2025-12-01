import datetime
from datetime import date, timezone, datetime, timedelta

from django.db.models import Sum, Count, Avg, F, ExpressionWrapper, DateTimeField, Func, Case, When, FloatField
from django.db.models.functions import TruncMonth
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser

from libs.response_handle import AppResponse
from constants.error_codes import ErrorCodes
from constants.success_codes import SuccessCodes
from hotel_management_be.models.booking import Booking, BookingRoom, Payment
from hotel_management_be.models.hotel import Hotel, RoomType, Room
from hotel_management_be.models.user import User
from hotel_management_be.models.rating import ReviewRating
from constants.hotel_constants import HotelConstants


class UnixToDatetime(Func):
    function = 'FROM_UNIXTIME'
    output_field = DateTimeField()

@api_view(["GET"])
@permission_classes([IsAdminUser])
def dashboard_overview(request):
    """
    Tổng hợp KPI cho Dashboard admin:
    - Doanh thu theo tháng + 4 tuần gần nhất
    - Booking theo trạng thái
    - Tỷ lệ lấp phòng theo khách sạn (số phòng được đặt / tổng phòng)
    - Tổng số người dùng theo tháng
    - Đánh giá trung bình toàn hệ thống
    """
    try:
        today = date.today()
        current_year = today.year
        start_year_ts = int(datetime(current_year, 1, 1, tzinfo=timezone.utc).timestamp())
        end_year_ts = int(datetime(current_year + 1, 1, 1, tzinfo=timezone.utc).timestamp())

        # === 1. Doanh thu theo tháng (12 tháng gần nhất, status = Paid) ===

        monthly_revenue_qs = (
            Payment.objects.filter(
                status="Paid",
                booking__check_in__year=current_year,
            )
            .annotate(
                # Tạo giá trị tiền đã chuyển đổi
                amount_converted=Case(
                    When(currency='USD', then=F('amount') * 25000),
                    default=F('amount'),
                    output_field=FloatField()
                ),
                month=TruncMonth("booking__check_in")
            )
            .values("month")
            .annotate(total=Sum("amount_converted"))
            .order_by("month")
        )

        monthly_data = {item['month'].month: float(item['total'] or 0) for item in monthly_revenue_qs}

        monthly_revenue = []
        for month in range(1, 13):
            monthly_revenue.append({
                "month": month,
                "year": current_year,
                "total": monthly_data.get(month, 0),
            })  

        # === 1b. Doanh thu theo tuần (4 tuần gần nhất) ===
        start_4_weeks_ago = today - timedelta(weeks=4)
        weekly_payments = Payment.objects.filter(
            status="Paid",
            booking__check_in__gte=start_4_weeks_ago,
        ).order_by("booking__check_in")

        weekly_revenue = []
        for i in range(4):
            week_start = start_4_weeks_ago + timedelta(weeks=i)
            week_end = week_start + timedelta(weeks=1)
            total_week = (
                weekly_payments.filter(
                    booking__check_in__gte=week_start,
                    booking__check_in__lt=week_end,
                ).aggregate(total=Sum("amount"))["total"]
                or 0
            )
            weekly_revenue.append(
                {
                    "week_start": week_start.isoformat(),
                    "week_end": week_end.isoformat(),
                    "total": float(total_week),
                }
            )

        # === 2. Booking theo trạng thái ===
        status_values = [s[0] for s in HotelConstants.BOOKING_STATUS]
        booking_status_qs = (
            Booking.objects.filter(status__in=status_values)
            .values("status")
            .annotate(count=Count("uuid"))
        )

        booking_by_status = [
            {"status": item["status"], "count": item["count"]}
            for item in booking_status_qs
        ]

        # === 3. Tỷ lệ lấp phòng theo khách sạn ===
        # Tổng phòng theo khách sạn (dựa trên RoomType.total_rooms)
      

        total_rooms_per_hotel = (
            Room.objects.values("room_type_id__hotel_id__uuid", "room_type_id__hotel_id__name")
            .annotate(total_rooms=Count("uuid"))
        )

        total_rooms_map = {
            item["room_type_id__hotel_id__uuid"]: {
                "hotel_uuid": item["room_type_id__hotel_id__uuid"],
                "hotel_name": item["room_type_id__hotel_id__name"],
                "total_rooms": item["total_rooms"] or 0,
            }
            for item in total_rooms_per_hotel
        }

        # Số phòng được đặt theo khách sạn (BookingRoom join Booking)
        active_status = ["Pending", "Confirm", "Check In", "Check Out", "Paid"]
        booked_rooms_qs = (
            BookingRoom.objects.filter(
                booking_id__status__in=active_status,
            )
            .values(
                "booking_id__hotel_id__uuid",
                "booking_id__hotel_id__name",
            )
            .annotate(booked_rooms=Count("room_id", distinct=True))
        )

        occupancy_per_hotel = []
        for item in booked_rooms_qs:
            hotel_uuid = item["booking_id__hotel_id__uuid"]
            total_rooms_info = total_rooms_map.get(hotel_uuid)
            total_rooms = total_rooms_info["total_rooms"] if total_rooms_info else 0
            booked_rooms = item["booked_rooms"] or 0
            occupancy_rate = float(booked_rooms) / \
                float(total_rooms) if total_rooms > 0 else 0.0

            occupancy_per_hotel.append(
                {
                    "hotel_uuid": hotel_uuid,
                    "hotel_name": item["booking_id__hotel_id__name"],
                    "booked_rooms": booked_rooms,
                    "total_rooms": total_rooms,
                    "occupancy_rate": occupancy_rate,
                }
            )
        
        # === 4. Tổng số người dùng theo tháng (trong năm hiện tại) ===
        users_monthly_qs = (
            User.objects.filter(created_at__gte=start_year_ts,created_at__lt=end_year_ts)
            .annotate(created_dt=UnixToDatetime(F('created_at')))  # convert Unix -> datetime
            .annotate(month=TruncMonth('created_dt'))  
            .values("month")
            .annotate(total=Count("id"))
            .order_by("month")
        )

        users_monthly = [
            {
                "month": item["month"].month,
                "year": item["month"].year,
                "total": item["total"],
            }
            for item in users_monthly_qs
        ]

        # === 5. Đánh giá trung bình toàn hệ thống ===
        rating_agg = ReviewRating.objects.filter(is_active=True).aggregate(
            avg_rating=Avg("rating"), total_reviews=Count("uuid")
        )

        rating_info = {
            "average_rating": float(rating_agg["avg_rating"] or 0),
            "total_reviews": rating_agg["total_reviews"] or 0,
        }

        data = {
            "revenue": {
                "monthly": monthly_revenue,
                "weekly": weekly_revenue,
            },
            "booking_status": booking_by_status,
            "occupancy": occupancy_per_hotel,
            "users_monthly": users_monthly,
            "rating": rating_info,
        }

        return AppResponse.success(SuccessCodes.DEFAULT, data=data)
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))


