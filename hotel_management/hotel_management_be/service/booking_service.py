from hotel_management_be.models.user import User
from hotel_management_be.models.booking import *
from django.db.models import F, ExpressionWrapper, IntegerField, Sum, Func
from datetime import date
from utils.voucher_utils import VoucherUtis
from django.utils import timezone
from django.db.models.functions import ExtractDay
from libs.Redis import RedisWrapper

class BookingService():
    @staticmethod
    def update_classification_user(user_email):
        total_nights = BookingService.caculate_nights_user(user_email)
        user = User.objects.filter(email=user_email)
        if not user:
            return
        crrUser = user.first()
        # Ưu tiên cấp cao nhất trước
        if total_nights >= 6:
            new_class = "CLUB3"
            code = "CLUB3"
        elif total_nights >= 3:
            new_class = "CLUB2"
            code = "CLUB2"
        else:
            return  # chưa đạt ngưỡng

        # Gán cấp
        crrUser.classification = new_class
        print("check user classification: ",crrUser.classification)
        crrUser.save()
        print("check user after classification: ",crrUser.classification)
        key = f"user:{crrUser.id}"
        RedisWrapper.remove(key)
        # Tự claim voucher
        status, header_response, message, already_claimed, claim = VoucherUtis.claim_voucher(
            code=code,
            now=timezone.now(),
            user=crrUser
        )
        return
    
    @staticmethod
    def caculate_nights_user(user_email):
        bookings = Booking.objects.filter(
            user_email=user_email,
            status="Check Out"
        )

        # Nếu không có booking nào thì trả 0
        if not bookings.exists():
            return 
        nights_expression = ExpressionWrapper(
            Func(
                F('check_in'),
                F('check_out'),
                function='TIMESTAMPDIFF',
                template="%(function)s(DAY, %(expressions)s)",
            ),
            output_field=IntegerField()
        )

        result = bookings.annotate(
            nights=nights_expression
        ).aggregate(
            total_nights=Sum('nights')
        )
        
        return result['total_nights']