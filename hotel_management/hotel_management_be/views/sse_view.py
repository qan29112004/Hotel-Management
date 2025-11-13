from hotel_management_be.celery_hotel.task import monitor_session_task
import json
from django.http import StreamingHttpResponse
from libs.Redis import RedisUtils
from utils.swagger_decorators import auto_schema_post, auto_schema_get, auto_schema_delete, auto_schema_patch
from django.views.decorators.http import require_GET
from libs.Redis import RedisUtils

def event_stream(session_id):
    exists, ttl = RedisUtils.check_session(session_id)
    if not exists and ttl == 0:
        yield f"data: {json.dumps({'exist': exists, 'ttl': ttl})}\n\n"
    else:
        pubsub = RedisUtils.r.pubsub()
        pubsub.subscribe('session_status_channel')

        for message in pubsub.listen():
            if message['type'] == 'message':
                data = json.loads(message['data'])
                if data.get("session_id") == session_id:
                    yield f"data: {json.dumps(data)}\n\n"
@require_GET
def sse_view(request, session_id):
    response = StreamingHttpResponse(event_stream(session_id), content_type='text/event-stream')
    response['Cache-Control'] = 'no-cache'
    return response