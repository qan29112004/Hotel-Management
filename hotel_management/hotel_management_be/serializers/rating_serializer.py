from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.hotel import *
from hotel_management_be.models.rating import *
from hotel_management_be.models.booking import *


from django.core.files.storage import default_storage

class RatingSerializer(serializers.ModelSerializer):
    hotel=serializers.PrimaryKeyRelatedField(queryset=Hotel.objects.all())
    booking = serializers.PrimaryKeyRelatedField(queryset=Booking.objects.all())
    updated_by = serializers.SerializerMethodField()
    roomtype = serializers.SerializerMethodField()
    class Meta:
        model=ReviewRating
        fields=['uuid', 'review', 'rating', 'hotel', 'booking', 'subject', 'is_active', 'roomtype','created_by','created_at','updated_by','updated_at']
        
    def get_updated_by(self, obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
        
    def get_roomtype(self, obj):
        booking = obj.booking
        bookingRoom = (booking.booking_booking_room.select_related('room_id__room_type_id'))
        result= [{'name':br.room_id.room_type_id.name} for br in bookingRoom if br.room_id and br.room_id.room_type_id]
        
        return result
class RatingCreateSerializer(serializers.ModelSerializer):
    hotel = serializers.PrimaryKeyRelatedField(queryset=Hotel.objects.all())
    booking = serializers.PrimaryKeyRelatedField(queryset=Booking.objects.all())
    images_upload = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)
    class Meta:
        model=ReviewRating
        fields=['uuid', 'review', 'rating', 'hotel', 'booking', 'subject', 'is_active','images_upload','created_by','created_at','updated_by','updated_at']
    def create(self, validated_data):
        images_upload = validated_data.pop('images_upload', [])
        rating = super().create(validated_data)
        for file in images_upload:
            ReviewImages.objects.create(
                review=rating,
                images=f'/media/images/rating/{file.name}'
            )
            default_storage.save(f'images/rating/{file.name}', file)
        return rating
    def update(self, instance, validated_data):
        print("validated_data ",validated_data)
        
        images_upload = validated_data.pop('images_upload', [])
        for file in images_upload:
            ReviewImages.objects.create(
                review=instance,
                images=f'/media/images/rating/{file.name}',
            )
            default_storage.save(f'images/rating/{file.name}', file)
        return super().update(instance, validated_data)
    