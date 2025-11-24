from datetime import datetime, time
from django.db import models
from django.utils.text import slugify
from .user import User
from shortuuid.django_fields import ShortUUIDField
from utils.base_model import BaseModel
from constants.hotel_constants import HotelConstants
import shortuuid
from unidecode import unidecode

class Destination(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    name = models.CharField(max_length=50, null=True,blank=True)
    thumbnail = models.CharField(max_length=255, blank=True, null=True)
    description = models.TextField(null=True,blank=True)   
    slug = models.CharField(null=True, blank=True, default='', max_length=30)
    
    def save(self, *args, **kwargs):
       if(self.slug == '' or self.slug == None):
           self.slug = slugify(self.name)
       super(Destination, self).save(*args, **kwargs) # Call the real save() method 

class Hotel(BaseModel):
    
    name =models.CharField(max_length=200, blank=True,null=True)
    description = models.TextField(blank=True, null=True)
    slug = models.SlugField(unique=True)
    address = models.TextField(null=True)
    # email = models.EmailField()
    phone = models.CharField(max_length=10)
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    status = models.CharField(choices=HotelConstants.HOTEL_STATUS, null=True,blank=True, max_length=10)
    views = models.IntegerField(default=0)
    features = models.BooleanField(null=True,blank=True)
    tags = models.CharField(max_length=200,null=True, blank=True)
    thumbnail = models.CharField(null=True, blank=True, max_length=255)
    # rating
    destination = models.ForeignKey(Destination, on_delete=models.CASCADE, related_name='destination', null=True)
    check_in_time = models.TimeField(null=True, blank=True, default=time(14, 0, 0))
    check_out_time = models.TimeField(null=True, blank=True, default=time(11, 0, 0))
    latitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    def get_absolute_url(self):
        return f"/hotels/{self.slug}/"
    def save(self, *args, **kwargs):
       if self.slug == '' or self.slug is None:
            uniqueid = shortuuid.uuid()[:4]
            name_ascii = unidecode(self.name)
            self.slug = slugify(name_ascii) + '-' + str(uniqueid)
       
       super(Hotel, self).save(*args, **kwargs) # Call the real save() method
    
    def __str__(self):
        return self.name
    
    
class RoomType(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    hotel_id = models.ForeignKey(Hotel,on_delete=models.CASCADE, related_name="RoomType")
    name = models.CharField(null=True, blank=True , max_length=50, unique=True)
    description = models.TextField(null=True,blank=True)
    base_price = models.CharField(null=True,blank=True , max_length=50)
    max_occupancy = models.IntegerField()
    size = models.CharField(null=True, blank=True , max_length=50)
    status = models.CharField(choices=HotelConstants.ROOM_TYPE_STATUS, null=True,blank=True, max_length=50)
    thumbnail = models.CharField(null=True, blank=True, max_length=255)
    total_rooms = models.IntegerField(default=20)
    
class Room(BaseModel):
    auto_increment_id = models.PositiveIntegerField(unique=True, editable=False, null=True)
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    room_type_id = models.ForeignKey(RoomType,on_delete=models.SET_NULL, related_name="room", null=True) 
    room_number = models.CharField(null=True,blank=True, max_length=50)
    status = models.CharField(choices=HotelConstants.ROOM_STATUS, null=True,blank=True, max_length=50, default='Available')
    floor = models.IntegerField()  
    housekeeping_status = models.CharField(choices=HotelConstants.HOUSEKEEPING_STATUS, null=True,blank=True, max_length=50, default='Cleaned')  
    
    def save(self, *args, **kwargs):
        # Auto tăng id toàn hệ thống
        if not self.auto_increment_id:
            last_obj = Room.objects.order_by('-auto_increment_id').first()
            self.auto_increment_id = (last_obj.auto_increment_id + 1) if last_obj else 1

        # Sinh room_number theo tầng
        if not self.room_number:
            # Lấy các phòng hiện có ở tầng này
            existing_rooms = Room.objects.filter(floor=self.floor).order_by('room_number')

            # Đếm số phòng đã có
            room_count = existing_rooms.count()

            if room_count >= 20:
                raise ValueError(f"Tầng {self.floor} đã đạt số lượng phòng tối đa (20).")

            # Tạo mã phòng theo số lượng hiện có
            next_room_index = room_count + 1
            self.room_number = f'R.{self.floor}{next_room_index:02d}'

        super().save(*args, **kwargs)
       
class Amenity(BaseModel):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    name = models.CharField(null=True, blank=True , max_length=50)
    icon = models.CharField(max_length=255, null=True,blank=True)
    description = models.TextField(null=True, blank=True)
    
    
class RoomTypeAmenity(models.Model):
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name="roomtype_amenity")
    amenity = models.ForeignKey(Amenity, on_delete=models.CASCADE, related_name="amenity_roomtype")
    is_default = models.BooleanField(default=True)
    class Meta:
        unique_together = ('room_type', 'amenity')
    
class HotelImage(models.Model):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    hotel = models.ForeignKey(Hotel, on_delete=models.CASCADE, related_name="images")
    image_url = models.CharField(max_length=255)
    alt_text = models.CharField(max_length=255, null=True, blank=True)
    
class RoomTypeImage(models.Model):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    room_type = models.ForeignKey(RoomType, on_delete=models.CASCADE, related_name="images")
    image_url = models.CharField(max_length=255)
    alt_text = models.CharField(max_length=255, null=True, blank=True)
    
class RoomImage(models.Model):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name="images")
    image_url = models.CharField(max_length=255)
    alt_text = models.CharField(max_length=255, null=True, blank=True)