from django.db.models import Q
from rest_framework import serializers
from django.core.files.storage import default_storage

from utils.utils import Utils
from hotel_management_be.models.hotel import *



class DestinationSerializer(serializers.ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    total_hotels = serializers.SerializerMethodField()
    class Meta:
        model = Destination
        fields = ['uuid', 'name', 'description','thumbnail', 'total_hotels','slug', 'created_by', 'updated_by','created_at','updated_at']
    
    def get_total_hotels(self,obj):
        total_hotels = obj.destination.count()
        return total_hotels   
    
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
    def create(self, validated_data):
        
        return super().create(validated_data)
    
class DestinationDetailSerializer(serializers.ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    total_hotels = serializers.SerializerMethodField()
    class Meta:
        model = Destination
        fields = ['uuid', 'name', 'description','thumbnail', 'total_hotels','slug', 'created_by', 'updated_by','created_at','updated_at']
    
    def get_total_hotels(self,obj):
        from hotel_management_be.serializers.hotel_serializer import HotelSerializer
        hotels = obj.destination.all()
        serializer = HotelSerializer(hotels, many=True) 
        return serializer.data
    
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
    def create(self, validated_data):
        
        return super().create(validated_data)