from libs.Redis import RedisUtils
from hotel_management_be.models.booking import Booking, BookingSession, HoldRecord
class Utils:
    @staticmethod
    def delete_all_sesstion_and_hold(session_id=None, booking_id=None):
        try:    
            if session_id:
                hold_record = list(HoldRecord.objects.filter(session__uuid = session_id))
                
                is_delete = RedisUtils.expire_session_and_holds_immediately(session_id=session_id)
                if is_delete:
                    BookingSession.objects.filter(uuid=session_id).delete()
                    for hr in hold_record:
                        hotel_uuid = hr.room_type.hotel_id.uuid

                        RedisUtils.atomic_increment_inventory_for_range(
                            hotel_uuid,
                            hr.room_type_id,
                            hr.checkin.isoformat(),
                            hr.checkout.isoformat(),
                            hr.quantity
                        )
                        hr.delete()
            if(booking_id):
                Booking.objects.filter(uuid=booking_id).delete()
                RedisUtils.mark_booking_success(booking_id)
            return True
        except:
            return False
