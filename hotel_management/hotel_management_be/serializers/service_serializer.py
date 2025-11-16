from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.offer import *
from django.core.files.storage import default_storage

class ServiceSerializer(serializers.ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    class Meta:
        model=Service
        fields=['uuid','name','image','price','type','created_by','created_at','updated_by','updated_at']
    
    def get_updated_by(self, obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }