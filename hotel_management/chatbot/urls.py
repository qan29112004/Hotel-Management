from django.urls import path
from chatbot.views import *
urlpatterns = [
    path('knowlegde-base/list/', list_knowlegde_base),
    path('knowlegde-base/<str:uuid>/', knowlegde_base_detail),
    path('knowlegde-base/', add_knowlegde_base),
]