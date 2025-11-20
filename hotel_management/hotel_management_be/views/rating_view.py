import datetime
import json
from constants.hotel_constants import HotelConstants
from hotel_management_be.serializers.amenity_serializer import AmenitySerializer
from utils.swagger_decorators import auto_schema_post, auto_schema_get, auto_schema_delete, auto_schema_patch
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny,IsAuthenticated, IsAdminUser
from libs.response_handle import AppResponse
from hotel_management_be.models.user import User
from rest_framework.decorators import api_view
from constants.success_codes import SuccessCodes
from configuration.jwt_config import JwtConfig
from hotel_management_be.serializers.hotel_serializer import *
from hotel_management_be.serializers.rating_serializer import *
from django.contrib.auth import authenticate
from constants.error_codes import ErrorCodes
from django.contrib.auth.models import update_last_login
from libs.Redis import RedisUtils, RedisWrapper
from libs.querykit.querykit import Querykit
from libs.querykit.querykit_serializer import (
    QuerykitSerializer,
)
from django.db.models.functions import Cast
from django.db.models import *
from django.db import transaction
from utils.utils import Utils
from libs.pagination import MyPagination

@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_rating(request):
    try:
        rating = ReviewRating.objects.all()
        paginated_rating, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=rating).values()
        serializer = RatingSerializer(paginated_rating,many=True)
        return AppResponse.success(SuccessCodes.LIST_ROOM_TYPE, data={'data':serializer.data, 'total':total})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_ROOM_TYPE_FAIL, str(e))
    
    
@auto_schema_patch(RatingCreateSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(RatingCreateSerializer)
@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def rating_detail(request, uuid):
    try:
        rating = ReviewRating.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':

            # Xử lý xóa images
            deleted_images = request.data.getlist('deleted_images[]')
            if deleted_images:
                for path in deleted_images:
                    path = Utils.get_path_from_url(path)
                    ReviewImages.objects.filter(review=rating, images__icontains=path).delete()
                    default_storage.delete(path.replace('/media/', ''))
            serializer = RatingCreateSerializer(rating, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": RatingCreateSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            rating_images = ReviewImages.objects.filter(review=rating)
            for img in rating_images:
                if img.images:
                    try:
                        print("delete image", img.images)
                        default_storage.delete(img.images.replace('/media/', ''))
                    except Exception as e:
                        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
            rating.delete()
            return AppResponse.success(SuccessCodes.DELETE_AMENITY)

    except ReviewRating.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Amenity not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
@auto_schema_post(RatingCreateSerializer)
@api_view(["POST"])
@permission_classes([IsAdminUser])
def add_rating(request):
    try:
        serializers = RatingCreateSerializer(data=request.data)
        if serializers.is_valid():
            new_rating = serializers.save(created_by=request.user)
            return AppResponse.success(SuccessCodes.CREATE_ROOM_TYPE, data={"data": RatingCreateSerializer(new_rating).data})
        return AppResponse.error(ErrorCodes.CREATE_ROOM_TYPE_FAIL, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_ROOM_TYPE_FAIL, str(e))
    