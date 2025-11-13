from datetime import datetime, time
from decimal import ROUND_HALF_UP, Decimal
from django.db import models
from django.utils.text import slugify
from .user import User
from shortuuid.django_fields import ShortUUIDField
from utils.base_model import BaseModel
from constants.hotel_constants import HotelConstants
import shortuuid
from django.core.validators import MinValueValidator, MaxValueValidator

class Offer(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    title = models.CharField(max_length=200, blank=True,null=True)
    description = models.TextField(blank=True, null=True)
    code = models.CharField(max_length=50, unique=True)
    discount_percentage = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    start_date = models.DateField(null=True, blank=True)
    end_date = models.DateField(null=True, blank=True)
    min_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    amount_days = models.IntegerField(default=0)
    
    
    hotel = models.ForeignKey('hotel_management_be.Hotel', on_delete=models.CASCADE, related_name='offers_hotel', null=True, blank=True)
    
    def __str__(self):
        return self.title
    
    
class RatePlan(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    name = models.CharField(max_length=200, blank=True,null=True)
    description = models.TextField(blank=True, null=True)
    price_modifier = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True)
    is_active = models.BooleanField(default=True)
    refundable = models.BooleanField(default=False)
    is_breakfast = models.BooleanField(default=False)
    guarantee_policy = models.TextField(null=True, blank=True, default='')
    cancellation_policy = models.TextField(null=True, blank=True, default='')
    
    hotel = models.ForeignKey('hotel_management_be.Hotel', on_delete=models.CASCADE, related_name='rate_plans_hotel', null=True, blank=True)
    #service
    def __str__(self):
        return self.name
    
class PriceRule(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    rule_type = models.CharField(max_length=50, choices=HotelConstants.RULE_PRICE,null=True, blank=False)
    multiplier = models.DecimalField(
        max_digits=3,
        decimal_places=2,
        default=1.00,
        validators=[
            MinValueValidator(0.00),
            MaxValueValidator(2.00)
        ]
    )
    
    
class DailyHotelPrice(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    hotel_id = models.ForeignKey('hotel_management_be.Hotel', on_delete=models.CASCADE, related_name='daily_price')
    date = models.DateField(null=True, blank=True)
    final_price = models.DecimalField(max_digits=15, decimal_places=2)
    base_price = models.DecimalField(max_digits=15, decimal_places=2)
    availability_status = models.CharField(choices=HotelConstants.AvailabilityStatus, default="Open", max_length=20, null=True, blank = True)
    def save(self, *args, **kwargs):
        self.base_price = self.base_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.final_price = self.final_price.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        super(DailyHotelPrice, self).save(*args, **kwargs) # Call the real save() method