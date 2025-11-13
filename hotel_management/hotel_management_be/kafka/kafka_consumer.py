import json
from confluent_kafka import Consumer
from django.conf import settings
from hotel_management_be.models.booking import HoldRecord
from libs.Redis import RedisUtils

def handle_room_hold_created(event):
    payload = event["payload"]
    print(f"[Kafka] 🟢 New hold created: {payload['hold_id']}")
    # Có thể log analytic hoặc realtime tới dashboard
    # ví dụ RedisUtils.notify_ui("new_hold", payload)

def handle_room_hold_released(event):
    payload = event["payload"]
    hold_id = payload["hold_id"]
    print(f"[Kafka] 🟠 Hold released: {hold_id}")

    # DB update
    hr = HoldRecord.objects.filter(uuid=hold_id).first()
    if hr and hr.status != "Expired":
        hr.status = "Expired"
        hr.save(update_fields=["status"])

    # Xoá Redis nếu còn
    RedisUtils.delete_hold_in_redis(hold_id)

def consume_booking_events():
    c = Consumer({
        "bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS,
        "group.id": settings.KAFKA_GROUP_ID,
        "auto.offset.reset": "earliest"
    })
    c.subscribe([settings.KAFKA_TOPIC])
    print("[Kafka] Listening for booking events...")

    while True:
        msg = c.poll(1.0)
        if msg is None:
            continue
        if msg.error():
            print(f"[Kafka Error] {msg.error()}")
            continue

        try:
            event = json.loads(msg.value().decode("utf-8"))
            event_name = event.get("event")

            if event_name == "room_hold_created":
                handle_room_hold_created(event)
            elif event_name == "room_hold_released":
                handle_room_hold_released(event)
        except Exception as e:
            print(f"[Kafka] Failed to process message: {e}")
