from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.hotel import *
from django.core.files.storage import default_storage



class AmenitySerializer(serializers.ModelSerializer):
    class Meta:
        model = Amenity
        fields = ['uuid', 'name', 'description','icon', 'created_by', 'updated_by','created_at','updated_at']
        
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
    def validate_name(self, value):
        if not value or value.strip() == "":
            raise serializers.ValidationError("Tên tiện ích không được để trống.")

        qs = Amenity.objects.filter(name=value)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError("Tên tiện ích đã tồn tại.")

        return value
    def create(self, validated_data):
        
        return super().create(validated_data)