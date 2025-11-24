import json
import time
from confluent_kafka import Consumer, KafkaException
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
    max_retries = 30
    retry_delay = 2  # seconds
    
    for attempt in range(max_retries):
        try:
            c = Consumer({
                "bootstrap.servers": settings.KAFKA_BOOTSTRAP_SERVERS,
                "group.id": settings.KAFKA_GROUP_ID,
                "auto.offset.reset": "earliest",
                "session.timeout.ms": 10000,
            })
            print("kafka topic", settings.KAFKA_TOPIC)
            c.subscribe([settings.KAFKA_TOPIC])
            print("[Kafka] Listening for booking events...")
            break
        except KafkaException as e:
            error_code = e.args[0].code()
            if error_code == 3:  # UNKNOWN_TOPIC_OR_PARTITION
                if attempt < max_retries - 1:
                    print(f"[Kafka] Topic '{settings.KAFKA_TOPIC}' not available yet. Retrying in {retry_delay}s... (Attempt {attempt + 1}/{max_retries})")
                    time.sleep(retry_delay)
                    continue
                else:
                    print(f"[Kafka Error] Topic '{settings.KAFKA_TOPIC}' not available after {max_retries} attempts. Exiting.")
                    raise
            else:
                print(f"[Kafka Error] {e}")
                raise
        except Exception as e:
            print(f"[Kafka Error] Failed to initialize consumer: {e}")
            if attempt < max_retries - 1:
                print(f"Retrying in {retry_delay}s... (Attempt {attempt + 1}/{max_retries})")
                time.sleep(retry_delay)
            else:
                raise
    
    while True:
        try:
            msg = c.poll(1.0)
            if msg is None:
                continue
            if msg.error():
                error = msg.error()
                if error.code() == 3:  # UNKNOWN_TOPIC_OR_PARTITION
                    print(f"[Kafka Warning] Topic not available yet. Waiting...")
                    time.sleep(retry_delay)
                    continue
                print(f"[Kafka Error] {error}")
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
        except KeyboardInterrupt:
            print("[Kafka] Shutting down consumer...")
            c.close()
            break
        except Exception as e:
            print(f"[Kafka] Unexpected error: {e}")
            time.sleep(retry_delay)
