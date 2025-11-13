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
        fields=['uuid', 'rule_type','multiplier']
