"""
ASGI config for hotel_management project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.2/howto/deployment/asgi/
"""

import os
import environ

from django.core.asgi import get_asgi_application
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from pathlib import Path
from chatbot.routing import websocket_urlpatterns
from chatbot.middleware.jwt_middleware import JWTAuthMidderwareSocket

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hotel_management.settings')

application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": JWTAuthMidderwareSocket(
        AuthMiddlewareStack(
            URLRouter(
                websocket_urlpatterns
            )
        )
    ),
})
