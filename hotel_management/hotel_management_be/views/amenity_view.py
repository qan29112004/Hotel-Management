import datetime
import json
from constants.hotel_constants import HotelConstants
from utils.swagger_decorators import auto_schema_post, auto_schema_get, auto_schema_patch, auto_schema_delete
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
from hotel_management_be.serializers.amenity_serializer import *
from django.contrib.auth import authenticate
from constants.error_codes import ErrorCodes
from django.contrib.auth.models import update_last_login
from libs.Redis import RedisWrapper
from libs.querykit.querykit_serializer import (
    QuerykitSerializer,
)
from django.db import transaction
from libs.querykit.querykit import Querykit
from utils.utils import Utils

@auto_schema_post(AmenitySerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def add_amenity(request):
    try:
        if(request.data.get('icon')):
            request.data['icon']= Utils.upload_thumnail(request,'icon')
        serializers = AmenitySerializer(data=request.data, context={'request':request})
        if serializers.is_valid():
            new_amenity = serializers.save(created_by = request.user)
            return AppResponse.success(SuccessCodes.CREATE_AMENITY, data={"data":AmenitySerializer(new_amenity).data})
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, str(e))
    
@auto_schema_patch(AmenitySerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(AmenitySerializer)
@permission_classes([IsAdminUser])
@api_view(['PATCH', 'DELETE'])
def amenity_detail(request, uuid):
    try:
        amenity = Amenity.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':
            deleted_thumbnail = Utils.get_path_from_url(request.data.get('deleted_thumbnail'))
            if deleted_thumbnail and deleted_thumbnail == amenity.icon:
                default_storage.delete(deleted_thumbnail.replace('/media/', ''))
                amenity.icon = None
            if 'icon' in request.data:
                icon = Utils.upload_thumnail(request, 'icon')
                request.data['icon'] = icon
            serializer = AmenitySerializer(amenity, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": AmenitySerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            if amenity.icon not in [None, '']:
                default_storage.delete(amenity.icon.replace('/media/', ''))
            amenity.delete()
            return AppResponse.success(SuccessCodes.DELETE_AMENITY)

    except Amenity.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Amenity not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
    
@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_amenity(request):
    try:
        list_amenity = Amenity.objects.all()
        paginated_amenity, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=list_amenity).values()
        serializers = AmenitySerializer(paginated_amenity, many=True)
        return AppResponse.success(SuccessCodes.LIST_AMENITY, data={'data':serializers.data})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_AMENITY_FAIL, str(e))
    
    
