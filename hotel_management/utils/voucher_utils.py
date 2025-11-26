from hotel_management_be.models.voucher import *
from constants.error_codes import ErrorCodes
from constants.success_codes import SuccessCodes
from django.db import transaction
from hotel_management_be.views.voucher_view import _load_voucher_by_code, _sync_voucher_state
class VoucherUtis:
    @staticmethod
    def claim_voucher(code, now, user):
        with transaction.atomic():
            voucher = _load_voucher_by_code(code, lock=True)
            if not voucher:
                return (
                    'error',ErrorCodes.VOUCHER_NOT_FOUND, "Voucher không tồn tại.", False, None
                )
            _sync_voucher_state(voucher, now)
            if not voucher.is_active(now):
                return (
                    'error',ErrorCodes.VOUCHER_NOT_ACTIVE,
                    "Voucher chưa kích hoạt hoặc đã hết hạn.", False, None
                )
            if voucher.has_reached_global_limit():
                return (
                    'error',ErrorCodes.VOUCHER_LIMIT_REACHED,
                    "Voucher đã hết lượt sử dụng.", False, None
                )

            claim, created = VoucherClaim.objects.select_for_update().get_or_create(
                voucher=voucher,
                user=user,
                defaults={"expires_at": voucher.get_claim_expiry(now)},
            )

            already_claimed = False
            if created:
                voucher.total_claimed += 1
                voucher.save(update_fields=["total_claimed"])
            else:
                if claim.expires_at and now > claim.expires_at:
                    claim.expires_at = voucher.get_claim_expiry(now)
                    claim.status = VoucherConstants.CLAIM_ACTIVE
                    claim.save(update_fields=["expires_at", "status"])
                else:
                    already_claimed = True
            return ('success', '','', already_claimed, claim)