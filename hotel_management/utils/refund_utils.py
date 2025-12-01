"""
Utility functions for refund processing
"""
from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from hotel_management_be.models.booking import Booking, BookingRoom, Payment
from hotel_management_be.models.offer import RatePlan


def calculate_refund_amount(booking, cancellation_date=None):
    """
    Tính toán số tiền hoàn lại dựa trên chính sách refund của rate plan
    
    Args:
        booking: Booking object
        cancellation_date: Ngày hủy (mặc định là hôm nay)
    
    Returns:
        dict: {
            'refundable': bool,
            'refund_amount': Decimal,
            'refund_percentage': Decimal,
            'message': str
        }
    """
    if cancellation_date is None:
        cancellation_date = timezone.now().date()
    
    # Kiểm tra booking có status Confirm không
    if booking.status != "Confirm":
        return {
            'refundable': False,
            'refund_amount': Decimal(0),
            'refund_percentage': Decimal(0),
            'message': 'Booking không ở trạng thái Confirm, không thể hoàn tiền'
        }
    
    # Lấy payment đã thanh toán thành công
    paid_payment = Payment.objects.filter(booking=booking, status="Paid").first()
    currency = paid_payment.currency
    if not paid_payment:
        return {
            'refundable': False,
            'refund_amount': Decimal(0),
            'refund_percentage': Decimal(0),
            'message': 'Không tìm thấy payment đã thanh toán'
        }
    
    # Lấy tất cả booking rooms
    booking_rooms = BookingRoom.objects.filter(booking_id=booking)
    if not booking_rooms.exists():
        return {
            'refundable': False,
            'refund_amount': Decimal(0),
            'refund_percentage': Decimal(0),
            'message': 'Không tìm thấy phòng đã đặt'
        }
    
    # Kiểm tra xem có rate plan nào không cho phép refund không
    # non_refundable_rooms = booking_rooms.filter(rate_plan_id__refundable=False)
    # if non_refundable_rooms.exists():
    #     return {
    #         'refundable': False,
    #         'refund_amount': Decimal(0),
    #         'refund_percentage': Decimal(0),
    #         'message': 'Một số phòng có rate plan không cho phép hoàn tiền'
    #     }
    
    # Tính số ngày từ khi booking đến khi hủy
    booking_date = booking.created_datetime if booking.created_at else booking.updated_datetime
    days_since_booking = (cancellation_date - booking_date.date()).days
    
    # Tính tổng refund amount
    total_refund_amount = Decimal(0)
    total_original_amount = Decimal(0)
    
    for booking_room in booking_rooms:
        if(booking_rooms.filter(rate_plan_id__refundable=False).exists()):continue
        rate_plan = booking_room.rate_plan_id
        total_original_amount += booking_room.subtotal
        
        # Tính refund cho từng phòng
        if days_since_booking <= rate_plan.refund_full_days:
            # Full refund
            room_refund = booking_room.subtotal
        elif days_since_booking <= rate_plan.refund_partial_days:
            # Partial refund
            refund_percentage = rate_plan.refund_partial_percentage
            room_refund = booking_room.subtotal * (refund_percentage / Decimal(100))
        else:
            # No refund
            room_refund = Decimal(0)
        
        total_refund_amount += room_refund
    
    # Cộng thêm services nếu có
    for booking_room in booking_rooms:
        services = booking_room.booking_room_service.all()
        for service in services:
            total_original_amount += service.price * service.quantity
            if days_since_booking <= booking_room.rate_plan_id.refund_full_days:
                total_refund_amount += service.price * service.quantity
            elif days_since_booking <= booking_room.rate_plan_id.refund_partial_days:
                refund_percentage = booking_room.rate_plan_id.refund_partial_percentage
                total_refund_amount += (service.price * service.quantity) * (refund_percentage / Decimal(100))
    
    # Áp dụng voucher discount nếu có (không hoàn lại phần voucher)
    if booking.voucher_discount_amount and booking.voucher_discount_amount > 0:
        # Trừ phần voucher discount khỏi refund
        total_refund_amount = max(Decimal(0), total_refund_amount - booking.voucher_discount_amount)
    
    # Tính refund_percentage dựa trên tổng số tiền
    if total_original_amount > 0:
        refund_percentage = (total_refund_amount / total_original_amount) * Decimal(100)
    else:
        refund_percentage = Decimal(0)
    
    if total_refund_amount > 0:
        return {
            'currency':currency,
            'refundable': True,
            'refund_amount': total_refund_amount,
            'refund_percentage': refund_percentage,
            'message': f'Hoàn tiền {refund_percentage:.2f}% - Số tiền: {total_refund_amount}'
        }
    else:
        return {
            'currency':currency,
            'refundable': False,
            'refund_amount': Decimal(0),
            'refund_percentage': Decimal(0),
            'message': 'Đã quá thời hạn hoàn tiền'
        }


def can_refund_booking(booking):
    """
    Kiểm tra xem booking có thể hoàn tiền hay không
    """
    if booking.status != "Confirm":
        return False
    
    # Kiểm tra xem có rate plan không cho phép refund không
    booking_rooms = BookingRoom.objects.filter(booking_id=booking)
    non_refundable = booking_rooms.filter(rate_plan_id__refundable=False).exists()
    
    return not non_refundable

