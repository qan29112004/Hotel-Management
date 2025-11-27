# hotel_management_be/signals.py
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from hotel_management_be.models.hotel import *
from hotel_management_be.models.voucher import *

from hotel_management_be.models.offer import Offer
from hotel_management_be.models.booking import Payment, HoldRecord, Booking
from .celery_hotel.task import compute_hotel_calendar_prices
from datetime import date
from libs.Redis import RedisWrapper
import logging
from hotel_management_be.celery_hotel.task import compute_hotel_calendar_prices
from libs.Redis import RedisWrapper, RedisUtils

logger = logging.getLogger(__name__)

ROOMTYPE_PRICE_FIELDS = {'base_price','hotel_id'}
OFFER_PRICE_FIELDS = {
    'discount_percentage', 'amount_days', 'min_price',
    'start_date', 'end_date', 'hotel'
}

def _has_price_field_changed(instance, price_fields):
    """Kiểm tra xem có field nào trong price_fields bị thay đổi không"""
    if not hasattr(instance, '_loaded_values'):
        return False
    for field in price_fields:
        old_val = getattr(instance, f'_old_{field}', None)
        new_val = getattr(instance, field)
        print("check: ",field, old_val, new_val)
        if old_val != new_val:
            return True
    return False

@receiver(pre_save, sender=RoomType)
def roomtype_pre_save(sender, instance, **kwargs):
    print("chạy presave truoc")
    if instance.pk and RoomType.objects.filter(pk=instance.pk).exists():
        old = RoomType.objects.get(pk=instance.pk)
        for field in ROOMTYPE_PRICE_FIELDS:
            setattr(instance, f'_old_{field}', getattr(old, field))
        instance._loaded_values = True

@receiver(pre_save, sender=Offer)
def offer_pre_save(sender, instance, **kwargs):
    if instance.pk and Offer.objects.filter(pk=instance.pk).exists():
        old = Offer.objects.get(pk=instance.pk)
        for field in OFFER_PRICE_FIELDS:
            setattr(instance, f'_old_{field}', getattr(old, field))
        instance._loaded_values = True

@receiver(post_save, sender=RoomType)
def roomtype_post_save(sender, instance, **kwargs):
    print("signal update roomtype")
    print(_has_price_field_changed(instance, ROOMTYPE_PRICE_FIELDS))
    if _has_price_field_changed(instance, ROOMTYPE_PRICE_FIELDS):
        print("signal update roomtype")
        trigger_calendar_recompute(instance.hotel_id)

@receiver(post_save, sender=Offer)
def offer_post_save(sender, instance, **kwargs):
    if _has_price_field_changed(instance, OFFER_PRICE_FIELDS):
        trigger_calendar_recompute(instance.hotel)

@receiver(post_delete, sender=RoomType)
def roomtype_deleted(sender, instance, **kwargs):
    hotel = getattr(instance, 'hotel_id', None)
    if hotel:
        trigger_calendar_recompute(hotel)
@receiver(post_delete, sender=Offer)
def offer_deleted(sender, instance, **kwargs):
    hotel = getattr(instance, 'hotel', None)
    if hotel:
        trigger_calendar_recompute(hotel)

# --- Hàm helper ---
def trigger_calendar_recompute(hotel):
    redis_key = f"calendar_prices"
    
    RedisWrapper.remove_by_prefix(redis_key)
    logger.info(f"[RECOMPUTE] Hotel {hotel.uuid}")
    
@receiver(pre_save, sender=Room)
def payment_update_paid(sender, instance, **kwargs):
    # Chỉ override status dựa trên housekeeping_status nếu:
    # 1. Room mới được tạo, HOẶC
    # 2. Status không phải là "Booked" (để tránh override khi check-in)
    if instance.pk:
        try:
            old_room = Room.objects.get(uuid=instance.uuid)
            # Nếu status đã là "Booked", không override
            # if instance.status == "Booked":
            #     return
            # Chỉ override khi housekeeping_status thay đổi
            if old_room.housekeeping_status != instance.housekeeping_status:
                if instance.housekeeping_status == "In Progress":
                    instance.status = "Maintenance"
                elif instance.housekeeping_status == "Cleaned":
                    instance.status = "Available"
        except Room.DoesNotExist:
            # Room mới, áp dụng logic mặc định
            if instance.housekeeping_status == "In Progress":
                instance.status = "Maintenance"
            elif instance.housekeeping_status == "Cleaned":
                instance.status = "Available"
    else:
        # Room mới, áp dụng logic mặc định
        if instance.housekeeping_status == "In Progress":
            instance.status = "Maintenance"
        elif instance.housekeeping_status == "Cleaned":
            instance.status = "Available"
@receiver(post_save, sender=Booking)
def update_status_room_book(sender, instance, **kwargs):
    print(">>> SIGNAL RUNNING <<<")
    booking_room = instance.booking_booking_room.select_related('room_id')
    hotel_id = instance.hotel_id.uuid
    if(instance.status=="Check In"):
        print(">>> SIGNAL RUNNING CHECK IN<<<")
        for br in booking_room:
            room = br.room_id
            print("check status", room.room_id.status)
            room.status='Booked'
            room.save()
            room.refresh_from_db()

            print(">>> AFTER:", room.status)
    elif(instance.status == "Check Out"):
        print(">>> SIGNAL RUNNING CHECK OUT<<<")
        for br in booking_room:
            room = br.room_id
            print("check status", room.status)
            room.housekeeping_status = 'Dirty'
            room.save()
            room.refresh_from_db()
            room.status = "Release"
            room.save()
            room.refresh_from_db()

            print(">>> AFTER:", room.status)
            roomtype_id = room.room_type_id.uuid
            RedisUtils.atomic_increment_inventory_for_range(
                hotel_id=hotel_id,
                room_type_id=roomtype_id,
                checkin=str(instance.check_in),
                checkout=str(instance.check_out),
                quantity=1
            )
            
            
@receiver(post_delete, sender=Booking)
def update_status_room_book_when_delete(sender, instance, **kwargs):
    print(">>> SIGNAL RUNNING <<<")
    booking_room = instance.booking_booking_room.select_related('room_id')
    
    for room in booking_room:
        print("check status", room.room_id.status)
        room.room_id.status='Available'
        room.room_id.save()
        room.room_id.refresh_from_db()

        print(">>> AFTER:", room.room_id.status)
        
@receiver(post_save, sender=VoucherClaim)
def update_status(sender, instance, **kwargs):
    voucher = instance.voucher
    if instance.usage_count >= voucher.max_usage_per_user:
        instance.status = "EXHAUSTED"
        instance.save()
    