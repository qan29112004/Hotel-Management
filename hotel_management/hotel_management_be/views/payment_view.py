import datetime
import json
from django.shortcuts import redirect
from constants.hotel_constants import HotelConstants
from utils.swagger_decorators import auto_schema_post, auto_schema_get, auto_schema_patch, auto_schema_delete
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny,IsAuthenticated, IsAdminUser
from libs.response_handle import AppResponse
from hotel_management_be.models.user import User
from rest_framework.decorators import api_view
from constants.success_codes import SuccessCodes
from configuration.jwt_config import JwtConfig
from hotel_management_be.serializers.offer_serializer import *
from hotel_management_be.serializers.payment_serializer import *
from django.contrib.auth import authenticate
from constants.error_codes import ErrorCodes
from django.contrib.auth.models import update_last_login
from libs.Redis import RedisWrapper, RedisUtils
from libs.querykit.querykit_serializer import (
    QuerykitSerializer,
)
from hotel_management_be.models.booking import BookingSession, Booking, Payment
from hotel_management_be.models.hotel import Hotel
from django.db import transaction
from libs.querykit.querykit import Querykit
from utils.utils import Utils
from django.conf import settings
import hmac, hashlib, urllib.parse, json
from decimal import Decimal
from utils.paypal_utils import PayPalService
from hotel_management_be.celery_hotel.task import set_booking_room, send_booking_email
from hotel_management_be.views.voucher_view import _redeem_voucher_for_booking_internal
from utils.vnpay_errors import get_vnpay_error_message
from utils.refund_utils import calculate_refund_amount, can_refund_booking
from utils.paypal_utils import PayPalService
from django.utils import timezone
from datetime import timedelta


@auto_schema_post(PaymentSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def add_payment(request):
    try:
        
        serializers = PaymentSerializer(data=request.data, context={'request':request})
        if serializers.is_valid():
            new_payment = serializers.save(created_by = request.user)
            return AppResponse.success(SuccessCodes.CREATE_AMENITY, data={"data":PaymentSerializer(new_payment).data})
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, str(e))
    
@auto_schema_patch(PaymentSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(PaymentSerializer)
@permission_classes([IsAdminUser])
@api_view(['PATCH', 'DELETE'])
def payment_detail(request, uuid):
    try:
        payment = Payment.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':
            
            serializer = PaymentSerializer(payment, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": PaymentSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            
            payment.delete()
            return AppResponse.success(SuccessCodes.DELETE_AMENITY)

    except Payment.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Payment not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
    
@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_payment(request):
    try:
        list_payment = Payment.objects.all()
        paginated_payment, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=list_payment).values()
        serializers = PaymentSerializer(paginated_payment, many=True)
        return AppResponse.success(SuccessCodes.LIST_AMENITY, data={'data':serializers.data, 'total':total})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_AMENITY_FAIL, str(e))
    
    

@api_view(["POST"])

def create_payment(request):
    data = request.data
    method = data.get("method")
    currency = data.get("currency", "VND")
    session_id = data.get('session_id', 'payment or repayment')
    booking_id = data.get('booking_id', '')
    action = data.get('action','')
    
    if action == "Repayment":
        booking = Booking.objects.get(uuid=booking_id)
    else:
        hotel = Hotel.objects.get(name=data["hotel_name"])
        booking, created = Booking.objects.update_or_create(
            uuid=booking_id,
            defaults={
                'hotel_id':hotel,
                "user_email": data["user_email"],
                "session_id": session_id,
                "user_fullname": data["user_fullname"],
                "user_phone": data["user_phone"],
                "user_country": data["user_country"],
                "num_guest": int(data["num_guest"]),
                "total_rooms": int(data["total_rooms"]),
                "total_price": Decimal(data["total_price"]),
                "price_in_vnd": Decimal(data["total_price"])if currency=='VND' else Decimal(data["total_price"])*25000,
                "status": "Pending",
                'check_in':data["check_in"],
                'check_out':data["check_out"]
            }
        )
        set_booking_room.delay(session_id,booking_id)
    if method == "vnpay":
        redirect_url = Utils.generate_vnpay_url(booking, request,session_id)
        return AppResponse.success(SuccessCodes.PAYMENT,{"redirect_url": redirect_url})

    elif method == "paypal":
        order = PayPalService.create_order(booking.total_price, currency, booking.uuid)
        return AppResponse.success(SuccessCodes.PAYMENT,{"booking_id": booking.uuid, "paypal_order": order})

    return AppResponse.error(ErrorCodes.PAYMENT,{'message': "Unsupported payment method"})

@api_view(["POST"])
def paypal_capture(request):
    """Sau khi người dùng thanh toán thành công → gọi API này để xác nhận"""
    order_id = request.data.get("order_id")
    booking_id = request.data.get("booking_id")
    session_id = request.data.get("session_id")

    if not order_id or not booking_id:
        return AppResponse.error(ErrorCodes.PAYMENT,{'message': "Missing parameters"})

    # ===  Gọi PayPal để xác nhận thanh toán ===
    try:
        result = PayPalService.capture_payment(order_id)
        print(result)
        
        # Kiểm tra nếu PayPal trả về lỗi
        if result.get("status") != "COMPLETED":
            # Thanh toán thất bại
            booking = Booking.objects.get(uuid=booking_id)
            Payment.objects.create(
                booking=booking,
                amount=Decimal(0),
                status="Fail",
                transaction_id=f"FAILED_{order_id}",
                method="PayPal",
                currency="USD"
            )
            booking.status = "Pending"
            booking.save()
            return AppResponse.error(ErrorCodes.PAYMENT,{
                'message': "Payment failed",
                "message": result.get("message", "PayPal payment was not completed"),
                "booking_id": booking_id
            })
        
        # === Lấy thông tin transaction ===
        transaction_id = result["purchase_units"][0]["payments"]["captures"][0]["id"]
        amount = Decimal(result["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"])
        currency = result["purchase_units"][0]["payments"]["captures"][0]["amount"]["currency_code"]

        # ===  Cập nhật CSDL ===
        booking = Booking.objects.select_related("hotel_id", "created_by").get(uuid=booking_id)
        payment, created  = Payment.objects.update_or_create(
            booking=booking,
            defaults={
                "amount": amount,
                "status": "Paid",  
                "transaction_id": transaction_id,
                "method": "PayPal",
                "currency": currency
            }
        )
        booking.status = "Confirm"
        booking.save()
        
        # Redeem voucher nếu có (chỉ redeem khi payment success)
        if booking.voucher_code:
            user = booking.created_by if booking.created_by else None
            if user:
                success, error_code, error_message = _redeem_voucher_for_booking_internal(
                    booking, user
                )
                if not success:
                    # Log error nhưng không fail payment
                    print(f"Voucher redeem failed for booking {booking_id}: {error_message}")
        
        
        hotel = booking.hotel_id
        # set_booking_room.delay(session_id,booking_id)
        
        RedisUtils.finalize_booking_success(session_id, booking_id)
        payload = {
            "to_email":booking.user_email,
            "transactionId":payment.transaction_id,
            "money":payment.amount,
            'currency':payment.currency,
            "user_name":booking.user_fullname,
            "hotel_name":hotel.name,
            "checkin": booking.check_in,
            "checkout":booking.check_out,
            "check_in_time":Utils.format_time(hotel.check_in_time),
            "check_out_time":Utils.format_time(hotel.check_out_time)
        }
        send_booking_email.delay(payload)
        return AppResponse.success(SuccessCodes.PAYMENT,{"message": "Payment captured successfully", "transaction_id": transaction_id,"response_code":'00', "amount": payment.amount, 'booking_id': booking_id})
    except Exception as e:
        # Xử lý lỗi khi gọi PayPal
        booking = Booking.objects.get(uuid=booking_id)
        Payment.objects.create(
            booking=booking,
            amount=Decimal(0),
            status="Fail",
            transaction_id=f"FAILED_{order_id}",
            method="PayPal",
            currency="USD"
        )
        booking.status = "Pending"
        booking.save()
        return AppResponse.error(ErrorCodes.PAYMENT,{
            'message': "Payment processing failed",
            "message": str(e),
            "booking_id": booking_id,
            "transaction_id": transaction_id,"response_code":'00', "amount": payment.amount
        })



@api_view(["GET"])
def payment_ipn(request):
    """API nhận callback từ VNPAY"""
    
    input_data = request.GET.dict()
    vnp_secure_hash = input_data.pop('vnp_SecureHash', None)

    # ===  Bước 1: Kiểm tra chữ ký HMAC SHA512 ===
    vnp_hash_secret = settings.VNPAY_CONFIG["vnp_HashSecret"]


    if Utils.validate_response(vnp_hash_secret, vnp_secure_hash, input_data) == False:
        return AppResponse.error(ErrorCodes.INVALID_SIGNATURE,{"RspCode": "97", "Message": "Invalid signature"})
    print("SUCCESS PAYMENT")
    # ===  Bước 2: Lấy thông tin booking ===
    txn_ref = input_data.get("vnp_TxnRef")  # uuid booking
    vnp_response_code = input_data.get("vnp_ResponseCode")
    vnp_transaction_status = input_data.get("vnp_TransactionStatus")
    vnp_amount = Decimal(input_data.get("vnp_Amount", 0)) / 100
    vnp_transaction_no = input_data.get("vnp_TransactionNo")
    session_id = request.GET.get("vnp_OrderInfo")

    try:
        booking = Booking.objects.select_related("hotel_id", "created_by").get(uuid=txn_ref)
    except Booking.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND,{"RspCode": "01", "Message": "Booking not found"})

    # ===  Bước 3: Xử lý kết quả thanh toán ===
    if vnp_response_code == "00" and vnp_transaction_status == "00":
        # Thanh toán thành công
        payment, created  = Payment.objects.update_or_create(
            booking=booking,
            defaults={
                "amount": vnp_amount,
                "status": "Paid",  
                "transaction_id": vnp_transaction_no,
                "method": "vnpay",
                "currency": 'VND'
            }
        )
        booking.status = "Confirm"
        booking.save()
        # Redeem voucher nếu có (chỉ redeem khi payment success)
        if booking.voucher_code:
            user = booking.created_by if booking.created_by else None
            if user:
                success, error_code, error_message = _redeem_voucher_for_booking_internal(
                    booking, user, skip_lock=False
                )
                if not success:
                    # Log error nhưng không fail payment
                    print(f"Voucher redeem failed for booking {txn_ref}: {error_message}")
        
        hotel = booking.hotel_id
        # set_booking_room.delay(session_id, txn_ref)
        RedisUtils.finalize_booking_success(session_id, txn_ref)
        payload = {
            "to_email":booking.user_email,
            "transactionId":payment.transaction_id,
            "money":payment.amount,
            'currency':payment.currency,
            "user_name":booking.user_fullname,
            "hotel_name":hotel.name,
            "checkin": booking.check_in,
            "checkout":booking.check_out,
            "check_in_time":Utils.format_time(hotel.check_in_time),
            "check_out_time":Utils.format_time(hotel.check_out_time)
        }
        send_booking_email.delay(payload)
        return AppResponse.success(SuccessCodes.PAYMENT,{"RspCode": "00", "Message": "Confirm Success"})
    else:
        # Thanh toán thất bại - đặt booking về Pending để cho phép thanh toán lại
        error_message = get_vnpay_error_message(vnp_response_code)
        Payment.objects.create(
            booking=booking,
            amount=vnp_amount,
            status="Fail",
            transaction_id=vnp_transaction_no or f"FAILED_{txn_ref}",
            method="vnpay",
        )
        # Đặt booking về Pending thay vì Fail để cho phép retry
        booking.status = "Pending"
        booking.save()
        return AppResponse.error(ErrorCodes.PAYMENT,{
            "RspCode": vnp_response_code, 
            "Message": error_message,
            "booking_id": txn_ref
        })

def update_payment_status(payment):
    total_refunded = sum(ref.amount for ref in payment.refunds.all())
    
    if total_refunded == 0:
        payment.status = "Paid"
    elif total_refunded < payment.amount:
        payment.status = "Partially Refunded"
    elif total_refunded >= payment.amount:
        payment.status = "Refund"
    
    payment.save(update_fields=["status"])

@api_view(["GET"])
def check_booking_expiration(request):
    """API kiểm tra và cập nhật booking hết hạn (3 giờ sau khi thanh toán thất bại)"""
    from django.utils import timezone
    from datetime import timedelta
    
    # Lấy tất cả booking Pending đã quá 3 giờ
    three_hours_ago = timezone.now() - timedelta(hours=3)
    expired_bookings = Booking.objects.filter(
        status="Pending",
        updated_at__lt=three_hours_ago
    )
    
    count = 0
    for booking in expired_bookings:
        # Kiểm tra xem có payment Fail nào không
        failed_payments = Payment.objects.filter(booking=booking, status="Fail")
        if failed_payments.exists():
            booking.status = "Expired"
            booking.save()
            count += 1
    
    return AppResponse.success(SuccessCodes.SUCCESS_CHECK_EXPIRE_REFUND, {"expired_count": count})

@api_view(["POST"])
@permission_classes([IsAuthenticated])
def process_refund(request):
    """API xử lý yêu cầu hoàn tiền cho booking"""
    booking_id = request.data.get("booking_id")
    
    if not booking_id:
        return AppResponse.error(ErrorCodes.INVALID_PARAMS, {'message': "Missing booking_id"})
    
    try:
        booking = Booking.objects.get(uuid=booking_id)
    except Booking.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, {'message': "Booking not found"})
    
    # Kiểm tra quyền (chỉ owner hoặc admin mới được refund)
    user = request.user
    if booking.user_email != user.email and not user.is_staff:
        return AppResponse.error(ErrorCodes.PERMISSION_DENIED, {'message': "Permission denied"})
    
    # Kiểm tra booking có thể refund không
    if not can_refund_booking(booking):
        return AppResponse.error(ErrorCodes.PAYMENT, {
            'error': "Booking không thể hoàn tiền",
            "message": "Một số phòng có rate plan không cho phép hoàn tiền"
        })
    
    # Tính toán số tiền hoàn lại
    refund_info = calculate_refund_amount(booking)
    
    if not refund_info['refundable']:
        return AppResponse.error(ErrorCodes.PAYMENT, {
            'error': "Không thể hoàn tiền",
            "message": refund_info['message']
        })
    
    # Lấy payment đã thanh toán
    paid_payment = Payment.objects.filter(booking=booking, status="Paid").first()
    if not paid_payment:
        return AppResponse.error(ErrorCodes.NOT_FOUND, {'message': "Payment not found"})
    
    # Xử lý refund theo phương thức thanh toán
    refund_amount = refund_info['refund_amount']
    refund_status = "Pending"
    refund_transaction_id = None
    error_message = None
    print("check booking and paymeny", booking.uuid, paid_payment.method, paid_payment.uuid)
    try:
        if paid_payment.method == "vnpay":
            # Format transaction_date từ payment (cần lưu khi tạo payment)
            # Tạm thời dùng created_at
            transaction_date = paid_payment.created_datetime.strftime("%Y%m%d%H%M%S")
            transaction_type = "02" if refund_amount >= paid_payment.amount else "03"  # 02=full, 03=partial
            
            result = Utils.refund_vnpay(
                booking=booking,
                transaction_id=paid_payment.transaction_id,
                amount=refund_amount,
                transaction_date=transaction_date,
                transaction_type=transaction_type,
                request=request
            )
            
            if result.get("success"):
                refund_transaction_id = result.get("refund_id")
                refund_status = "Completed"
            else:
                refund_status = "Fail"
                error_message = result.get('error', "VNPay refund failed")
        
        elif paid_payment.method == "PayPal":
            # PayPal refund
            try:
                result = PayPalService.refund_payment(
                    capture_id=paid_payment.transaction_id,
                    amount=float(refund_amount)/25000,
                    currency=paid_payment.currency or "USD",
                    note=f"Refund for booking {booking_id}"
                )
                
                if result.get("status") == "COMPLETED":
                    refund_transaction_id = result.get("id")
                    refund_status = "Completed"
                else:
                    refund_status = "Fail"
                    error_message = f"PayPal refund status: {result.get('status')}"
            except Exception as e:
                refund_status = "Fail"
                error_message = str(e)
        
        else:
            return AppResponse.error(ErrorCodes.PAYMENT, {'message': "Unsupported payment method"})
        
        # Tạo Refund record
        from hotel_management_be.models.booking import Refund
        refund = Refund.objects.create(
            payment=paid_payment,
            amount=refund_amount,
            status=refund_status
        )
        
        # Cập nhật booking status
        if refund_status == "Completed":
            booking.status = "Cancelled"
            booking.save()
            
            # Cập nhật payment status
            update_payment_status(paid_payment)
        
        return AppResponse.success(SuccessCodes.SUCCESS_REFUND, {
            "refund_id": str(refund.uuid),
            "refund_amount": str(refund_amount),
            "refund_percentage": str(refund_info['refund_percentage']),
            "status": refund_status,
            "transaction_id": refund_transaction_id,
            "message": refund_info['message'] if refund_status == "Completed" else error_message
        })
    
    except Exception as e:
        return AppResponse.error(ErrorCodes.PAYMENT, {
            'message': "Refund processing failed",
            "message": str(e)
        })

@api_view(["GET"])
def get_refund_info(request, booking_id):
    """API lấy thông tin refund cho booking (preview)"""
    try:
        booking = Booking.objects.get(uuid=booking_id)
    except Booking.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, {"message": "Booking not found"})
    
    # Kiểm tra quyền
    user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
    if user and booking.user_email != user.email and not user.is_staff:
        return AppResponse.error(ErrorCodes.PERMISSION_DENIED, {"message": "Permission denied"})
    
    refund_info = calculate_refund_amount(booking)
    
    return AppResponse.success(SuccessCodes.SUCCESS_REFUND_INFO, {
        "refundable": refund_info['refundable'],
        "refund_amount": str(refund_info['refund_amount']),
        "refund_percentage": str(refund_info['refund_percentage']),
        "message": refund_info['message']
    })