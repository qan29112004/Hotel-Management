from django.db import models
from django.contrib.auth import get_user_model
from shortuuid.django_fields import ShortUUIDField
from constants.chatbot_constants import ChatConstants
import time

# Create your models here.
User = get_user_model()

class KnowlegdeBaseModel(models.Model):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    title = models.CharField(max_length=500)
    content = models.TextField()
    is_embedded = models.BooleanField(default=False)
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)
    
class GroupChat(models.Model):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    name = models.CharField(max_length=30, null=True,blank=True)
    status = models.CharField(max_length=50, choices=ChatConstants.GROUP_CHAT_STATUS, null=True, blank=True, default="Normal")
    
class GroupMember(models.Model):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    group = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name="group_member")
    user = models.ForeignKey("hotel_management_be.User", on_delete=models.CASCADE, related_name="group_user", null=True, blank=True)
    
class Message(models.Model):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    group = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name="message")
    text = models.TextField()
    created_at = models.BigIntegerField(editable=False)
    updated_at = models.BigIntegerField(null=True)
    sender = models.CharField(max_length=50, null=True, blank=True, default='')
    
    def save(self, *args, **kwargs):
        now_time = int(time.time())
        if(self.created_at is None):
           self.created_at = now_time
        self.updated_at = now_time
        super().save(*args, **kwargs)
    
class ReceptionistJoinedGroup(models.Model):
    receptionist = models.ForeignKey(User, on_delete=models.CASCADE, related_name="join_group")
    group = models.ForeignKey(GroupChat, on_delete=models.CASCADE, related_name="recept_join")
    status = models.CharField(max_length=20, null=True, blank=True, choices=ChatConstants.SOLVE_GROUP, default="In progress")