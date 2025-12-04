from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.booking import *
from django.core.files.storage import default_storage
from hotel_management_be.models.hotel import Hotel
from hotel_management_be.models.offer import PriceRule

class PriceRuleSerializer(serializers.ModelSerializer):
    class Meta:
        model = PriceRule
        fields=['uuid', 'rule_type','multiplier','updated_by','created_at','updated_at']

    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }