from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.user import User
# from hotel_management.constants.constants import Constants

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        exclude = ['groups', 'user_permissions','password']