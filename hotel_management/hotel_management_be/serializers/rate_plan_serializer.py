from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.booking import *
from django.core.files.storage import default_storage
from hotel_management_be.models.hotel import Hotel
from hotel_management_be.models.offer import RatePlan


class RatePlanSerializer(serializers.ModelSerializer):
    hotel = serializers.PrimaryKeyRelatedField(queryset = Hotel.objects.all())
    class Meta:
        model = RatePlan
        fields = ['uuid','name','description','price_modifier','is_active','refundable','is_breakfast','hotel']