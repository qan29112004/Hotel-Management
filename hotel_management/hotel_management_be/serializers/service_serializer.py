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
    def validate_name(self, value):
        if not value or value.strip() == "":
            raise serializers.ValidationError("Tên dịch vụ không được để trống.")

        qs = Service.objects.filter(name=value)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError("Tên dịch vụ đã tồn tại.")

        return value

    def validate_price(self, value):
        if value is None:
            return value
        if value <= 0:
            raise serializers.ValidationError("Giá dịch vụ phải lớn hơn 0.")
        return value
        
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