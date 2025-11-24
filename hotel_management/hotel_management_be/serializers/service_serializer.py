from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.offer import *
from django.core.files.storage import default_storage

class ServiceSerializer(serializers.ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    class Meta:
        model=Service
        fields=['uuid','name','image','price','type','description','created_by','created_at','updated_by','updated_at']
    
    def get_updated_by(self, obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
        
class ServiceRateSerializer(serializers.ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    service_id = serializers.CharField(read_only=True, source= "uuid")
    service_name = serializers.CharField(read_only=True, source= "name")
    service_icon = serializers.CharField(read_only=True, source= "image")
    class Meta:
        model=Service
        fields=['service_id','service_name','service_icon','price','type','description','created_by','created_at','updated_by','updated_at']
    
    def get_updated_by(self, obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }