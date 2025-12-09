from rest_framework import serializers
from hotel_management_be.models.booking import Refund

class RefundSerializer(serializers.ModelSerializer):
    transaction_id = serializers.CharField(source='payment.transaction_id', read_only=True)
    method = serializers.CharField(source='payment.method', read_only=True)
    booking_uuid = serializers.CharField(source='payment.booking.uuid', read_only=True)
    updated_by = serializers.SerializerMethodField()
    currency = serializers.SerializerMethodField()
    class Meta:
        model = Refund
        fields = ['uuid', 'payment', 'booking_room', 'amount','currency', 'status', 'processed_at', 'created_at', 'updated_at', 'transaction_id', 'method', 'booking_uuid', 'updated_by']
    def get_updated_by(self,obj):
        return {
            'username':obj.updated_by.username if obj.updated_by else None
        }

    def get_currency(self,obj):
        return obj.payment.currency