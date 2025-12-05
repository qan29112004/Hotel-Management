from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.booking import *
from django.core.files.storage import default_storage



class PaymentSerializer(serializers.ModelSerializer):
    price_vnd = serializers.SerializerMethodField()
    class Meta:
        model = Payment
        fields = ['uuid', 'amount', 'status', 'price_vnd', 'transaction_id', 'currency','method', 'created_by', 'updated_by','created_at','updated_at']
        
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
        
    def get_price_vnd(self,obj):
        price_vnd = obj.booking.price_in_vnd
        return price_vnd
    def create(self, validated_data):
        
        return super().create(validated_data)