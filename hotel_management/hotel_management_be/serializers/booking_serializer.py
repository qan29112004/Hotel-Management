from decimal import Decimal, InvalidOperation
from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.booking import *
from django.core.files.storage import default_storage
from hotel_management_be.models.hotel import Hotel, Room
from hotel_management_be.models.offer import RatePlan

class BookingSerializer(serializers.ModelSerializer):
    hotel_id = serializers.PrimaryKeyRelatedField(queryset = Hotel.objects.all())
    updated_by = serializers.SerializerMethodField()
    class Meta:
        model = Booking
        fields = ['uuid', 'user_email','user_fullname','user_phone','user_country', 'hotel_id', 'check_in', 'check_out', 'num_guest', 'total_price', 'status', 'total_rooms', 'created_by', 'updated_by','created_at','updated_at']
    
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
        
class BookingRoomSerializer(serializers.ModelSerializer):
    booking_id = serializers.PrimaryKeyRelatedField(queryset = Booking.objects.all())
    room_id = serializers.PrimaryKeyRelatedField(queryset = Room.objects.all())
    rate_plan_id = serializers.PrimaryKeyRelatedField(queryset = RatePlan.objects.all())
    class Meta:
        model = BookingRoom
        fields = ['uuid', 'booking_id', 'room_id','rate_plan_id', 'subtotal', 'nights', 'price_per_night']
        
class CreateSessionSerializer(serializers.Serializer):
    hotel_name = serializers.CharField()
    checkin = serializers.DateField()
    checkout = serializers.DateField()
    requested_rooms = serializers.IntegerField(min_value=1, default=1)
    user_id = serializers.CharField(required=False, allow_blank=True)

class CreateHoldSerializer(serializers.Serializer):
    session_id = serializers.CharField()
    room_type_name = serializers.CharField(required=True)
    rate_plan_name = serializers.CharField(required=True)
    user_email = serializers.CharField(required=False)
    user_id = serializers.CharField(required=False)
    total_price = serializers.CharField(required=True)
    quantity = serializers.CharField(required=True)
    room_index = serializers.IntegerField()
    def validate(self, data):
        errors = {}

        # Ép kiểu và kiểm tra quantity
        try:
            quantity = int(data['quantity'])
            if quantity <= 0:
                errors['quantity'] = "Số lượng (quantity) phải lớn hơn 0."
        except (ValueError, TypeError):
            errors['quantity'] = "Số lượng (quantity) phải là số nguyên hợp lệ."

        # Ép kiểu và kiểm tra total_price
        try:
            total_price = Decimal(data['total_price'])
            if total_price <= 0:
                errors['total_price'] = "Giá tổng (total_price) phải lớn hơn 0."
        except (InvalidOperation, TypeError):
            errors['total_price'] = "Giá tổng (total_price) phải là số hợp lệ."

        if errors:
            raise serializers.ValidationError(errors)
        data['quantity'] = quantity
        data['total_price'] = total_price
        return data

class ConfirmBookingSerializer(serializers.Serializer):
    session_id = serializers.UUIDField()
    payment_token = serializers.CharField(required=False, allow_blank=True)
    user_id = serializers.CharField()