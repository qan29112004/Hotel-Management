from decimal import Decimal, InvalidOperation
from django.db.models import Q, Prefetch
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.booking import *
from django.core.files.storage import default_storage
from hotel_management_be.models.hotel import Hotel, Room
from hotel_management_be.models.offer import RatePlan, Service

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
        
class MyBookingSerializer(serializers.ModelSerializer):
    hotel = serializers.SerializerMethodField()
    updated_by = serializers.SerializerMethodField()
    rating = serializers.SerializerMethodField()
    booking_room = serializers.SerializerMethodField()
    class Meta:
        model = Booking
        fields = ['uuid', 'user_email','user_fullname','user_phone','user_country', 'hotel', 'rating','booking_room', 'check_in', 'check_out', 'num_guest', 'total_price', 'status', 'total_rooms', 'created_by', 'updated_by','created_at','updated_at']
    
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
    def get_hotel(self,obj):
        hotel = obj.hotel_id
        return {'uuid':hotel.uuid,'name':hotel.name, 'address':hotel.address, 'thumbnail':hotel.thumbnail}
    def get_rating(self,obj):
        rating = obj.booking_review
        return {
            'uuid':rating.uuid,
            "review":rating.review,
            'rating':rating.rating,
            'subject':rating.subject,
            'created_by':rating.created_by.email,
            'created_at':rating.created_datetime
        }
    def get_booking_room(self,obj):
        booking_rooms = obj.booking_booking_room.select_related('room_id', 'room_id__room_type_id', 'rate_plan_id').prefetch_related(Prefetch(
            'booking_room_service',
            queryset=BookingRoomService.objects.select_related('service')
        ))
        result=[]
        for br in booking_rooms:
            services = []
            for br_service in br.booking_room_service.all():
                services.append({
                    "name":br_service.service.name,
                    "quantity":br_service.quantity,
                    "price":br_service.price
                })
            data = {
                "number_room":br.room_id.room_number,
                "rate_name":br.rate_plan_id.name,
                "room_type_name":br.room_id.room_type_id.name,
                "price":br.price_per_night,
                "services":services
            }
            result.append(data)
        return result
        
        
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
    
class HoldServiceSerializer(serializers.ModelSerializer):
    service = serializers.PrimaryKeyRelatedField(queryset=Service.objects.all())
    class Meta:
        model=HoldRecordService
        fields=['service']
    def validate(self,attrs):
        try:
            service = attrs.get('service')
        except Service.DoesNotExist:
            raise serializers.ValidationError("service không tồn tại")
        
        if service.type != "Add on":
            raise serializers.ValidationError("Chỉ accept type Add on")
        return attrs
    def save(self, **kwargs):
        service = self.validated_data.pop('service')
        hold = self.context['hold']
        quantity = self.validated_data.get('quantity', 1)
        price = service.price * quantity

        # Upsert: nếu đã tồn tại thì update, chưa tồn tại thì tạo mới
        hold_service, created = HoldRecordService.objects.update_or_create(
            hold=hold,
            service=service,
            defaults={
                'quantity': quantity,
                'price': price
            }
        )
        return hold_service

class HoldRecordServiceReadSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='service.name', read_only=True)
    type = serializers.CharField(source='service.type', read_only=True)

    class Meta:
        model = HoldRecordService
        fields = ['uuid', 'name', 'type', 'quantity', 'price']