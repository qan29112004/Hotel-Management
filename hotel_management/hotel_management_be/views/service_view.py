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
from hotel_management_be.serializers.service_serializer import *
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

@auto_schema_post(ServiceSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def add_service(request):
    try:
        if(request.data.get('image')):
            request.data['image']= Utils.upload_thumnail(request,'image')
        serializers = ServiceSerializer(data=request.data, context={'request':request})
        if serializers.is_valid():
            new_service = serializers.save(created_by = request.user)
            return AppResponse.success(SuccessCodes.CREATE_AMENITY, data={"data":ServiceSerializer(new_service).data})
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, str(e))
    
@auto_schema_patch(ServiceSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(ServiceSerializer)
@permission_classes([IsAdminUser])
@api_view(['PATCH', 'DELETE'])
def service_detail(request, uuid):
    try:
        service = Service.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':
            deleted_thumbnail = Utils.get_path_from_url(request.data.get('deleted_thumbnail'))
            if deleted_thumbnail and deleted_thumbnail == service.image:
                default_storage.delete(deleted_thumbnail.replace('/media/', ''))
                service.image = None
            if 'image' in request.data:
                image = Utils.upload_thumnail(request, 'image')
                request.data['image'] = image
            serializer = ServiceSerializer(service, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": ServiceSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            if service.image not in [None, '']:
                default_storage.delete(service.image.replace('/media/', ''))
            service.delete()
            return AppResponse.success(SuccessCodes.DELETE_AMENITY)

    except Service.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Service not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
    
@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_service(request):
    try:
        list_service = Service.objects.all()
        paginated_service, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=list_service).values()
        serializers = ServiceSerializer(paginated_service, many=True)
        return AppResponse.success(SuccessCodes.LIST_AMENITY, data={'data':serializers.data, 'total':total})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_AMENITY_FAIL, str(e))
    
    