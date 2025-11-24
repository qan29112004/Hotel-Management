from django.urls import path
from chatbot.views.views import *
from chatbot.views.chatbot import *
urlpatterns = [
    path('knowlegde-base/list/', list_knowlegde_base),
    path('knowlegde-base/<str:uuid>/', knowlegde_base_detail),
    path('knowlegde-base/', add_knowlegde_base),
    
    path('chat-bot/', chat_bot_response),
    
    path('get-all-message/', get_all_message),
    
    path('get-requirement-support/', get_requirement_of_user)
]