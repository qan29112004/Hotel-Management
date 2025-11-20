from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.booking import *
from django.core.files.storage import default_storage
from hotel_management_be.models.hotel import Hotel
from hotel_management_be.models.offer import RatePlan, Service,ServiceRatePlan
from hotel_management_be.serializers.hotel_serializer import HotelSerializer
from hotel_management_be.serializers.service_serializer import ServiceSerializer

class RatePlanServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = ServiceRatePlan
        fields=[]

class RatePlanSerializer(serializers.ModelSerializer):
    updated_by = serializers.SerializerMethodField()
    hotel = HotelSerializer()
    service = serializers.SerializerMethodField()

    class Meta:
        model = RatePlan
        fields = ['uuid','name','description','price_modifier','is_active','refundable','is_breakfast','hotel', 'cancellation_policy','guarantee_policy', 'service', 'created_by', 'updated_by','created_at','updated_at']
        
    def get_service(self, obj):
        return ServiceSerializer(
            [s.service for s in obj.rp_service_rate_plan.all() if s.service.type == "Include"],
            many=True
        ).data
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }    
    
        
class RatePlanCreateSerializer(serializers.ModelSerializer):
    hotel = serializers.PrimaryKeyRelatedField(queryset = Hotel.objects.all())
    service = serializers.ListField(child=serializers.CharField(allow_blank=True), required=False, write_only=True,allow_empty=True)
    class Meta:
        model=RatePlan
        fields=['uuid','name','description','price_modifier','is_active','refundable','is_breakfast','hotel', 'cancellation_policy','guarantee_policy', 'service']
        
    def validate_price_modifier(self, value):
        try:
            number = float(value)
        except ValueError:
            raise serializers.ValidationError("price must be number")
        if number<0 or number > 2:
            raise serializers.ValidationError("about 0% to 100% (0 to 2)")
        return value
    
    def create(self, validated_data):
        services_uuid = validated_data.pop('service')
        new_rp = super().create(validated_data)
        if services_uuid:
            services = Service.objects.filter(uuid__in=services_uuid)
            for sv in services:
                ServiceRatePlan.objects.create(service=sv, rate_plan=new_rp)
        return new_rp
    def update(self, instance, validated_data):
        if 'service' in validated_data:
            update_services_uuid = validated_data.pop('service',[])
            update_services = Service.objects.filter(uuid__in=update_services_uuid)
            crr_services = ServiceRatePlan.objects.filter(rate_plan=instance)
            update_uuid = set(update_services.values_list('uuid', flat=True))
            crr_uuid = set(crr_services.values_list('service__uuid', flat=True))
            to_delete = crr_uuid - update_uuid
            ServiceRatePlan.objects.filter(rate_plan=instance, service__uuid__in=to_delete).delete()
            
            to_add = update_uuid - crr_uuid
            for service in update_services:
                if service.uuid in to_add:
                    ServiceRatePlan.objects.create(rate_plan=instance, service=service)
        return super().update(instance,validated_data)