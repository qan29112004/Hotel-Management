from django.db.models import Q
from rest_framework import serializers

from utils.utils import Utils
from hotel_management_be.models.booking import *
from django.core.files.storage import default_storage
from hotel_management_be.models.hotel import Hotel
from hotel_management_be.models.offer import RatePlan, Service,ServiceRatePlan
from hotel_management_be.serializers.hotel_serializer import HotelSerializer
from hotel_management_be.serializers.service_serializer import ServiceSerializer,ServiceRateSerializer

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
        fields = ['uuid','name','description','price_modifier','is_active','refundable','is_breakfast','need_login','refund_partial_percentage','refund_partial_days','refund_full_days','hotel', 'cancellation_policy','guarantee_policy', 'service', 'created_by', 'updated_by','created_at','updated_at']
        
    def get_service(self, obj):
        return ServiceRateSerializer(
            [s.service for s in obj.rp_service_rate_plan.all() if s.service.type == "Include"],
            many=True
        ).data
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }    
    
        
class RatePlanCreateSerializer(serializers.ModelSerializer):
    hotel = serializers.PrimaryKeyRelatedField(queryset = Hotel.objects.all())
    service = serializers.ListField(
        child=serializers.CharField(allow_blank=True),
        required=False,
        write_only=True
    )
    class Meta:
        model=RatePlan
        fields=['uuid','name','description','price_modifier','is_active','refundable','is_breakfast','hotel', 'cancellation_policy','guarantee_policy', 'service']
    
    def validate_service(self, value):
        # value = list các string
        value = [v for v in value if v and v.strip()]  # bỏ '' và '   '
        return value

    # def to_internal_value(self, data):
    #     # Xử lý đặc biệt cho FormData - đảm bảo service được parse đúng
    #     if hasattr(data, 'getlist'):
    #         # Nếu là QueryDict (từ FormData), dùng getlist để lấy tất cả giá trị
    #         service_list = data.getlist('service', [])
    #         if service_list:
    #             # Tạo một mutable copy của data
    #             mutable_data = data.copy() if hasattr(data, 'copy') else dict(data)
    #             mutable_data['service'] = service_list
    #             data = mutable_data
    #     return super().to_internal_value(data)
        
    def validate_name(self, value):
        if not value or value.strip() == "":
            raise serializers.ValidationError("Tên rate plan không được để trống.")

        qs = RatePlan.objects.filter(name=value)

        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)

        if qs.exists():
            raise serializers.ValidationError("Tên rate plan đã tồn tại.")

        return value

    def validate_price_modifier(self, value):
        if value is None:
            return value
        if value < 0 or value > 2:
            raise serializers.ValidationError("Giá điều chỉnh phải từ 0 đến 2.")
        return value

    def validate_refund_full_days(self, value):
        if value <= 0:
            raise serializers.ValidationError("Số ngày hoàn tiền đầy đủ phải lớn hơn 0.")
        return value

    def validate_refund_partial_days(self, value):
        if value <= 0:
            raise serializers.ValidationError("Số ngày hoàn tiền một phần phải lớn hơn 0.")
        return value

    def validate_refund_partial_percentage(self, value):
        if value < 0 or value > 100:
            raise serializers.ValidationError("Phần trăm hoàn tiền phải từ 0 đến 100.")
        return value
    
    def create(self, validated_data):
        services_uuid = validated_data.pop('service', [])
        print("check service uuid:", services_uuid)
        new_rp = super().create(validated_data)
        if services_uuid and len(services_uuid) > 0:
            # Loại bỏ các giá trị rỗng nếu có
            services_uuid = [uuid for uuid in services_uuid if uuid and uuid.strip()]
            print("check service uuid after filter:", services_uuid)
            if services_uuid:
                services = Service.objects.filter(uuid__in=services_uuid)
                print("check services found:", services.count(), "services:", [s.uuid for s in services])
                for sv in services:
                    try:
                        ServiceRatePlan.objects.create(service=sv, rate_plan=new_rp)
                        print(f"Created ServiceRatePlan: service={sv.uuid}, rate_plan={new_rp.uuid}")
                    except Exception as e:
                        print(f"Error creating ServiceRatePlan: {e}")
        return new_rp
    def update(self, instance, validated_data):
        if 'service' in validated_data:
            update_services_uuid = validated_data.pop('service', [])
            print("check service uuid update:", update_services_uuid)
            # Loại bỏ các giá trị rỗng nếu có
            if update_services_uuid:
                update_services_uuid = [uuid for uuid in update_services_uuid if uuid and uuid.strip()]
            print("check service uuid after filter update:", update_services_uuid)
            update_services = Service.objects.filter(uuid__in=update_services_uuid) if update_services_uuid else Service.objects.none()
            print("check services found update:", update_services.count(), "services:", [s.uuid for s in update_services])
            crr_services = ServiceRatePlan.objects.filter(rate_plan=instance)
            print("check crr service plan: ",crr_services)
            update_uuid = set(update_services.values_list('uuid', flat=True)) if update_services_uuid else set()
            crr_uuid = set(crr_services.values_list('service__uuid', flat=True))
            print("check update uuid: ", update_uuid)
            print("check crr uuid: ", crr_uuid)
            to_delete = crr_uuid - update_uuid
            if to_delete:
                ServiceRatePlan.objects.filter(rate_plan=instance, service__uuid__in=to_delete).delete()
                print(f"Deleted ServiceRatePlan: {to_delete}")
            
            to_add = update_uuid - crr_uuid
            print("check services to add:", to_add)
            for service in update_services:
                if service.uuid in to_add:
                    try:
                        ServiceRatePlan.objects.create(rate_plan=instance, service=service)
                        print(f"Created ServiceRatePlan: service={service.uuid}, rate_plan={instance.uuid}")
                    except Exception as e:
                        print(f"Error creating ServiceRatePlan: {e}")
        return super().update(instance,validated_data)