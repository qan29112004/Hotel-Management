from decimal import Decimal

from rest_framework import serializers

from constants.voucher_constants import VoucherConstants
from hotel_management_be.models.hotel import Hotel
from hotel_management_be.models.voucher import Voucher, VoucherClaim
from hotel_management_be.serializers.hotel_serializer import HotelSerializer

class VoucherSerializer(serializers.ModelSerializer):
    hotels = serializers.PrimaryKeyRelatedField(
        queryset=Hotel.objects.all(), many=True, required=False
    )

    class Meta:
        model = Voucher
        fields = [
            "uuid",
            "name",
            "code",
            "description",
            "discount_type",
            "discount_value",
            "discount_percent",
            "max_discount_amount",
            "min_order_value",
            "start_at",
            "expire_at",
            "relative_expiry_hours",
            "max_usage_global",
            "max_usage_per_user",
            "status",
            "requires_claim",
            "stackable",
            "total_claimed",
            "total_used",
            "conditions",
            "hotels",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("total_claimed", "total_used", "created_by", "updated_by")

    def validate(self, attrs):
        discount_type = attrs.get(
            "discount_type", getattr(self.instance, "discount_type", None)
        )
        discount_value = attrs.get(
            "discount_value", getattr(self.instance, "discount_value", None)
        )
        discount_percent = attrs.get(
            "discount_percent", getattr(self.instance, "discount_percent", None)
        )
        start_at = attrs.get("start_at", getattr(self.instance, "start_at", None))
        expire_at = attrs.get("expire_at", getattr(self.instance, "expire_at", None))

        if discount_type == VoucherConstants.DISCOUNT_FIXED:
            if discount_value is None or Decimal(discount_value) <= 0:
                raise serializers.ValidationError(
                    "Giá trị giảm phải lớn hơn 0 đối với voucher cố định."
                )
            attrs["discount_percent"] = None
        elif discount_type == VoucherConstants.DISCOUNT_PERCENT:
            if discount_percent is None:
                raise serializers.ValidationError(
                    "Vui lòng nhập % giảm giá cho voucher phần trăm."
                )
            percent_value = Decimal(discount_percent)
            if percent_value <= 0 or percent_value > 100:
                raise serializers.ValidationError(
                    "Phần trăm giảm giá phải trong khoảng 0 - 100."
                )
            attrs["discount_value"] = Decimal(attrs.get("discount_value", 0) or 0)
        else:
            raise serializers.ValidationError(
                "Loại voucher không hợp lệ."
            )

        if start_at and expire_at and start_at >= expire_at:
            raise serializers.ValidationError(
                "Thời gian kết thúc phải sau thời gian bắt đầu."
            )
        relative_expiry = attrs.get(
            "relative_expiry_hours",
            getattr(self.instance, "relative_expiry_hours", None),
        )
        if relative_expiry is not None and relative_expiry <= 0:
            raise serializers.ValidationError(
                "Thời gian hiệu lực phải lớn hơn 0 giờ."
            )

        per_user_limit = attrs.get(
            "max_usage_per_user", getattr(self.instance, "max_usage_per_user", None)
        )
        if per_user_limit is not None and per_user_limit <= 0:
            raise serializers.ValidationError(
                "Số lần sử dụng tối đa phải lớn hơn 0."
            )
        return attrs

    def create(self, validated_data):
        hotels = validated_data.pop("hotels", [])
        voucher = super().create(validated_data)
        if hotels:
            voucher.hotels.set(hotels)
        return voucher

    def update(self, instance, validated_data):
        hotels = validated_data.pop("hotels", None)
        voucher = super().update(instance, validated_data)
        if hotels is not None:
            voucher.hotels.set(hotels)
        return voucher

class HotelBasicSerializer(serializers.ModelSerializer):
    hotels_id = serializers.CharField(read_only=True, source="uuid")
    hotels_name = serializers.CharField(read_only=True, source= "name")
    hotels_icon = serializers.CharField(read_only=True, source= "thumbnail")
    class Meta:
        model=Hotel
        fields=['hotels_id','hotels_name','hotels_icon']

class VoucherListSerializer(serializers.ModelSerializer):
    hotels = HotelBasicSerializer(many=True)

    class Meta:
        model = Voucher
        fields = [
            "uuid",
            "name",
            "code",
            "description",
            "discount_type",
            "discount_value",
            "discount_percent",
            "max_discount_amount",
            "min_order_value",
            "start_at",
            "expire_at",
            "relative_expiry_hours",
            "max_usage_global",
            "max_usage_per_user",
            "status",
            "requires_claim",
            "stackable",
            "total_claimed",
            "total_used",
            "conditions",
            "hotels",
            "created_by",
            "updated_by",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ("total_claimed", "total_used", "created_by", "updated_by")

    def validate(self, attrs):
        discount_type = attrs.get(
            "discount_type", getattr(self.instance, "discount_type", None)
        )
        discount_value = attrs.get(
            "discount_value", getattr(self.instance, "discount_value", None)
        )
        discount_percent = attrs.get(
            "discount_percent", getattr(self.instance, "discount_percent", None)
        )
        start_at = attrs.get("start_at", getattr(self.instance, "start_at", None))
        expire_at = attrs.get("expire_at", getattr(self.instance, "expire_at", None))

        if discount_type == VoucherConstants.DISCOUNT_FIXED:
            if discount_value is None or Decimal(discount_value) <= 0:
                raise serializers.ValidationError(
                    "Giá trị giảm phải lớn hơn 0 đối với voucher cố định."
                )
            attrs["discount_percent"] = None
        elif discount_type == VoucherConstants.DISCOUNT_PERCENT:
            if discount_percent is None:
                raise serializers.ValidationError(
                    "Vui lòng nhập % giảm giá cho voucher phần trăm."
                )
            percent_value = Decimal(discount_percent)
            if percent_value <= 0 or percent_value > 100:
                raise serializers.ValidationError(
                    "Phần trăm giảm giá phải trong khoảng 0 - 100."
                )
            attrs["discount_value"] = Decimal(attrs.get("discount_value", 0) or 0)
        else:
            raise serializers.ValidationError(
                "Loại voucher không hợp lệ."
            )

        if start_at and expire_at and start_at >= expire_at:
            raise serializers.ValidationError(
                "Thời gian kết thúc phải sau thời gian bắt đầu."
            )
        relative_expiry = attrs.get(
            "relative_expiry_hours",
            getattr(self.instance, "relative_expiry_hours", None),
        )
        if relative_expiry is not None and relative_expiry <= 0:
            raise serializers.ValidationError(
                "Thời gian hiệu lực phải lớn hơn 0 giờ."
            )

        per_user_limit = attrs.get(
            "max_usage_per_user", getattr(self.instance, "max_usage_per_user", None)
        )
        if per_user_limit is not None and per_user_limit <= 0:
            raise serializers.ValidationError(
                "Số lần sử dụng tối đa phải lớn hơn 0."
            )
        return attrs
    
        

class VoucherBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Voucher
        fields = [
            "uuid",
            "code",
            "name",
            "description",
            "discount_type",
            "discount_value",
            "discount_percent",
            "max_discount_amount",
            "min_order_value",
            "start_at",
            "expire_at",
            'status',
            'total_used',
            'total_claimed',
            "relative_expiry_hours",
            "max_usage_per_user",
            "requires_claim",
            "stackable",
            'created_at',
            'created_by',
            'updated_at',
            'updated_by'
        ]


class VoucherClaimSerializer(serializers.ModelSerializer):
    voucher = VoucherBasicSerializer()

    class Meta:
        model = VoucherClaim
        fields = [
            "uuid",
            "voucher",
            "claimed_at",
            "expires_at",
            "usage_count",
            "status",
            "last_used_at",
            "metadata",
        ]


class VoucherClaimRequestSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)


class VoucherPreviewSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    order_total = serializers.DecimalField(max_digits=30, decimal_places=10)
    hotel_id = serializers.CharField(required=False, allow_blank=True, allow_null=True)


class VoucherRedeemSerializer(serializers.Serializer):
    code = serializers.CharField(max_length=50)
    order_total = serializers.DecimalField(max_digits=30, decimal_places=10)
    booking_uuid = serializers.CharField()


class VoucherRevertSerializer(serializers.Serializer):
    booking_uuid = serializers.CharField()


class VoucherApplySerializer(serializers.Serializer):
    """Chỉ lưu voucher code vào booking, chưa redeem (chưa trừ usage)"""
    code = serializers.CharField(max_length=50)
    booking_uuid = serializers.CharField()
    order_total = serializers.DecimalField(max_digits=30, decimal_places=10)

