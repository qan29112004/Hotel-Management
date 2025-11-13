from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.hotel import *


class RoomTypeAmenitySerializer(serializers.ModelSerializer):
    amenity_id = serializers.CharField(read_only=True, source="amenity.uuid")
    amenity_name = serializers.CharField(read_only=True, source= "amenity.name")
    amenity_icon = serializers.CharField(read_only=True, source= "amenity.icon")
    class Meta:
        model = RoomTypeAmenity
        fields=['amenity_id','amenity_name','amenity_icon','is_default']
        
        
class RoomTypeByHotelId(serializers.ModelSerializer):
    class Meta:
        model = RoomType
        fields = ['uuid', 'name', 'description', 'max_occupancy', 'size', 'thumbnail']