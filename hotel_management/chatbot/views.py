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
from chatbot.serializer import *
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
from .tasks import embed_pending_data

@auto_schema_post(KnowlegdeBaseSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def add_knowlegde_base(request):
    try:
        
        serializers = KnowlegdeBaseSerializer(data=request.data, context={'request':request})
        if serializers.is_valid():
            new_knowlegde_base = serializers.save(created_by = request.user)
            embed_pending_data.delay()
            return AppResponse.success(SuccessCodes.CREATE_AMENITY, data={"data":KnowlegdeBaseSerializer(new_knowlegde_base).data})
        return AppResponse.error(ErrorCodes.CREATE_DATASET, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_DATASET_FAIL, str(e))
    
@auto_schema_patch(KnowlegdeBaseSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(KnowlegdeBaseSerializer)
@permission_classes([IsAdminUser])
@api_view(['PATCH', 'DELETE'])
def knowlegde_base_detail(request, uuid):
    try:
        knowlegde_base = KnowlegdeBaseModel.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':
            
            serializer = KnowlegdeBaseSerializer(knowlegde_base, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                    embed_pending_data.delay()
                return AppResponse.success(SuccessCodes.UPDATE_DATASET, data={"data": KnowlegdeBaseSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_DATASET_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            knowlegde_base.delete()
            embed_pending_data.delay()
            return AppResponse.success(SuccessCodes.DELETE_DATASET)

    except KnowlegdeBaseModel.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "KnowlegdeBaseModel not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
    
@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_knowlegde_base(request):
    try:
        list_knowlegde_base = KnowlegdeBaseModel.objects.all()
        paginated_knowlegde_base, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=list_knowlegde_base).values()
        serializers = KnowlegdeBaseSerializer(paginated_knowlegde_base, many=True)
        return AppResponse.success(SuccessCodes.LIST_DATASET, data={'data':serializers.data})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_DATASET_FAIL, str(e))
    
    