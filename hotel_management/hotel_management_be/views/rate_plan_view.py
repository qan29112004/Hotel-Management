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
from hotel_management_be.serializers.rate_plan_serializer import *
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

@auto_schema_post(RatePlanSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def add_rate_plan(request):
    try:
        
        serializers = RatePlanCreateSerializer(data=request.data, context={'request':request})
        if serializers.is_valid():
            new_rate_plan = serializers.save(created_by = request.user)
            return AppResponse.success(SuccessCodes.CREATE_AMENITY, data={"data":RatePlanSerializer(new_rate_plan).data})
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_AMENITY_FAIL, str(e))
    
@auto_schema_patch(RatePlanSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(RatePlanSerializer)
@permission_classes([IsAdminUser])
@api_view(['PATCH', 'DELETE'])
def rate_plan_detail(request, uuid):
    try:
        rate_plan = RatePlan.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':
            
            serializer = RatePlanCreateSerializer(rate_plan, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": RatePlanSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            rate_plan.delete()
            return AppResponse.success(SuccessCodes.DELETE_AMENITY)

    except RatePlan.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "RatePlan not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    
    
@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_rate_plan(request):
    try:
        list_rate_plan = RatePlan.objects.all()
        paginated_rate_plan, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=list_rate_plan).values()
        serializers = RatePlanSerializer(paginated_rate_plan, many=True)
        return AppResponse.success(SuccessCodes.LIST_AMENITY, data={'data':serializers.data, 'total':total})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_AMENITY_FAIL, str(e))
    
    