from django.db.models import Q
from rest_framework import serializers
import os
from django.conf import settings
from utils.utils import Utils
from hotel_management_be.models.hotel import *
from django.core.files.storage import default_storage
from .room_type_serializer import RoomTypeAmenitySerializer

class RoomTypeImageSerializer(serializers.ModelSerializer):
    room_type_id = serializers.PrimaryKeyRelatedField(queryset=RoomType.objects.all())
    class Meta:
        model = RoomTypeImage
        fields = ['uuid','room_type_id','image_url']

class HotelImageSerializer(serializers.ModelSerializer):
    hotel_id = serializers.PrimaryKeyRelatedField(queryset=Hotel.objects.all())
    class Meta:
        model = HotelImage
        fields = ['uuid','hotel_id','image_url']

class HotelSerializer(serializers.ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    slug = serializers.SlugField(read_only = True)
    destination = serializers.PrimaryKeyRelatedField(queryset=Destination.objects.all(),required=False)
    images = HotelImageSerializer(many=True,  read_only=True)
    images_upload = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    class Meta:
        model = Hotel
        fields = [
            'uuid', 'name', 'description', 'slug', 'address', 'phone', 'status',
            'views', 'features', 'tags', 'thumbnail', 'destination', 'check_in_time',
            'check_out_time', 'latitude', 'longitude', 'images', 'images_upload', 'created_by', 'updated_by','created_at','updated_at'
        ]
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }    
    
    def update(self, instance, validated_data):
        images_upload = validated_data.pop('images_upload', [])
        print("thumnail", validated_data.get('thumbnail'))
        for file in images_upload:
            HotelImage.objects.create(
                hotel=instance,
                image_url=f'/media/images/{instance.name}/{file.name}',
                alt_text=file.name
            )
            default_storage.save(f'images/{instance.name}/{file.name}', file)
        return super().update(instance, validated_data)
    def create(self, validated_data):
        images_upload = validated_data.pop('images_upload', [])
        hotel = super().create(validated_data)
        for file in images_upload:
            HotelImage.objects.create(
                hotel=hotel,
                image_url=f'/media/images/{hotel.name}/{file.name}',
                alt_text=file.name
            )
            default_storage.save(f'images/{hotel.name}/{file.name}', file)
        return hotel
class ThumbnailSerializer(serializers.Serializer):
    file = serializers.FileField()
    
    def create(self, validated_data):
        request = self.context['request']
        field = self.context['field']
        file = validated_data.get('file')
        storePath = os.path.join(f'upload/{field}',file.name)
        fullPathStore = os.path.join(settings.MEDIA_ROOT, storePath)
        os.makedirs(os.path.dirname(fullPathStore), exist_ok=True)
        with default_storage.open(storePath,"wb+") as dest:
            for chunk in file.chunks():
                dest.write(chunk)
        return settings.MEDIA_URL + storePath

class RoomTypeSerializer(serializers.ModelSerializer):
    hotel_id = serializers.PrimaryKeyRelatedField(queryset=Hotel.objects.all())
    updated_by = serializers.SerializerMethodField()
    images = RoomTypeImageSerializer(many=True,  read_only=True)
    amenities = RoomTypeAmenitySerializer(many=True, source="roomtype_amenity", read_only=True)
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }    
    class Meta:
        model = RoomType
        fields=['uuid','hotel_id','name','size','max_occupancy', 'base_price', 'description','total_rooms', 'thumbnail', 'amenities','images', 'created_by', 'updated_by','created_at','updated_at']
    
class RoomTypeCreateSerializer(serializers.ModelSerializer):
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all()
    )
    amenity = serializers.ListField(child=serializers.CharField(), write_only=True, required=False)
    images_upload = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)

    class Meta:
        model = RoomType
        fields=['uuid','hotel_id','name','size','max_occupancy', 'base_price','total_rooms', 'description', 'amenity', 'thumbnail', 'images_upload']
    
    def validate_base_price(self, value):
        try:
            # Chuyển giá trị sang số (int hoặc float)
            number = float(value)
        except ValueError:
            raise serializers.ValidationError("Age must be a number")
        
        if number < 0:
            raise serializers.ValidationError("Age must be greater than or equal to 0")
        
        return value  # trả về kiểu số
    def validate_size(self, value):
        try:
            # Chuyển giá trị sang số (int hoặc float)
            number = float(value)
        except ValueError:
            raise serializers.ValidationError("Age must be a number")
        
        if number < 0:
            raise serializers.ValidationError("Age must be greater than or equal to 0")
        
        return value  # trả về kiểu số
    
    def create(self, validated_data):
        images_upload = validated_data.pop('images_upload', [])
        amenities_uuids = validated_data.pop('amenity', [])
        print(validated_data)
        # 1️⃣ Tạo RoomType
        room_type = super().create(validated_data)
        print(room_type)
        # 2️⃣ Thêm Amenity
        if amenities_uuids:
            from hotel_management_be.models.hotel import Amenity, RoomTypeAmenity
            amenities = Amenity.objects.filter(uuid__in=amenities_uuids)
            for amenity in amenities:
                RoomTypeAmenity.objects.get_or_create(room_type=room_type, amenity=amenity)

        # 3️⃣ Thêm hình ảnh
        for file in images_upload:
            RoomTypeImage.objects.create(
                room_type=room_type,
                image_url=f'/media/images/{room_type.name}/{file.name}',
                alt_text=file.name
            )
            default_storage.save(f'images/{room_type.name}/{file.name}', file)

        return room_type
    def update(self, instance, validated_data):
        print("validated_data ",validated_data)
        if 'amenity' in validated_data:
            new_amenities_uuids = validated_data.pop('amenity', [])
            new_amenities = Amenity.objects.filter(uuid__in=new_amenities_uuids)

            current_amenities = RoomTypeAmenity.objects.filter(room_type=instance)
            current_uuids = set(current_amenities.values_list('amenity__uuid', flat=True))
            new_uuids = set(new_amenities.values_list('uuid', flat=True))

            # Xóa amenity bị bỏ
            to_delete = current_uuids - new_uuids
            RoomTypeAmenity.objects.filter(room_type=instance, amenity__uuid__in=to_delete).delete()

            # Thêm amenity mới
            to_add = new_uuids - current_uuids
            for amenity in new_amenities:
                if amenity.uuid in to_add:
                    RoomTypeAmenity.objects.create(room_type=instance, amenity=amenity)
        images_upload = validated_data.pop('images_upload', [])
        print("thumnail", validated_data.get('thumbnail'))
        for file in images_upload:
            RoomTypeImage.objects.create(
                room_type=instance,
                image_url=f'/media/images/roomtype/{instance.name}/{file.name}',
                alt_text=file.name
            )
            default_storage.save(f'images/roomtype/{instance.name}/{file.name}', file)
        return super().update(instance, validated_data)
    
    
class ExporeHotelsSerializer(serializers.ModelSerializer):
    pass