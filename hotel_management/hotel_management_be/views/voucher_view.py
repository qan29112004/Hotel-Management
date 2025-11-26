from decimal import Decimal

from django.db import transaction
from django.db.models import Prefetch
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser, IsAuthenticated

from constants.error_codes import ErrorCodes
from constants.success_codes import SuccessCodes
from constants.voucher_constants import VoucherConstants
from hotel_management_be.models.booking import Booking
from hotel_management_be.models.voucher import Voucher, VoucherClaim, VoucherUsageLog
from hotel_management_be.serializers.voucher_serializer import (
    VoucherSerializer,
    VoucherListSerializer,
    VoucherClaimSerializer,
    VoucherClaimRequestSerializer,
    VoucherPreviewSerializer,
    VoucherRedeemSerializer,
    VoucherRevertSerializer,
    VoucherApplySerializer,
)
from libs.querykit.querykit import Querykit
from libs.querykit.querykit_serializer import QuerykitSerializer
from libs.response_handle import AppResponse
from utils.swagger_decorators import (
    auto_schema_delete,
    auto_schema_get,
    auto_schema_patch,
    auto_schema_post,
)


def _normalize_code(code: str) -> str:
    return (code or "").strip().upper()


def _load_voucher_by_code(code: str, lock=False):
    # lock voucher hiện tại đê ttranhs raceconditon
    queryset = Voucher.objects.select_related().prefetch_related("hotels")
    if lock:
        queryset = queryset.select_for_update()
    return queryset.filter(code__iexact=code).first()


def _sync_voucher_state(voucher: Voucher, now):
    #Đồng bộ status voucher trước khi áp dụng ở thời điểm đó
    updated_fields = []
    if voucher.expire_at and now > voucher.expire_at and voucher.status != VoucherConstants.STATUS_EXPIRED:
        voucher.status = VoucherConstants.STATUS_EXPIRED
        updated_fields.append("status")
    if (
        voucher.max_usage_global is not None
        and voucher.total_used >= voucher.max_usage_global
        and voucher.status != VoucherConstants.STATUS_EXHAUSTED
    ):
        voucher.status = VoucherConstants.STATUS_EXHAUSTED
        if "status" not in updated_fields:
            updated_fields.append("status")
    if updated_fields:
        voucher.save(update_fields=updated_fields)


def _validate_usage_context(voucher: Voucher, user, order_total, hotel_id=None, now=None):
    now = now or timezone.now()
    _sync_voucher_state(voucher, now)

    if not voucher.is_active(now):
        return None, ErrorCodes.VOUCHER_NOT_ACTIVE, "Voucher chưa được kích hoạt hoặc đã hết hạn."
    if voucher.has_reached_global_limit():
        return None, ErrorCodes.VOUCHER_LIMIT_REACHED, "Voucher đã hết lượt sử dụng."

    order_total = Decimal(order_total)
    if voucher.min_order_value and order_total < Decimal(voucher.min_order_value):
        return None, ErrorCodes.VOUCHER_NOT_ELIGIBLE, "Đơn hàng chưa đạt giá trị tối thiểu."

    if voucher.requires_hotel_scope():
        if not hotel_id:
            return None, ErrorCodes.VOUCHER_NOT_ELIGIBLE, "Voucher chỉ áp dụng cho một số khách sạn."
        if not voucher.hotels.filter(uuid=hotel_id).exists():
            return None, ErrorCodes.VOUCHER_NOT_ELIGIBLE, "Voucher không áp dụng cho khách sạn này."

    claim = (
        VoucherClaim.objects.filter(voucher=voucher, user=user)
        .select_related("voucher")
        .first()
    )

    if claim and claim.expires_at and now > claim.expires_at:
        claim.status = VoucherConstants.CLAIM_EXPIRED
        claim.save(update_fields=["status"])
        if voucher.requires_claim:
            return None, ErrorCodes.VOUCHER_EXPIRED, "Voucher đã hết hạn, vui lòng claim lại."
        claim = None

    if voucher.requires_claim and not claim:
        return None, ErrorCodes.VOUCHER_CLAIM_REQUIRED, "Vui lòng claim voucher trước khi sử dụng."

    usage_count = claim.usage_count if claim else 0
    if voucher.max_usage_per_user and usage_count >= voucher.max_usage_per_user:
        return None, ErrorCodes.VOUCHER_LIMIT_REACHED, "Bạn đã dùng hết lượt cho voucher này."

    discount = voucher.calculate_discount(order_total)
    if discount <= 0:
        return None, ErrorCodes.VOUCHER_NOT_ELIGIBLE, "Voucher không mang lại giảm giá ở đơn hàng hiện tại."

    expires_at = claim.expires_at if claim else voucher.expire_at
    remaining = voucher.max_usage_per_user - usage_count if voucher.max_usage_per_user else None
    return {
        "claim": claim,
        "discount": discount,
        "expires_at": expires_at,
        "usage_remaining": remaining,
        "order_total": order_total,
    }, None, None


def _ensure_claim_for_user(voucher: Voucher, user, now):
    claim, created = VoucherClaim.objects.select_for_update().get_or_create(
        voucher=voucher,
        user=user,
        defaults={
            "expires_at": voucher.get_claim_expiry(now),
        },
    )
    if claim.expires_at and now > claim.expires_at:
        claim.expires_at = voucher.get_claim_expiry(now)
        claim.status = VoucherConstants.CLAIM_ACTIVE
        claim.save(update_fields=["expires_at", "status"])

    if created:
        voucher.total_claimed += 1
        voucher.save(update_fields=["total_claimed"])
    return claim


def _apply_voucher_to_booking_internal(booking, voucher_code, user, order_total, now=None):
    """
    Helper function: Apply voucher code to booking (chỉ lưu code, chưa redeem).
    Returns: (success: bool, error_code, error_message, discount_amount)
    """
    now = now or timezone.now()
    code = _normalize_code(voucher_code)
    
    try:
        voucher = _load_voucher_by_code(code)
        if not voucher:
            return False, ErrorCodes.VOUCHER_NOT_FOUND, "Voucher không tồn tại.", None
        
        hotel_uuid = str(booking.hotel_id.uuid) if booking.hotel_id else None
        context, error_code, error_message = _validate_usage_context(
            voucher=voucher,
            user=user,
            order_total=order_total,
            hotel_id=hotel_uuid,
            now=now,
        )
        if error_code:
            return False, error_code, error_message, None
        
        discount = context["discount"]
        
        # Chỉ lưu code và discount amount, CHƯA trừ usage
        booking.voucher_code = voucher.code
        booking.voucher_discount_amount = discount
        booking.voucher_metadata = {
            "name": voucher.name,
            "appliedAt": now.isoformat(),
            "pending_redeem": True,  # Flag để biết chưa redeem thực sự
        }
        booking.save(update_fields=["voucher_code", "voucher_discount_amount", "voucher_metadata"])
        
        return True, None, None, discount
    except Exception as exc:
        return False, ErrorCodes.VOUCHER_APPLY_FAIL, str(exc), None


def _redeem_voucher_for_booking_internal(booking, user, now=None):
    """
    Helper function: Redeem voucher đã apply vào booking (trừ usage thực sự).
    Chỉ gọi khi payment success.
    Returns: (success: bool, error_code, error_message)
    """
    now = now or timezone.now()
    
    if not booking.voucher_code:
        return False, ErrorCodes.VOUCHER_NOT_FOUND, "Booking chưa có voucher code."
    
    try:
        with transaction.atomic():
            voucher = _load_voucher_by_code(booking.voucher_code, lock=True)
            if not voucher:
                return False, ErrorCodes.VOUCHER_NOT_FOUND, "Voucher không tồn tại."
            
            booking = Booking.objects.select_for_update().get(uuid=booking.uuid)
            print("check booking: ", booking)
            # Kiểm tra lại validation
            hotel_uuid = str(booking.hotel_id.uuid) if booking.hotel_id else None
            print('check hotel id: ', hotel_uuid)
            context, error_code, error_message = _validate_usage_context(
                voucher=voucher,
                user=user,
                order_total=booking.total_price,
                hotel_id=hotel_uuid,
                now=now,
            )
            if error_code:
                # Nếu voucher không còn hợp lệ, xóa khỏi booking
                booking.voucher_code = None
                booking.voucher_discount_amount = 0
                booking.voucher_metadata = {}
                booking.save(update_fields=["voucher_code", "voucher_discount_amount", "voucher_metadata"])
                return False, error_code, error_message
            
            claim = context["claim"]
            print("check claim: ", claim)
            if not claim and not voucher.requires_claim:
                claim = _ensure_claim_for_user(voucher, user, now)
            elif not claim and voucher.requires_claim:
                return False, ErrorCodes.VOUCHER_CLAIM_REQUIRED, "Vui lòng claim voucher trước khi sử dụng."
            
            # Bây giờ mới redeem thực sự (trừ usage)
            claim.usage_count += 1
            claim.last_used_at = now
            if claim.usage_count >= voucher.max_usage_per_user:
                claim.status = VoucherConstants.CLAIM_EXHAUSTED
            claim.save(update_fields=["usage_count", "last_used_at", "status"])
            
            voucher.total_used += 1
            if voucher.has_reached_global_limit():
                voucher.status = VoucherConstants.STATUS_EXHAUSTED
            voucher.save(update_fields=["total_used", "status"])
            
            # Link voucher object và xóa flag pending
            booking.voucher = voucher
            booking.voucher_metadata.pop("pending_redeem", None)
            booking.save(update_fields=["voucher", "voucher_metadata"])
            
            # Tạo usage log
            VoucherUsageLog.objects.create(
                voucher=voucher,
                claim=claim,
                booking=booking,
                user=user,
                discount_amount=booking.voucher_discount_amount,
                metadata={"orderTotal": str(booking.total_price)},
                created_by=user,
            )
            
            return True, None, None
    except Booking.DoesNotExist:
        return False, ErrorCodes.NOT_FOUND, "Booking không tồn tại."
    except Exception as exc:
        return False, ErrorCodes.VOUCHER_REDEEM_FAIL, str(exc)


@auto_schema_post(VoucherSerializer)
@permission_classes([IsAdminUser])
@api_view(["POST"])
def add_voucher(request):
    try:
        serializer = VoucherSerializer(data=request.data, context={"request": request})
        if serializer.is_valid():
            with transaction.atomic():
                voucher = serializer.save(created_by=request.user)
                if request.user:
                    voucher.updated_by = request.user
                    voucher.save(update_fields=["updated_by"])
            return AppResponse.success(
                SuccessCodes.CREATE_VOUCHER,
                data={"data": VoucherSerializer(voucher).data},
            )
        return AppResponse.error(ErrorCodes.CREATE_VOUCHER_FAIL, serializer.errors)
    except Exception as exc:
        return AppResponse.error(ErrorCodes.CREATE_VOUCHER_FAIL, str(exc))


@auto_schema_patch(VoucherSerializer)
@auto_schema_delete(VoucherSerializer)
@permission_classes([IsAdminUser])
@api_view(["PATCH", "DELETE"])
def voucher_detail(request, uuid):
    try:
        voucher = Voucher.objects.prefetch_related("hotels").get(uuid=uuid)

        if request.method == "PATCH":
            serializer = VoucherListSerializer(
                voucher, data=request.data, partial=True, context={"request": request}
            )
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(
                    SuccessCodes.UPDATE_VOUCHER,
                    data={"data": VoucherSerializer(updated).data},
                )
            return AppResponse.error(ErrorCodes.UPDATE_VOUCHER_FAIL, serializer.errors)

        voucher.delete()
        return AppResponse.success(SuccessCodes.DELETE_VOUCHER)
    except Voucher.DoesNotExist:
        return AppResponse.error(ErrorCodes.VOUCHER_NOT_FOUND, "Voucher không tồn tại.")
    except Exception as exc:
        return AppResponse.error(ErrorCodes.UPDATE_VOUCHER_FAIL, str(exc))


@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(["POST"])
def list_voucher(request):
    try:
        queryset = (
            Voucher.objects.select_related()
            .select_related()
            .prefetch_related("hotels")
            .all()
        )
        paginated, total = Querykit.apply_filter_paginate_search_sort(
            request=request, queryset=queryset
        ).values()
        serializer = VoucherListSerializer(paginated, many=True)
        return AppResponse.success(
            SuccessCodes.LIST_VOUCHER, data={"data": serializer.data, "total": total}
        )
    except Exception as exc:
        return AppResponse.error(ErrorCodes.LIST_VOUCHER_FAIL, str(exc))


@auto_schema_post(VoucherClaimRequestSerializer)
@permission_classes([IsAuthenticated])
@api_view(["POST"])
def claim_voucher(request):
    from utils.voucher_utils import VoucherUtis
    serializer = VoucherClaimRequestSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    code = _normalize_code(serializer.validated_data["code"])
    now = timezone.now()
    try:
        status, header_response, message, already_claimed, claim = VoucherUtis.claim_voucher(code, now, request.user)
        if(status =='error'):
            return AppResponse.error(header_response, message)
        payload = VoucherClaimSerializer(claim).data
        payload["alreadyClaimed"] = already_claimed
        return AppResponse.success(
            SuccessCodes.CLAIM_VOUCHER, payload
        )
    except Exception as exc:
        return AppResponse.error(ErrorCodes.VOUCHER_CLAIM_FAIL, str(exc))


@auto_schema_get(VoucherClaimSerializer, many=True)
@permission_classes([IsAuthenticated])
@api_view(["GET"])
def list_my_voucher(request):
    try:
        claims = (
            VoucherClaim.objects.select_related("voucher")
            .filter(user=request.user)
            .order_by("expires_at", "created_at")
        )
        serializer = VoucherClaimSerializer(claims, many=True)
        return AppResponse.success(
            SuccessCodes.LIST_MY_VOUCHER,  serializer.data
        )
    except Exception as exc:
        return AppResponse.error(ErrorCodes.LIST_VOUCHER_FAIL, str(exc))


@auto_schema_post(VoucherPreviewSerializer)
@permission_classes([IsAuthenticated])
@api_view(["POST"])
def preview_voucher(request):
    '''
    hàm này sẽ trả thông tin để user kiểm tra xem giá thành khi áp dụng
    voucher này có hợp lí và thỏa mãn không, đồng thời check luôn voucher
    này có áp dụng được hay không
    '''
    serializer = VoucherPreviewSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    code = _normalize_code(serializer.validated_data["code"])
    hotel_id = serializer.validated_data.get("hotel_id")
    order_total = serializer.validated_data["order_total"]
    now = timezone.now()
    try:
        voucher = _load_voucher_by_code(code)
        if not voucher:
            return AppResponse.error(
                ErrorCodes.VOUCHER_NOT_FOUND, "Voucher không tồn tại."
            )
        context, error_code, error_message = _validate_usage_context(
            voucher=voucher,
            user=request.user,
            order_total=order_total,
            hotel_id=hotel_id,
            now=now,
        )
        if error_code:
            return AppResponse.error(error_code, error_message)

        data = {
            "code": voucher.code,
            "discountAmount": context["discount"],
            "finalTotal": context["order_total"] - context["discount"],
            "expiresAt": context["expires_at"],
            "usageRemaining": context["usage_remaining"],
        }
        return AppResponse.success(
            SuccessCodes.PREVIEW_VOUCHER, data
        )
    except Exception as exc:
        return AppResponse.error(ErrorCodes.VOUCHER_PREVIEW_FAIL, str(exc))


@auto_schema_post(VoucherRedeemSerializer)
@permission_classes([IsAuthenticated])
@api_view(["POST"])
def redeem_voucher(request):
    """
    DEPRECATED: Nên dùng apply_voucher + auto redeem khi payment success.
    API này vẫn hoạt động để backward compatibility:
    - Nếu booking đã có voucher_code (đã apply), sẽ redeem ngay
    - Nếu chưa có, sẽ apply + redeem luôn (không khuyến khích)
    """
    serializer = VoucherRedeemSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    code = _normalize_code(serializer.validated_data["code"])
    order_total = serializer.validated_data["order_total"]
    booking_uuid = serializer.validated_data["booking_uuid"]
    now = timezone.now()
    try:
        with transaction.atomic():
            booking = (
                Booking.objects.select_for_update()
                .select_related("hotel_id", "created_by")
                .get(uuid=booking_uuid)
            )
            
            if (
                booking.created_by
                and booking.created_by != request.user
                and not request.user.is_staff
            ):
                return AppResponse.error(
                    ErrorCodes.PERMISSION_DENIED,
                    "Bạn không thể áp dụng voucher cho booking này.",
                )
            
            # Nếu booking đã có voucher_code và đã redeem (không có pending_redeem)
            if booking.voucher_code and booking.voucher:
                if booking.voucher_code != code:
                    return AppResponse.error(
                        ErrorCodes.VOUCHER_ALREADY_APPLIED,
                        "Booking đã áp dụng voucher khác.",
                    )
                return AppResponse.error(
                    ErrorCodes.VOUCHER_ALREADY_APPLIED,
                    "Voucher đã được redeem cho booking này.",
                )
            
            # Nếu booking đã có voucher_code nhưng chưa redeem (có pending_redeem)
            if booking.voucher_code == code and booking.voucher_metadata.get("pending_redeem"):
                # Chỉ cần redeem thôi (đã apply rồi)
                success, error_code, error_message = _redeem_voucher_for_booking_internal(
                    booking, request.user, now
                )
                if not success:
                    return AppResponse.error(error_code, error_message)
                
                data = {
                    "booking": booking.uuid,
                    "discountAmount": booking.voucher_discount_amount,
                    "finalTotal": Decimal(order_total) - booking.voucher_discount_amount,
                }
                return AppResponse.success(
                    SuccessCodes.REDEEM_VOUCHER, data
                )
            
            # Nếu chưa có voucher_code, apply + redeem luôn (backward compatible)
            voucher = _load_voucher_by_code(code, lock=True)
            if not voucher:
                return AppResponse.error(
                    ErrorCodes.VOUCHER_NOT_FOUND, "Voucher không tồn tại."
                )
            
            # Apply trước
            success, error_code, error_message, discount = _apply_voucher_to_booking_internal(
                booking, code, request.user, order_total, now
            )
            if not success:
                return AppResponse.error(error_code, error_message)
            
            # Redeem ngay
            success, error_code, error_message = _redeem_voucher_for_booking_internal(
                booking, request.user, now
            )
            if not success:
                return AppResponse.error(error_code, error_message)
            
            data = {
                "booking": booking.uuid,
                "discountAmount": discount,
                "finalTotal": Decimal(order_total) - discount,
            }
            return AppResponse.success(
                SuccessCodes.REDEEM_VOUCHER, data
            )
    except Booking.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Booking không tồn tại.")
    except Exception as exc:
        return AppResponse.error(ErrorCodes.VOUCHER_REDEEM_FAIL, str(exc))


@auto_schema_post(VoucherRevertSerializer)
@permission_classes([IsAuthenticated])
@api_view(["POST"])
def revert_voucher_usage(request):
    serializer = VoucherRevertSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    booking_uuid = serializer.validated_data["booking_uuid"]
    now = timezone.now()
    try:
        with transaction.atomic():
            booking = (
                Booking.objects.select_for_update()
                .select_related("voucher", "created_by")
                .get(uuid=booking_uuid)
            )
            if not booking.voucher:
                return AppResponse.error(
                    ErrorCodes.VOUCHER_NOT_FOUND,
                    "Booking chưa áp dụng voucher nào.",
                )
            if (
                booking.created_by
                and booking.created_by != request.user
                and not request.user.is_staff
            ):
                return AppResponse.error(
                    ErrorCodes.PERMISSION_DENIED,
                    "Bạn không có quyền huỷ voucher này.",
                )

            usage_log = (
                VoucherUsageLog.objects.select_for_update()
                .filter(booking=booking, status=VoucherConstants.USAGE_APPLIED)
                .order_by("-used_at")
                .first()
            )
            if not usage_log:
                return AppResponse.error(
                    ErrorCodes.VOUCHER_REVERT_FAIL,
                    "Không tìm thấy lịch sử voucher để hoàn tác.",
                )

            voucher = usage_log.voucher
            claim = usage_log.claim

            if voucher.total_used > 0:
                voucher.total_used -= 1
            if (
                voucher.status == VoucherConstants.STATUS_EXHAUSTED
                and not voucher.has_reached_global_limit()
                and voucher.is_active(now)
            ):
                voucher.status = VoucherConstants.STATUS_ACTIVE
            voucher.save(update_fields=["total_used", "status"])

            if claim and claim.usage_count > 0:
                claim.usage_count -= 1
                if claim.status == VoucherConstants.CLAIM_EXHAUSTED:
                    claim.status = VoucherConstants.CLAIM_ACTIVE
                claim.save(update_fields=["usage_count", "status"])

            booking.voucher = None
            booking.voucher_code = None
            booking.voucher_discount_amount = 0
            booking.voucher_metadata = {}
            booking.save(
                update_fields=[
                    "voucher",
                    "voucher_code",
                    "voucher_discount_amount",
                    "voucher_metadata",
                ]
            )

            usage_log.status = VoucherConstants.USAGE_ROLLED_BACK
            usage_log.rolled_back_by = request.user
            usage_log.rolled_back_at = now
            usage_log.save(
                update_fields=["status", "rolled_back_by", "rolled_back_at"]
            )

            return AppResponse.success(
                SuccessCodes.REVERT_VOUCHER,
                data={"booking": booking.uuid},
            )
    except Booking.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Booking không tồn tại.")
    except Exception as exc:
        return AppResponse.error(ErrorCodes.VOUCHER_REVERT_FAIL, str(exc))


@auto_schema_post(VoucherApplySerializer)
@permission_classes([IsAuthenticated])
@api_view(["POST"])
def apply_voucher(request):
    """
    Apply voucher code to booking (chỉ lưu code, chưa redeem).
    Chỉ redeem thực sự khi payment success.
    Nếu session hết hạn, chỉ cần xóa voucher_code, không cần revert vì chưa trừ usage.
    """
    serializer = VoucherApplySerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    code = serializer.validated_data["code"]
    booking_uuid = serializer.validated_data["booking_uuid"]
    order_total = serializer.validated_data["order_total"]
    now = timezone.now()
    
    try:
        with transaction.atomic():
            booking = Booking.objects.select_for_update().get(uuid=booking_uuid)
            
            # Kiểm tra quyền
            if (
                booking.created_by
                and booking.created_by != request.user
                and not request.user.is_staff
            ):
                return AppResponse.error(
                    ErrorCodes.PERMISSION_DENIED,
                    "Bạn không thể áp dụng voucher cho booking này.",
                )
            
            # Nếu đã có voucher khác, cần revert trước
            # if booking.voucher_code and booking.voucher_code != _normalize_code(code):
            #     return AppResponse.error(
            #         ErrorCodes.VOUCHER_ALREADY_APPLIED,
            #         "Booking đã có voucher khác. Vui lòng hủy voucher cũ trước.",
            #     )
            
            # Nếu đã có voucher này rồi
            if booking.voucher_code == _normalize_code(code):
                return AppResponse.error(
                    ErrorCodes.VOUCHER_ALREADY_APPLIED,
                    "Voucher đã được áp dụng cho booking này.",
                )
            
            # Apply voucher (chỉ lưu code, chưa redeem)
            success, error_code, error_message, discount = _apply_voucher_to_booking_internal(
                booking, code, request.user, order_total, now
            )
            
            if not success:
                return AppResponse.error(error_code, error_message)
            
            data = {
                "booking": booking.uuid,
                "code": booking.voucher_code,
                "discountAmount": discount,
                "finalTotal": Decimal(order_total) - discount,
                "message": "Voucher đã được áp dụng. Sẽ được redeem khi thanh toán thành công.",
            }
            return AppResponse.success(
                SuccessCodes.PREVIEW_VOUCHER, data
            )
    except Booking.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Booking không tồn tại.")
    except Exception as exc:
        return AppResponse.error(ErrorCodes.VOUCHER_APPLY_FAIL, str(exc))

