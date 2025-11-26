from django.urls import re_path
from hotel_management_be.views.sse_consumer import SSEConsumer

# HTTP routing cho SSE endpoints
http_urlpatterns = [
    re_path(r'^api/sse/session/(?P<session_id>[^/]+)/$', SSEConsumer.as_asgi()),
]

