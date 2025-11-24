from hotel_management_be.celery_hotel.task import monitor_session_task
import json
import time
from django.http import StreamingHttpResponse
from libs.Redis import RedisUtils
from utils.swagger_decorators import auto_schema_post, auto_schema_get, auto_schema_delete, auto_schema_patch
from django.views.decorators.http import require_GET
from libs.Redis import RedisUtils

def event_stream(session_id):
    exists, ttl = RedisUtils.check_session(session_id)
    if not exists and ttl == 0:
        yield f"data: {json.dumps({'exist': exists, 'ttl': ttl})}\n\n"
        return

    pubsub = RedisUtils.r.pubsub()
    pubsub.subscribe('session_status_channel')

    last_heartbeat = time.time()

    for message in pubsub.listen():
        # Có message thật từ Redis
        if message['type'] == 'message':
            data = json.loads(message['data'])
            if data.get("session_id") == session_id:
                yield f"data: {json.dumps(data)}\n\n"
                last_heartbeat = time.time()

        # Heartbeat mỗi 10 giây
        if time.time() - last_heartbeat > 10:
            yield 'data: {"ping": true}\n\n'
            last_heartbeat = time.time()
@require_GET
def sse_view(request, session_id):
    response = StreamingHttpResponse(event_stream(session_id), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response