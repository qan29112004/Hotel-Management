from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.hotel import *
from django.core.files.storage import default_storage


class RoomImageSerializer(serializers.ModelSerializer):
    room = serializers.PrimaryKeyRelatedField(queryset=RoomType.objects.all())
    class Meta:
        model = RoomImage
        fields = ['uuid','room','image_url']


class RoomSerializer(serializers.ModelSerializer):
    room_type_id = serializers.PrimaryKeyRelatedField(queryset=RoomType.objects.all())
    images_upload = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)
    class Meta:
        model = Room
        fields = ['uuid', 'room_number', 'status', 'floor',"housekeeping_status", 'room_type_id','images_upload']
        
    def create(self, validated_data):
        images_upload = validated_data.pop('images_upload', [])
        room = super().create(validated_data)
        for file in images_upload:
            RoomImage.objects.create(
                room=room,
                image_url=f'/media/images/{room.room_number}/{file.name}',
                alt_text=file.name
            )
            default_storage.save(f'images/{room.room_number}/{file.name}', file)
        return room
    def update(self, instance, validated_data):
        print("validated_data ",validated_data)
        
        images_upload = validated_data.pop('images_upload', [])
        for file in images_upload:
            RoomImage.objects.create(
                room=instance,
                image_url=f'/media/images/{instance.room_number}/{file.name}',
                alt_text=file.name
            )
            default_storage.save(f'images/{instance.room_number}/{file.name}', file)
        return super().update(instance, validated_data)
        
class RoomListSerializer(serializers.ModelSerializer):
    room_type_id = serializers.SerializerMethodField()
    images = RoomImageSerializer(many=True,  read_only=True)
    updated_by = serializers.SerializerMethodField()
    class Meta:
        model = Room
        fields = ['uuid', 'room_number', 'status', 'floor', 'room_type_id', "housekeeping_status",'images','created_at','created_by', 'updated_at', 'updated_by']
    
    def get_updated_by(self, obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }
    
    def get_room_type_id(self,obj):
        from .hotel_serializer import RoomTypeSerializer
        if obj.room_type_id:  # chỉ chạy khi có room_type
            return RoomTypeSerializer(obj.room_type_id).data
        return None
    