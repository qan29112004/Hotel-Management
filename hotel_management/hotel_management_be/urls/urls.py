from django.urls import path
from hotel_management_be.views.auth_view import *
from hotel_management_be.views.user_view import *
from hotel_management_be.views.hotel_view import *
from hotel_management_be.views.room_type_view import *
from hotel_management_be.views.amenity_view import *
from hotel_management_be.views.destination_view import *
from hotel_management_be.views.calendar_price import *
from hotel_management_be.views.booking_view import *
from hotel_management_be.views.booking_room_view import *
from hotel_management_be.views.rate_plan_view import *
from hotel_management_be.views.offfer_view import *
from hotel_management_be.views.price_rule_view import *
from hotel_management_be.views.payment_view import *
from hotel_management_be.views.sse_view import *
from hotel_management_be.views.service_view import *


urlpatterns = [
    path('login/', login, name='login'),
    path('register/', register, name='register'),
    path('logout/',logout,name="logout"),
    path('refresh/', refresh_token,name="refresh_token"),
    path('infor/', current_user_infor,name="user_infor"),
    path('all/', list_user, name="list_user"),
    path('auth/google/', google_auth, name='google-auth'),
    path("update/", update_profile),
    path("upload-avatar/", upload_avatar),
    path("all/", list_user),
    path("users/", get_all_user),
    path("register/user/", register_user),
    path("update/user/<int:id>/", update_user_profile),
    path("delete/user/<int:id>/", delete_user),

    path('hotel/list/', list_hotel, name='list_hotel'),
    path('hotel/<str:uuid>/', hotel_detail, name='hotel_detail'),
    path('hotel/', add_hotel, name='add_hotel'),
    
    path('room_type/list/', list_room_type, name="list_room_type" ),
    path('room_type/<str:uuid>/', room_type_detail, name="add_room_type"),
    path('room_type/', add_room_type, name="add_room_type"),
    
    path('room/list/', list_room, name="list_room"),
    path('room/<str:uuid>/', room_detail, name="add_room_type"),
    path('room/', add_room, name="add_room"),

    path('amenity/list/', list_amenity, name='list_amenity'),
    path('amenity/<str:uuid>/', amenity_detail, name="update_amenity"),
    path('amenity/', add_amenity, name="add_amenity"),
    
    path('destination/list/', list_destination, name='list_destination'),
    path('destination/<str:uuid>/', destination_detail, name="update_destination"),
    path('destination/', add_destination, name="add_destination"),
    path('destination/detail/<str:slug>/', destination_paticular , name="destination_paticular"),
    
    path('calendar-price/', get_calendar_prices, name='calendar_price'),
    
    path('booking/list/', list_booking),
    path('booking/create-booking-session/', create_booking_session),
    path('booking/check-session/', check_session),
    path('booking/create-hold/', create_hold),
    path('booking/confirm_booking/', confirm_booking),
    path('booking/get-list-hold-room/',get_list_hold_room),
    path('booking/<str:uuid>/', booking_detail),
    path('booking/', add_booking),
    
    
    
    path('explore-hotels/', explore_hotels),
    
    path('booking-room/list/', list_BookingRoom),
    path('booking-room/<str:uuid>/', BookingRoom_detail),
    path('booking-room/', add_BookingRoom),
    
    path('rate-plan/list/', list_rate_plan),
    path('rate-plan/<str:uuid>/', rate_plan_detail),
    path('rate-plan/', add_rate_plan),
    
    path('offer/list/', list_offer),
    path('offer/<str:uuid>/', offer_detail),
    path('offer/', add_offer),
    
    path('service/list/', list_service),
    path('service/<str:uuid>/', service_detail),
    path('service/', add_service),
    
    path('price-rule/list/', list_price_rule),
    path('price-rule/<str:uuid>/', price_rule_detail),
    path('price-rule/', add_price_rule),
    
    path('price-per-day/',cal_price_per_night ),
    
    
    path('payment_ipn/', payment_ipn),
    path("payment/create-payment/", create_payment, name="create_payment"),
    path("payment/paypal-capture/", paypal_capture, name="paypal_capture"),
    # path("paypal/capture/", paypal_capture),
    
    
    path('sse/session/<str:session_id>/',sse_view)
]
