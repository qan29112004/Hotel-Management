from django.core.cache import cache
import json
from typing import Any, Optional
import logging
from django_redis import get_redis_connection
import redis
import json
import time
from datetime import datetime, timedelta
from django.utils import timezone
# from hotel_management_be.celery_hotel.task import set_booking_room
from django.conf import settings

logger = logging.getLogger(__name__)


class RedisWrapper:
    @staticmethod
    def save(key: str, value: Any, expire_time: int = None) -> bool:
        try:
            if isinstance(value, (dict, list)):
                value = json.dumps(value)
            cache.set(key, value, timeout=expire_time)
            return True
        except Exception as e:
            logger.error(f"Redis save error: {e}")
            return False

    @staticmethod
    def get(key: str) -> Optional[Any]:
        try:
            value = cache.get(key)
            if value is None:
                return None
            try:
                return json.loads(value)
            except (json.JSONDecodeError, TypeError):
                return value
        except Exception as e:
            logger.error(f"Redis get error: {e}")
            return None

    @staticmethod
    def remove(key: str) -> bool:
        try:
            cache.set(key, None, timeout=1)
            return True
        except Exception as _:
            logger.error(f"Redis remove error")
            return False
        
    @staticmethod
    def remove_by_prefix(prefix:str) -> bool:
        """Xóa tất cả keys chứa prefix"""
        try:
            redis_conn = get_redis_connection("default")
            cursor = 0
            pattern = f"*{prefix}*"
            while True:
                cursor, keys = redis_conn.scan(cursor=cursor, match=pattern, count=100)
                if keys:
                    redis_conn.delete(*keys)
                if cursor == 0:
                    break
            return True
        except Exception as e:
            logger.error(f"Redis remove_by_prefix error: {e}")
            return False

    @staticmethod
    def ttl(key: str) -> int:
        try:
            return cache.ttl(key)
        except Exception as e:
            logger.error(f"Redis ttl error: {e}")
            return -1

class RedisUtils:
    REDIS_URL = getattr(settings, "REDIS_URL", "redis://localhost:6379/1")
    r = redis.Redis.from_url(REDIS_URL, decode_responses=True)  
    
    # Key patterns:
    # inventory:{hotel_id}:{room_type_id}:{date} -> integer (available)
    # hold:{hold_id} -> hash/json with TTL
    # session:{session_id} -> hash: minimal info
    # session:{session_id}:holds -> list of hold ids
    @staticmethod
    def inventory_key(hotel_id, room_type_id, date_str):
        return f"inventory:{hotel_id}:{room_type_id}:{date_str}"
    @staticmethod
    def hold_key(hold_id):
        return f"hold:{hold_id}"
    @staticmethod
    def session_key(session_id):
        return f"session:{session_id}"
    @staticmethod
    def session_holds_key(session_id):
        return f"session:{session_id}:holds"
    @staticmethod
    def session_hold_slot_key(session_id: str, room_index: int) -> str:
        return f"session:{session_id}:holds:{room_index}"

    # ---------- Lua script for multi-key check-and-decr ----------
    # This script checks all KEYS have value >= ARGV[1] (quantity) and if so decrements each by quantity atomically.
    # Usage: atomic_decrement_multi([key1,key2,...], quantity)
    ATOMIC_MULTI_DECR = """
    local qty = tonumber(ARGV[1])
    for i=1,#KEYS do
    local v = tonumber(redis.call('GET', KEYS[i]) or '-1')
    if v == -1 or v < qty then
        return 0
    end
    end
    for i=1,#KEYS do
    redis.call('DECRBY', KEYS[i], qty)
    end
    return 1
    """

    ATOMIC_MULTI_INCR = """
    local qty = tonumber(ARGV[1])
    for i=1,#KEYS do
    redis.call('INCRBY', KEYS[i], qty)
    end
    return 1
    """

    atomic_multi_decr = r.register_script(ATOMIC_MULTI_DECR)
    atomic_multi_incr = r.register_script(ATOMIC_MULTI_INCR)

    # ---------- helpers ----------
    
    @staticmethod
    def set_hold_for_room(session_id: str, room_index: int, hold_id: str, ttl_seconds: int = None):
        key = RedisUtils.session_hold_slot_key(session_id, room_index)
        if ttl_seconds:
            RedisUtils.r.set(key, hold_id, ex=ttl_seconds)
        else:
            RedisUtils.r.set(key, hold_id)
        # also refresh overall session key TTL if present
        try:
            base = RedisUtils.session_key(session_id)
            if RedisUtils.r.exists(base):
                ttl = RedisUtils.r.ttl(base)
                if ttl and ttl > 0:
                    RedisUtils.r.expire(key, ttl)
        except Exception:
            pass
    
    @staticmethod
    def create_hold_in_redis(hold_id: str, payload: dict, ttl_seconds: int = 600):
        key = RedisUtils.hold_key(hold_id)
        RedisUtils.r.set(key, json.dumps(payload), ex=ttl_seconds)
        return True
    
    # @staticmethod
    # def get_session_holds_by_slots(session_id: str, total_slots: Optional[int] = None):
    #     # If total_slots provided, iterate 0..total_slots-1; otherwise try scanning slot keys
    #     hold_ids = []
    #     if total_slots is not None:
    #         for i in range(total_slots):
    #             hid = RedisUtils.r.get(RedisUtils.session_hold_slot_key(session_id, i))
    #             if hid:
    #                 hold_ids.append(hid)
    #     else:
    #         # try to detect slot keys by SCAN pattern
    #         prefix = f"session:{session_id}:holds:"
    #         for k in RedisUtils.r.scan_iter(match=prefix + "*", count=500):
    #             key = k.decode() if isinstance(k, bytes) else k
    #             hid = RedisUtils.r.get(key)
    #             if hid:
    #                 hold_ids.append(hid)
    #     return hold_ids

    @staticmethod
    def get_hold_from_redis(hold_id: str):
        key = RedisUtils.hold_key(hold_id)
        raw = RedisUtils.r.get(key)
        if not raw:
            return None
        try:
            return json.loads(raw)
        except Exception:
            return None
        
    @staticmethod
    def get_hold_for_room(session_id: str, room_index: int):
        return RedisUtils.r.get(RedisUtils.session_hold_slot_key(session_id, room_index))

    # NEW: delete slot
    @staticmethod
    def delete_hold_for_room(session_id: str, room_index: int):
        RedisUtils.r.delete(RedisUtils.session_hold_slot_key(session_id, room_index))    
    
    @staticmethod
    def delete_hold_in_redis(hold_id: str):
        RedisUtils.r.delete(RedisUtils.hold_key(hold_id))
    @staticmethod
    def append_hold_to_session(session_id: str, hold_id: str):
        RedisUtils.r.rpush(RedisUtils.session_holds_key(session_id), hold_id)
        RedisUtils.r.expire(RedisUtils.session_holds_key(session_id), 1800)
        # refresh session TTL from underlying session key if necessary
    @staticmethod
    def delete_session_keys(session_id: str, total_slots: Optional[int] = None):
        # delete list key if exists
        RedisUtils.r.delete(RedisUtils.session_holds_key(session_id))
        # delete slot keys
        if total_slots is not None:
            for i in range(total_slots):
                RedisUtils.r.delete(RedisUtils.session_hold_slot_key(session_id, i))
        else:
            prefix = f"session:{session_id}:holds:"
            for k in RedisUtils.r.scan_iter(match=prefix + "*", count=500):
                RedisUtils.r.delete(k)
                
    @staticmethod
    def release_hold(hold_payload: dict):
        """
        hold_payload is the JSON payload stored in hold:{hold_id}
        Must include: hotel_id, room_type_id (or name), checkin, checkout, quantity
        This function should call your atomic_increment_inventory_for_range.
        """
        try:
            hotel_id = hold_payload.get("hotel_id")
            room_type_id = hold_payload.get("room_type_id") or hold_payload.get("room_type_uuid") or hold_payload.get("room_type_name")
            checkin = hold_payload.get("checkin")
            checkout = hold_payload.get("checkout")
            qty = int(hold_payload.get("quantity", 1))
            # call your inventory increment function (adapt name)
            RedisUtils.atomic_increment_inventory_for_range(hotel_id, room_type_id, checkin, checkout, qty)
        except Exception:
            pass
    
    # get all holds for session (unified): try legacy list first, else slot keys.
    @staticmethod
    def get_session_holds(session_id: str, total_slots: Optional[int] = None):
        """
        Returns list of hold_ids (strings). Backward compatible:
         - If legacy list exists, return items in list.
         - Else return slot-based holds. If total_slots provided, iterate that many slots; otherwise SCAN.
        """
        # 1) legacy list
        list_key = RedisUtils.session_holds_key(session_id)
        if RedisUtils.r.exists(list_key):
            return RedisUtils.r.lrange(list_key, 0, -1) or []

        # 2) slot-based
        hold_ids = []
        if total_slots is not None:
            for i in range(total_slots):
                hid = RedisUtils.get_hold_for_room(session_id, i)
                if hid:
                    # redis-py returns str when decode_responses=True
                    hold_ids.append(hid)
        else:
            # scan keys: session:{session_id}:holds:*
            prefix = f"session:{session_id}:holds:"
            for k in RedisUtils.r.scan_iter(match=prefix + "*", count=500):
                key = k.decode() if isinstance(k, bytes) else k
                hid = RedisUtils.r.get(key)
                if hid:
                    hold_ids.append(hid)
        return hold_ids
    
    @staticmethod
    def migrate_session_list_to_slots(session_id: str, total_slots: int = 1):
        """
        If legacy list exists, copy items into per-slot keys 0.. and delete legacy list.
        Use when you want to convert old sessions to new per-slot model.
        """
        list_key = RedisUtils.session_holds_key(session_id)
        if not RedisUtils.r.exists(list_key):
            return

        items = RedisUtils.r.lrange(list_key, 0, -1)
        # limit to total_slots
        for i, hid in enumerate(items[:total_slots]):
            hid_s = hid.decode() if isinstance(hid, bytes) else str(hid)
            RedisUtils.set_hold_for_room(session_id, i, hid_s, ttl_seconds=None)
        # delete old list
        RedisUtils.r.delete(list_key)
    
    # @staticmethod
    # def get_session_holds(session_id: str):
    #     return RedisUtils.r.lrange(RedisUtils.session_holds_key(session_id), 0, -1)
    @staticmethod
    def atomic_decrement_inventory_for_range(hotel_id, room_type_id, checkin, checkout, quantity=1):
        """
        Decrement inventory for each date in range atomically. Returns True/False.
        Dates format: YYYY-MM-DD
        """
        dates = []
        start = datetime.fromisoformat(checkin).date()
        end = datetime.fromisoformat(checkout).date()
        cur = start
        while cur < end:
            dates.append(cur.isoformat())
            cur = cur + timedelta(days=1)
        keys = [RedisUtils.inventory_key(hotel_id, room_type_id, d) for d in dates]
        print(keys)
        # If some keys don't exist (no preseed), treat as fail (or init outside).
        # Here atomic script returns 0 on fail, 1 on success
        res = RedisUtils.atomic_multi_decr(keys=keys, args=[str(quantity)])
        return bool(res)
    @staticmethod
    def atomic_increment_inventory_for_range(hotel_id, room_type_id, checkin, checkout, quantity=1):
        dates = []
        start = datetime.fromisoformat(checkin).date()
        end = datetime.fromisoformat(checkout).date()
        cur = start
        while cur < end:
            dates.append(cur.isoformat())
            cur = cur + timedelta(days=1)
        keys = [RedisUtils.inventory_key(hotel_id, room_type_id, d) for d in dates]
        
        RedisUtils.atomic_multi_incr(keys=keys, args=[str(quantity)])
        return True

    # Utility to init inventory from DB if missing for given date (optional)
    @staticmethod
    def ensure_inventory_key_initialized(hotel_id, room_type_id, date_str, default):
        key = RedisUtils.inventory_key(hotel_id, room_type_id, date_str)
        # set only if not exist
        RedisUtils.r.setnx(key, int(default))
        
    @staticmethod  
    def finalize_booking_success(session_id):
        
        from hotel_management_be.models.booking import HoldRecord, BookingSession
        """
        Dọn Redis và cập nhật HoldRecord sau khi thanh toán thành công.
        """
        session_id = str(session_id)
        session = BookingSession.objects.get(uuid=session_id)
        # === 1 Lấy danh sách hold trong Redis (nếu còn) ===
        hold_ids = RedisUtils.get_session_holds(session_id, total_slots=session.requested_rooms)
        if not hold_ids:
            return  # có thể do Redis đã expired

        for hid in hold_ids:
            # Xóa hold key khỏi Redis
            RedisUtils.delete_hold_in_redis(hid)

            # Cập nhật record trong DB nếu tồn tại
            HoldRecord.objects.filter(uuid=hid).update(status="Confirmed")

            # (optional) publish event Kafka
            # try:
            #     publish_kafka_event("room_hold_confirmed", {"hold_id": hid, "booking_id": str(booking.uuid)})
            # except Exception:
            #     pass

        # ===  Xóa session key trong Redis ===
        RedisUtils.r.delete(RedisUtils.session_holds_key(session_id))
        RedisUtils.r.delete(RedisUtils.session_key(session_id))


        # ===  Cập nhật HoldRecord hết hạn (optional) ===
        HoldRecord.objects.filter(session__uuid=session_id, status="Hold").update(status="Confirmed", expires_at=timezone.now())
        
        
    # @staticmethod
    # def get_list_hold_session(session_id:str):
    #     import json
    #     list_hold_id = RedisUtils.r.lrange(RedisUtils.session_holds_key(session_id),0,-1)
    #     holds = []
    #     print(list_hold_id)
    #     for hold in list_hold_id:
    #         hold_id = hold.decode() if isinstance(hold, bytes) else str(hold)
    #         hold_json = RedisUtils.r.get(f'hold:{hold_id}')
    #         print(hold_id, hold_json)
    #         if hold_json:
    #             hold_dict = json.loads(hold_json.decode() if isinstance(hold_json, bytes) else hold_json)
    #             holds.append(hold_dict)
    #     print(holds)
    #     return holds
    
    @staticmethod
    def check_session(session_id):
        key = RedisUtils.session_key(session_id)
        r = RedisUtils.r

        exist = r.exists(key)
        ttl = r.ttl(key)  # thời gian còn lại (giây)

        # Chuẩn hóa TTL
        if ttl == -2:
            ttl = 0  # key không tồn tại
        elif ttl == -1:
            ttl = None  # key tồn tại vô hạn

        return bool(exist), ttl