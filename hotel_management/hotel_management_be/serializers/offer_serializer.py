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
    def validate_discount_percentage(self, value):
        if value < 0 or value > 2:
            raise ValueError("Phần trăm phải nằm trong khoảng 0 đến 2")
        return value

    def validate_amount_days(self, value):
        if value < 0:
            raise ValueError("Sô ngày phải lớn hơn 0")
        return value
    

    def validate(self, attrs):
        title = attrs.get("title")
        hotel = attrs.get("hotel")
        start_date = attrs.get("start_date")
        end_date = attrs.get("end_date")
        min_price = attrs.get("min_price")
        # Khi update thì tránh check chính nó
        offer_uuid = self.instance.uuid if self.instance else None

        # Check trùng title trong cùng hotel
        if Offer.objects.filter(
            title=title,
            hotel=hotel
        ).exclude(uuid=offer_uuid).exists():
            raise ValueError("Tiêu đề đã tồn tại")
        if start_date and end_date:
            if start_date >= end_date:
                raise ValueError("Ngày bắt đầu phải nhỏ hơn ngày kết thúc")
        if min_price:
            if min_price < 0 :raise ValueError("Giá thành phải lớn hơn 0") 
        return attrs
    def update(self, instance, validated_data):
        code = validated_data['code']
        if instance.code != code:
            if Offer.objects.filter(code = code).exclude(uuid = instance.uuid).exists():
                raise ValueError("Mã code đã tồn tại")
        return super().update(instance, validated_data)