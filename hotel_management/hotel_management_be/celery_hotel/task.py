import json
import redis
from celery import shared_task
from django.utils import timezone
from django.conf import settings
from utils.utils import Utils
from hotel_management_be.models.hotel import *
from hotel_management_be.models.offer import *
from hotel_management_be.models.booking import *
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
import logging

logger = logging.getLogger(__name__)
from libs.Redis import RedisWrapper, RedisUtils
from hotel_management_be.kafka.kafka_producer import publish_kafka_event

def handle_room_hold_released(event):
    payload = event["payload"]
    hold_id = payload["hold_id"]
    print(f"[Kafka] 🟠 Hold released: {hold_id}")

    # DB update
    hr = HoldRecord.objects.filter(uuid=hold_id).first()
    if hr and hr.status != "Expired":
        hr.status = "Expired"
        hr.save(update_fields=["status"])

    # Xoá Redis nếu còn
    RedisUtils.delete_hold_in_redis(hold_id)

@shared_task
def compute_hotel_calendar_prices(hotel_id, selected_date):
    from datetime import date, timedelta, datetime
    from django_redis import get_redis_connection
    from utils.utils import Utils
    import json
    first_day = selected_date.replace(day=1)
    if selected_date.month == 12:
        next_month = selected_date.replace(year=selected_date.year + 1, month=1, day=1)
    else:
        next_month = selected_date.replace(month=selected_date.month + 1, day=1)

    # ngày cuối cùng của tháng là ngày trước ngày đầu tiên của tháng sau
    last_day = next_month - timedelta(days=1)
    hotel = Hotel.objects.get(uuid=hotel_id)
    room_type = RoomType.objects.filter(hotel=hotel).order_by("base_price").first()
    if not room_type:
        return

    base = room_type.base_price
    prices = []

    for i in range((last_day - first_day).days):
        d = first_day + timedelta(days=i)
        offer = Utils.get_offer_multiplier(hotel)
        if offer !=0:
            final = base  * offer
        final=base

        # DailyHotelPrice.objects.update_or_create(
        #     hotel=hotel,
        #     date=d,
        #     defaults={"base_price": base, "final_price": final},
        # )
        

        prices.append({"date": d.isoformat(), "final_price": str(final)})

    # --- Cập nhật Redis cache ---
    redis_key = f"hotel:{hotel_id}:calendar_prices"
    RedisWrapper.save(redis_key, prices, 600)
    
# @shared_task
# def enqueue_hold_created_event(payload):
#     # optional: publish to Kafka or other downstream systems
#     from .kafka_producer import publish_kafka_event
#     try:
#         publish_kafka_event("room_hold_created", payload)
#     except Exception:
#         # swallow/log
#         pass


@shared_task
def reconcile_expired_holds():
    """
    Periodic safety net: find expired holds and release them + send Kafka event
    """
    now = timezone.now()
    expired = HoldRecord.objects.filter(status='Hold', expires_at__lt=now)

    for hr in expired:
        try:
            RedisUtils.atomic_increment_inventory_for_range(
                hr.session.hotel_id,
                hr.room_type_id,
                hr.checkin.isoformat(),
                hr.checkout.isoformat(),
                hr.quantity
            )
        except Exception as e:
            print(f"[WARN] Inventory increment failed: {e}")

        hr.status = 'Expired'
        hr.save()

        try:
            handle_room_hold_released({
                "hold_id": str(hr.hold_id),
                "session_id": str(hr.session.session_id),
                "hotel_id": hr.session.hotel_id,
                "room_type_id": hr.room_type_id,
                "quantity": hr.quantity,
                "released_at": now.isoformat()
            })
        except Exception as e:
            print(f"[Kafka]  Failed to send room_hold_released: {e}")
            
            
@shared_task(bind=True)
def monitor_session_task(self, session_id):
    logger.info(f"=== TASK STARTED for session {session_id} ===") 
    exist, ttl = RedisUtils.check_session(session_id)
    logger.info(f"check_session returned: exist={exist}, ttl={ttl}") 
    message = {
        "session_id":session_id,
        "exist":exist,
        "ttl":ttl
    }
    logger.info(f"Publishing session {session_id}: exist={exist}, ttl={ttl}")
    RedisUtils.r.publish("session_status_channel", json.dumps(message))
    # === QUAN TRỌNG: LÊN LỊCH LẠI DỰA TRÊN TTL THỰC TẾ ===
    if exist and ttl not in (None, 0):
        # Lên lịch chạy lại ngay trước hoặc SAU khi hết hạn
        if ttl > 60:
            countdown = 60
        else:
            countdown = ttl + 5  # chạy SAU khi hết hạn 5s → chắc chắn bắt được exist=False
    else:
        # Key không tồn tại hoặc hết hạn → không lên lịch nữa
        return

    self.apply_async((session_id,), countdown=countdown)
    
    
@shared_task
def cleanup_old_inventory():
    from datetime import date
    """
    Dọn các key inventory cũ (ngày < hôm nay) trong Redis.
    """
    today = timezone.now().date()
    pattern = "inventory:*:*:*"

    deleted = 0
    for key in RedisUtils.r.scan_iter(match=pattern, count=500):
        try:
            key_str = key.decode() if isinstance(key, bytes) else key
            parts = key_str.split(":")
            if len(parts) == 4:
                date_str = parts[-1]
                key_date = date.fromisoformat(date_str)
                if key_date < today:
                    RedisUtils.r.delete(key)
                    deleted += 1
        except Exception:
            continue

    print(f"[cleanup_old_inventory] Deleted {deleted} outdated keys")
    
    
@shared_task
def set_booking_room(session_id, booking_id):
    import random
    from decimal import Decimal
    from django.db.models import Q
    booking = Booking.objects.get(uuid=booking_id)
    # Lấy tất cả HoldRecord thuộc session_id đó
    hold_records = HoldRecord.objects.filter(session__uuid=session_id, status__in=["Hold","Confirmed"])
    booked_room = BookingRoom.objects.filter(Q(booking_id__check_in__lt=booking.check_out)& Q(booking_id__check_out__gt=booking.check_in))
    conflict_room_ids = booked_room.values_list("room_id", flat=True)
    for hold in hold_records:
        # Lấy danh sách room thuộc roomtype này, đang available
        available_rooms = list(Room.objects.filter(
            room_type_id=hold.room_type, status="Available"
        ).exclude(uuid__in=conflict_room_ids))

        # Nếu không đủ phòng
        if len(available_rooms) < hold.quantity:
            print(f"⚠️ Không đủ phòng available cho room_type {hold.room_type.name}")
            continue

        # Random các phòng
        selected_rooms = random.sample(available_rooms, hold.quantity)

        nights = (hold.checkout - hold.checkin).days
        price_per_night = Decimal(hold.total_price) / Decimal(max(nights, 1) * hold.quantity)
        # 🔥 LẤY TẤT CẢ SERVICE CỦA HOLD NÀY
        hold_services = HoldRecordService.objects.filter(hold=hold)
        for room in selected_rooms:
            booking_room = BookingRoom.objects.create(
                booking_id=booking,
                room_id=room,
                rate_plan_id=hold.rate_plan,
                price_per_night=price_per_night,
                nights=nights,
                subtotal=price_per_night * nights,
                status="Booked",
            )

            # Cập nhật trạng thái phòng → Booked
            # room.status = "Booked"
            # room.save()
            for hs in hold_services:
                BookingRoomService.objects.create(
                    room=booking_room,
                    service=hs.service,
                    quantity=hs.quantity,
                    price=hs.price,
                )
            
@shared_task
def send_booking_email(data: dict):
    """
    data = {
        "to_email": "",
        "user_name": "",
        "hotel_name": "",
        "checkin": "",
        "checkout": "",
        "room_type": "",
        'check_in_time',
        'check_out_time'
    }
    """
    print("chay ham sane email")
    html_content = render_to_string("booking/booking_confirm.html", data)

    subject = "Booking Confirmation"
    from_email = None  # sẽ dùng DEFAULT_FROM_EMAIL
    to = [data["to_email"]]

    msg = EmailMultiAlternatives(subject, "", from_email, to)
    msg.attach_alternative(html_content, "text/html")

    msg.send()

    return "Email sent!"