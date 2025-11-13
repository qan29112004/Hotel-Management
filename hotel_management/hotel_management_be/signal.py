# hotel_management_be/signals.py
from django.db.models.signals import post_save, post_delete, pre_save
from django.dispatch import receiver
from hotel_management_be.models.hotel import *
from hotel_management_be.models.offer import Offer
from hotel_management_be.models.booking import Payment
from .celery_hotel.task import compute_hotel_calendar_prices
from datetime import date
from libs.Redis import RedisWrapper
import logging
from hotel_management_be.celery_hotel.task import compute_hotel_calendar_prices


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
    
@receiver(post_save, sender=Payment)
def payment_update_paid(sender, instance, **kwargs):
    if(instance.status == "PAID"):
        pass
    pass