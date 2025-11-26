import datetime
import json
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
from django.contrib.auth import authenticate
from constants.error_codes import ErrorCodes
from django.contrib.auth.models import update_last_login
from libs.Redis import RedisWrapper, RedisUtils
from libs.querykit.querykit_serializer import (
    QuerykitSerializer,
)
from hotel_management_be.models.booking import BookingSession
from django.db import transaction
from libs.querykit.querykit import Querykit
from utils.utils import Utils
from django.conf import settings
import hmac, hashlib, urllib.parse, json
from decimal import Decimal
from utils.paypal_utils import PayPalService
from hotel_management_be.celery_hotel.task import set_booking_room, send_booking_email
from hotel_management_be.views.voucher_view import _redeem_voucher_for_booking_internal

@api_view(["POST"])
def create_payment(request):
    data = request.data
    method = data.get("method")
    currency = data.get("currency", "VND")
    session_id = data.get('session_id')
    booking_id = data.get('booking_id')
    
    hotel = Hotel.objects.get(name=data["hotel_name"])
    # session = BookingSession.objects.get(uuid = session_id)
    # Tạo booking pending
    # booking = Booking.objects.create(
    #     user_email=data["user_email"],
    #     user_fullname = data["user_fullname"],
    #     user_phone = data["user_phone"],
    #     user_country = data["user_country"],
    #     hotel_id=hotel,
    #     check_in=data["check_in"],
    #     check_out=data["check_out"],
    #     num_guest=int(data["num_guest"]),
    #     total_rooms=int(data["total_rooms"]),
    #     total_price=Decimal(data["total_price"]),
    #     status="Pending"
    # )
    booking, created = Booking.objects.update_or_create(
        uuid=booking_id,
        defaults={
            'hotel_id':hotel,
            "user_email": data["user_email"],
            "user_fullname": data["user_fullname"],
            "user_phone": data["user_phone"],
            "user_country": data["user_country"],
            "num_guest": int(data["num_guest"]),
            "total_rooms": int(data["total_rooms"]),
            "total_price": Decimal(data["total_price"]),
            "status": "Pending",
            'check_in':data["check_in"],
            'check_out':data["check_out"]
        }
    )

    if method == "vnpay":
        redirect_url = Utils.generate_vnpay_url(booking, request,session_id)
        return AppResponse.success(SuccessCodes.PAYMENT,{"redirect_url": redirect_url})

    elif method == "paypal":
        order = PayPalService.create_order(booking.total_price, currency, booking.uuid)
        return AppResponse.success(SuccessCodes.PAYMENT,{"booking_id": booking.uuid, "paypal_order": order})

    return AppResponse.error(ErrorCodes.PAYMENT,{"error": "Unsupported payment method"})

@api_view(["POST"])
def paypal_capture(request):
    """Sau khi người dùng thanh toán thành công → gọi API này để xác nhận"""
    order_id = request.data.get("order_id")
    booking_id = request.data.get("booking_id")
    session_id = request.data.get("session_id")

    if not order_id or not booking_id:
        return AppResponse.error(ErrorCodes.PAYMENT,{"error": "Missing parameters"})

    # ===  Gọi PayPal để xác nhận thanh toán ===
    result = PayPalService.capture_payment(order_id)
    print(result)
    # === Lấy thông tin transaction ===
    transaction_id = result["purchase_units"][0]["payments"]["captures"][0]["id"]
    amount = Decimal(result["purchase_units"][0]["payments"]["captures"][0]["amount"]["value"])
    currency = result["purchase_units"][0]["payments"]["captures"][0]["amount"]["currency_code"]

    # ===  Cập nhật CSDL ===
    booking = Booking.objects.get(uuid=booking_id)
    payment = Payment.objects.create(
        booking=booking,
        amount=amount,
        status="Paid",
        transaction_id=transaction_id,
        method="PayPal",
        currency = currency
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
                print(f"Voucher redeem failed for booking: {error_message}")
    
    
    hotel = booking.hotel_id
    set_booking_room.delay(session_id,booking_id)
    
    RedisUtils.finalize_booking_success(session_id)
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
    return AppResponse.success(SuccessCodes.PAYMENT,{"message": "Payment captured successfully", "transaction_id": transaction_id})



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
        booking = Booking.objects.get(uuid=txn_ref)
    except Booking.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND,{"RspCode": "01", "Message": "Booking not found"})

    # ===  Bước 3: Xử lý kết quả thanh toán ===
    if vnp_response_code == "00" and vnp_transaction_status == "00":
        # Thanh toán thành công
        payment = Payment.objects.create(
            booking=booking,
            amount=vnp_amount,
            status="Paid",
            transaction_id=vnp_transaction_no,
            method="vnpay",
        )
        booking.status = "Confirm"
        booking.save()
        print('check booking voucher: ', booking.voucher_code)
        # Redeem voucher nếu có (chỉ redeem khi payment success)
        if booking.voucher_code:
            user = booking.created_by if booking.created_by else None
            print("check user: ", user)
            if user:
                success, error_code, error_message = _redeem_voucher_for_booking_internal(
                    booking, user
                )
                if not success:
                    # Log error nhưng không fail payment
                    print(f"Voucher redeem failed for booking {txn_ref}: {error_message}")
        
        hotel = booking.hotel_id
        set_booking_room.delay(session_id, txn_ref)
        RedisUtils.finalize_booking_success(session_id)
        print('check booking: ', booking, )
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
        # Thanh toán thất bại
        Payment.objects.create(
            booking=booking,
            amount=vnp_amount,
            status="Fail",
            transaction_id=vnp_transaction_no,
            method="vnpay",
        )
        booking.status = "Fail"
        booking.save()
        return AppResponse.error(ErrorCodes.PAYMENT,{"RspCode": "00", "Message": "Payment Failed"})



def update_payment_status(payment):
    total_refunded = sum(ref.amount for ref in payment.refunds.all())
    
    if total_refunded == 0:
        payment.status = "Paid"
    elif total_refunded < payment.amount:
        payment.status = "Partially Refunded"
    elif total_refunded >= payment.amount:
        payment.status = "Refund"
    
    payment.save(update_fields=["status"])