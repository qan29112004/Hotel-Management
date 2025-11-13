from django.db import models
from django.contrib.auth import get_user_model
from shortuuid.django_fields import ShortUUIDField

# Create your models here.
User = get_user_model()

class KnowlegdeBaseModel(models.Model):
    uuid = ShortUUIDField(primary_key=True, unique=True, max_length=20, length=10, alphabet="abcdefghjklmnopqrstuvwxyz")
    title = models.CharField(max_length=500)
    content = models.TextField()
    is_embedded = models.BooleanField(default=False)
    created_at = models.DateField(auto_now_add=True)
    updated_at = models.DateField(auto_now=True)