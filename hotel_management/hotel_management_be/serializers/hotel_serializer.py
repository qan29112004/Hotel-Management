from django.db.models import Q
from rest_framework import serializers
import os
from django.conf import settings
from hotel_management_be.serializers.rating_serializer import RatingSerializer
from utils.utils import Utils
from hotel_management_be.models.hotel import *
from hotel_management_be.models.offer import *
from hotel_management_be.models.booking import *
from datetime import date
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
        
class HotelServiceSerializer(serializers.ModelSerializer):
    service_id = serializers.CharField(read_only=True, source="service.uuid")
    service_name = serializers.CharField(read_only=True, source= "service.name")
    service_image = serializers.CharField(read_only=True, source= "service.image")
    class Meta:
        model=HotelService
        fields=['service_id','service_name','service_image']
        

class HotelSerializer(serializers.ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    slug = serializers.SlugField(read_only = True)
    destination = serializers.PrimaryKeyRelatedField(queryset=Destination.objects.all(),required=False)
    images = HotelImageSerializer(many=True,  read_only=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    service = HotelServiceSerializer(many=True, source='hotel_services', read_only=True)
    rating = serializers.SerializerMethodField()
    class Meta:
        model = Hotel
        fields = [
            'uuid', 'name', 'description', 'slug', 'address', 'phone', 'status',
            'views', 'features', 'tags', 'thumbnail', 'destination', 'check_in_time',
            'check_out_time', 'latitude', 'longitude', 'images', 'rating' , 'created_by', 'updated_by','created_at','updated_at', 'service'
        ]
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }    
    def get_rating(self, obj):
        reviews = obj.hotel_review.filter(is_active=True)

        count = reviews.count()
        if count == 0:
            return {
                "average": 0,
                "count": 0
            }
        
        avg = reviews.aggregate(avg=models.Avg("rating"))["avg"]
        return {
            "average": round(avg, 2),
            "count": count
        }

class HotelDetailSerializer(serializers.ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    slug = serializers.SlugField(read_only = True)
    destination = serializers.PrimaryKeyRelatedField(queryset=Destination.objects.all(),required=False)
    images = HotelImageSerializer(many=True,  read_only=True)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    service = HotelServiceSerializer(many=True, source='hotel_services', read_only=True)
    rating = serializers.SerializerMethodField()
    room_types = serializers.SerializerMethodField()
    is_available_room = serializers.SerializerMethodField()
    class Meta:
        model = Hotel
        fields = [
            'uuid', 'name', 'description', 'slug', 'address', 'phone', 'status',
            'views', 'features', 'tags', 'thumbnail', 'destination', 'check_in_time',
            'check_out_time', 'latitude', 'longitude', 'images', 'rating', 'room_types','is_available_room' , 'created_by', 'updated_by','created_at','updated_at', 'service'
        ]
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }    
    def get_rating(self, obj):
        reviews = obj.hotel_review.filter(is_active=True)
        reviews = obj.hotel_review.filter(is_active=True).order_by('-created_at')[:3]
        count = reviews.count()
        if count == 0:
            return {
                "average": 0,
                "count": 0,
                'list': RatingSerializer(reviews, many=True).data
            }
        
        avg = reviews.aggregate(avg=models.Avg("rating"))["avg"]
        return {
            "average": round(avg, 2),
            "count": count,
            'list': RatingSerializer(reviews, many=True).data
        }
        
    def get_room_types(self,obj):
        room_type = obj.RoomType.all()
        return RoomTypeSerializer(room_type, many=True).data
    def get_is_available_room(self,obj):
        today = date.today()

        #  Lấy tất cả room Available của khách sạn
        available_rooms = Room.objects.filter(
            room_type_id__hotel_id=obj,
            status="Available"
        )

        # #  Lấy tất cả room đã được booking từ hôm nay trở đi
        # booked_rooms = Room.objects.filter(
        #     room_booking_room__booking_id__hotel_id=obj,
        #     room_booking_room__booking_id__check_in__gte=today
        # ).distinct()

        # #  Nếu số lượng phòng available == số lượng phòng available đã bị book => hết phòng
        # if available_rooms.count() == booked_rooms.filter(uuid__in=available_rooms).count():
        #     return False  # hết phòng
        if available_rooms.count() == 0: return False
        return True

class HotelCreateSerializer(serializers.ModelSerializer):
    slug = serializers.SlugField(read_only = True)
    destination = serializers.PrimaryKeyRelatedField(queryset=Destination.objects.all(),required=False)
    images_upload = serializers.ListField(child=serializers.FileField(), write_only=True, required=False)
    latitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    longitude = serializers.DecimalField(max_digits=9, decimal_places=6, required=False, allow_null=True)
    service = serializers.ListField(child=serializers.CharField(allow_blank=True), write_only=True, required=False,allow_empty=True)
    class Meta:
        model = Hotel
        fields = [
            'uuid', 'name', 'description', 'slug', 'address', 'phone', 'status',
            'views', 'features', 'tags', 'thumbnail', 'destination', 'check_in_time',
            'check_out_time', 'latitude', 'longitude', 'service','images_upload'
        ]
    def update(self, instance, validated_data):
        images_upload = validated_data.pop('images_upload', [])
        if 'service' in validated_data:
            new_services_uuids = validated_data.pop('service', [])
            new_services = Service.objects.filter(uuid__in=new_services_uuids)

            current_services = HotelService.objects.filter(hotel=instance)
            current_uuids = set(current_services.values_list('service__uuid', flat=True))
            new_uuids = set(new_services.values_list('uuid', flat=True))

            # Xóa service bị bỏ
            to_delete = current_uuids - new_uuids
            HotelService.objects.filter(hotel=instance, service__uuid__in=to_delete).delete()

            # Thêm service mới
            to_add = new_uuids - current_uuids
            for service in new_services:
                if service.uuid in to_add:
                    HotelService.objects.create(hotel=instance, service=service)
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
        service_uuids = validated_data.pop('service', [])
        hotel = super().create(validated_data)
        if service_uuids:
            services = Service.objects.filter(uuid__in=service_uuids)
            for service in services:
                HotelService.objects.get_or_create(hotel=hotel, service=service)

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
    amenity = RoomTypeAmenitySerializer(many=True, source="roomtype_amenity", read_only=True)
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }    
    class Meta:
        model = RoomType
        fields=['uuid','hotel_id','name','size','max_occupancy', 'base_price', 'description','total_rooms', 'thumbnail', 'amenity','images', 'created_by', 'updated_by','created_at','updated_at']
    
class RoomTypeCreateSerializer(serializers.ModelSerializer):
    hotel_id = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all()
    )
    amenity = serializers.ListField(child=serializers.CharField(allow_blank=True), write_only=True, required=False,allow_empty=True)
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