from datetime import datetime, time
from django.db import models
from django.utils.text import slugify
from .user import User
from shortuuid.django_fields import ShortUUIDField
from utils.base_model import BaseModel
from constants.hotel_constants import HotelConstants
import shortuuid

class ReviewRating(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    review = models.TextField(max_length=200)
    rating = models.FloatField()
    hotel = models.ForeignKey("hotel_management_be.Hotel", on_delete=models.CASCADE, related_name='hotel_review') 
    booking=models.OneToOneField("hotel_management_be.Booking", on_delete=models.CASCADE, related_name='booking_review',null=True, blank=True, default=None)
    subject = models.CharField(max_length=50, default='')
    is_active = models.BooleanField(default=True)
    
class ReviewImages(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    review = models.ForeignKey(ReviewRating, on_delete=models.CASCADE, related_name='review_images')
    images = models.CharField(max_length=255, null=True, blank=True)
    