from decimal import Decimal
from datetime import timedelta

from django.db import models
from django.utils import timezone
from shortuuid.django_fields import ShortUUIDField

from constants.voucher_constants import VoucherConstants
from utils.base_model import BaseModel


class Voucher(BaseModel):
    uuid = ShortUUIDField(
        primary_key=True,
        unique=True,
        max_length=20,
        length=10,
        alphabet="abcdefghjklmnopqrstuvwxyz",
    )
    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True)
    description = models.TextField(null=True, blank=True)
    discount_type = models.CharField(
        max_length=20, choices=VoucherConstants.DISCOUNT_TYPE_CHOICES
    )
    discount_value = models.DecimalField(
        max_digits=30, decimal_places=10, default=Decimal("0.0")
    )
    discount_percent = models.DecimalField(
        max_digits=5, decimal_places=2, null=True, blank=True
    )
    max_discount_amount = models.DecimalField(
        max_digits=30, decimal_places=10, null=True, blank=True
    )
    min_order_value = models.DecimalField(
        max_digits=30, decimal_places=10, default=Decimal("0.0")
    )
    start_at = models.DateTimeField(null=True, blank=True)
    expire_at = models.DateTimeField(null=True, blank=True)
    relative_expiry_hours = models.PositiveIntegerField(null=True, blank=True)
    max_usage_global = models.PositiveIntegerField(null=True, blank=True)
    max_usage_per_user = models.PositiveIntegerField(default=1)
    status = models.CharField(
        max_length=20,
        choices=VoucherConstants.STATUS_CHOICES,
        default=VoucherConstants.STATUS_DRAFT,
    )
    requires_claim = models.BooleanField(default=True)
    stackable = models.BooleanField(default=False)
    total_claimed = models.PositiveIntegerField(default=0)
    total_used = models.PositiveIntegerField(default=0)
    conditions = models.JSONField(default=dict, blank=True)
    hotels = models.ManyToManyField(
        "hotel_management_be.Hotel", related_name="vouchers", blank=True
    )

    class Meta:
        indexes = [
            models.Index(fields=["code"]),
            models.Index(fields=["status", "start_at", "expire_at"]),
        ]

    def __str__(self):
        return f"{self.code} - {self.name}"

    def save(self, *args, **kwargs):
        if self.code:
            self.code = self.code.upper()
        super().save(*args, **kwargs)

    def is_active(self, now=None):
        now = now or timezone.now()
        if self.status not in VoucherConstants.ACTIVE_STATUSES:
            return False
        if self.start_at and now < self.start_at:
            return False
        if self.expire_at and now > self.expire_at:
            return False
        return True

    def has_reached_global_limit(self):
        if self.max_usage_global is None:
            return False
        return self.total_used >= self.max_usage_global

    def get_claim_expiry(self, now=None):
        now = now or timezone.now()
        if self.relative_expiry_hours:
            return now + timedelta(hours=self.relative_expiry_hours)
        return self.expire_at

    def requires_hotel_scope(self):
        return self.hotels.exists()

    def calculate_discount(self, order_total: Decimal) -> Decimal:
        order_total = Decimal(order_total or 0)
        if order_total <= 0:
            return Decimal("0")

        if self.discount_type == VoucherConstants.DISCOUNT_FIXED:
            discount = Decimal(self.discount_value or 0)
        else:
            percent = Decimal(self.discount_percent or 0)
            discount = (order_total * percent) / Decimal("100")
        discount = min(discount, order_total)
        if self.max_discount_amount:
            discount = min(discount, Decimal(self.max_discount_amount))
        return discount.quantize(Decimal("0.0000000001"))


class VoucherClaim(BaseModel):
    uuid = ShortUUIDField(
        primary_key=True,
        unique=True,
        max_length=20,
        length=10,
        alphabet="abcdefghjklmnopqrstuvwxyz",
    )
    voucher = models.ForeignKey(
        Voucher, on_delete=models.CASCADE, related_name="claims"
    )
    user = models.ForeignKey(
        "hotel_management_be.User",
        on_delete=models.CASCADE,
        related_name="voucher_claims",
    )
    claimed_at = models.DateTimeField(auto_now_add=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    usage_count = models.PositiveIntegerField(default=0)
    status = models.CharField(
        max_length=20,
        choices=VoucherConstants.CLAIM_STATUS_CHOICES,
        default=VoucherConstants.CLAIM_ACTIVE,
    )
    last_used_at = models.DateTimeField(null=True, blank=True)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        unique_together = ("voucher", "user")
        indexes = [
            models.Index(fields=["voucher", "user"]),
            models.Index(fields=["user", "status"]),
        ]

    def __str__(self):
        return f"{self.voucher.code} - {self.user.username}"

    def is_active(self, now=None):
        now = now or timezone.now()
        if self.status != VoucherConstants.CLAIM_ACTIVE:
            return False
        if self.expires_at and now > self.expires_at:
            return False
        return True

    def mark_expired(self):
        if self.status != VoucherConstants.CLAIM_EXPIRED:
            self.status = VoucherConstants.CLAIM_EXPIRED
            self.save(update_fields=["status"])


class VoucherUsageLog(BaseModel):
    uuid = ShortUUIDField(
        primary_key=True,
        unique=True,
        max_length=20,
        length=10,
        alphabet="abcdefghjklmnopqrstuvwxyz",
    )
    voucher = models.ForeignKey(
        Voucher, on_delete=models.SET_NULL, null=True, related_name="usage_logs"
    )
    claim = models.ForeignKey(
        VoucherClaim,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="usage_logs",
    )
    booking = models.ForeignKey(
        "hotel_management_be.Booking",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="voucher_usage_logs",
    )
    user = models.ForeignKey(
        "hotel_management_be.User",
        on_delete=models.SET_NULL,
        null=True,
        related_name="voucher_usage_logs",
    )
    discount_amount = models.DecimalField(
        max_digits=30, decimal_places=10, default=Decimal("0")
    )
    used_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(
        max_length=20,
        choices=VoucherConstants.USAGE_STATUS_CHOICES,
        default=VoucherConstants.USAGE_APPLIED,
    )
    metadata = models.JSONField(default=dict, blank=True)
    rolled_back_by = models.ForeignKey(
        "hotel_management_be.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="voucher_usage_rollbacks",
    )
    rolled_back_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=["voucher", "status"]),
            models.Index(fields=["booking", "status"]),
        ]

    def __str__(self):
        return f"{self.voucher.code if self.voucher else 'N/A'} - {self.discount_amount}"

