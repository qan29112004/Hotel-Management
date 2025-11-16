from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.booking import *
from django.core.files.storage import default_storage
from hotel_management_be.models.hotel import Hotel
from hotel_management_be.models.offer import Offer

class OfferSerializer(serializers.ModelSerializer):
    hotel = serializers.PrimaryKeyRelatedField(queryset=Hotel.objects.all())
    updated_by = serializers.SerializerMethodField()
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
    class Meta:
        model = Offer
        fields = ['uuid', 'title', 'description', 'images', 'code', 'amount_days','is_active','min_price','end_date','start_date','discount_percentage','hotel', 'created_by', 'updated_by','created_at','updated_at']
