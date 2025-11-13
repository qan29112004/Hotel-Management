from datetime import datetime, time
from django.db import models
from django.utils.text import slugify
from .user import User
from shortuuid.django_fields import ShortUUIDField
from utils.base_model import BaseModel
from constants.hotel_constants import HotelConstants
import shortuuid


class Booking(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    user_email = models.CharField(max_length=200, null=True, blank=True)
    user_fullname = models.CharField(max_length=200, null=True, blank=True, default='')
    user_phone=models.CharField(max_length=200, null=True, blank=True, default='')
    user_country = models.CharField(max_length=200, null=True, blank=True, default='')
    hotel_id = models.ForeignKey('hotel_management_be.Hotel', on_delete=models.CASCADE, related_name="hotel_booking", default=None)
    check_in = models.DateField()
    check_out = models.DateField()
    num_guest = models.IntegerField()
    total_price = models.DecimalField(max_digits=30, decimal_places=10)
    status = models.CharField(max_length=20, choices=HotelConstants.BOOKING_STATUS, null=True, blank=True)
    total_rooms = models.IntegerField(default=0)
    
    


class BookingRoom(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    booking_id = models.ForeignKey(Booking, on_delete=models.CASCADE, related_name="booking_booking_room")
    room_id = models.ForeignKey('hotel_management_be.Room', on_delete=models.CASCADE, related_name='room_booking_room')
    rate_plan_id = models.ForeignKey('hotel_management_be.RatePlan', on_delete=models.CASCADE, related_name="rateplan_booking_room")
    price_per_night = models.DecimalField(max_digits=30, decimal_places=10)
    nights = models.IntegerField()
    subtotal = models.DecimalField(max_digits=30, decimal_places=10)
    status = models.CharField(max_length=20, null=True, blank=True, choices=HotelConstants.BOOKING_ROOM_STATUS, default=None)
    
    

class Payment(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    amount = models.DecimalField(max_digits=30, decimal_places=10)
    status = models.CharField(choices=HotelConstants.PAYMENT_STATUS, max_length=20, null=True, blank=True)
    transaction_id = models.CharField(max_length=100, null=True, blank=True)
    method = models.CharField(max_length=20, choices=HotelConstants.PAYMENT_METHOD, null=True, blank=True)
    currency = models.CharField(max_length=10, default="VND")
    booking = models.ForeignKey("hotel_management_be.Booking", on_delete=models.CASCADE, related_name="payments", null=True)

class BookingSession(BaseModel):
    """
    Logical session that groups multiple holds (ephemeral). We persist minimal info for audit.
    """
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    hotel = models.ForeignKey('hotel_management_be.Hotel', on_delete=models.CASCADE)
    checkin = models.DateField()
    checkout = models.DateField()
    requested_rooms = models.PositiveIntegerField(default=1)
    expires_at = models.DateTimeField()

    def __str__(self):
        return str(self.uuid)

class HoldRecord(BaseModel):
    """
    Persistent audit record for holds (optional). We also rely on Redis for realtime holds.
    """
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=100, alphabet="abcdefghjklmnopqrstuvwxyz")
    session = models.ForeignKey(BookingSession, on_delete=models.CASCADE, null=True, blank=True, related_name='holds')
    room_type = models.ForeignKey('hotel_management_be.RoomType', on_delete=models.PROTECT)
    rate_plan =  models.ForeignKey('hotel_management_be.RatePlan', on_delete=models.PROTECT, default='')
    quantity = models.PositiveIntegerField(default=1)
    user_email = models.CharField(max_length=255, blank=True, default='')
    checkin = models.DateField()
    checkout = models.DateField()
    total_price = models.DecimalField(max_digits=30, decimal_places=10, default=0)
    status = models.CharField(max_length=20, choices=HotelConstants.HOLD_RECORD, default='Hold')  # HOLD, CONFIRMED, EXPIRED, RELEASED
    expires_at = models.DateTimeField(null=True, blank=True)

class Refund(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    payment = models.ForeignKey("hotel_management_be.Payment", on_delete=models.CASCADE, related_name="refunds")
    booking_room = models.ForeignKey("hotel_management_be.BookingRoom", on_delete=models.SET_NULL, null=True, blank=True, related_name="refunds")
    amount = models.DecimalField(max_digits=30, decimal_places=10)
    status = models.CharField(max_length=20, choices=HotelConstants.REFUND_STATUS)
    processed_at = models.DateTimeField(auto_now_add=True)