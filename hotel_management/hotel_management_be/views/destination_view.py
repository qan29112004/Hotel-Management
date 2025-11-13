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
from hotel_management_be.models.hotel import Destination
from rest_framework.decorators import api_view
from constants.success_codes import SuccessCodes
from configuration.jwt_config import JwtConfig
from hotel_management_be.serializers.destination_serializer import *
from django.contrib.auth import authenticate
from constants.error_codes import ErrorCodes
from django.contrib.auth.models import update_last_login
from libs.Redis import RedisWrapper
from libs.querykit.querykit_serializer import (
    QuerykitSerializer,
)
from django.db import transaction
from libs.querykit.querykit import Querykit
from validators.validator import Validator
from utils.utils import Utils


@api_view(['POST'])
@permission_classes([IsAdminUser])
def add_destination(request):
    try:
        name = request.data.get('name', None)
        if request.data.get('thumbnail'):
            request.data['thumbnail'] = Utils.upload_thumnail(request, 'thumbnail')
            
        try:
            Validator.validate_name_destination(name)
        except Exception as e:
            return AppResponse.error(ErrorCodes.VALIDATION_ERROR, str(e))
        serializers = DestinationSerializer(data=request.data, context={'request':request})
        if serializers.is_valid():
            new_destination = serializers.save(created_by = request.user)
            return AppResponse.success(SuccessCodes.CREATE_DESTINATION, data={"data":DestinationSerializer(new_destination).data})
        return AppResponse.error(ErrorCodes.CREATE_DESTINATION_FAIL, serializers.errors)
    except Exception as e:
        return AppResponse.error(ErrorCodes.CREATE_DESTINATION_FAIL, str(e))
    
@api_view(['PATCH', 'DELETE'])
@permission_classes([IsAdminUser])
def destination_detail(request, uuid):
    try:
        destination = Destination.objects.get(uuid__icontains=uuid)

        if request.method == 'PATCH':
            name = request.data.get('name', None)
            description = request.data.get('description', None)
            try:
                Validator.validate_name_destination(name)
            except Exception as e:
                return AppResponse.error(ErrorCodes.VALIDATION_ERROR, str(e))
            
            deleted_thumbnail = Utils.get_path_from_url(request.data.get('deleted_thumbnail'))
            if deleted_thumbnail and deleted_thumbnail == destination.thumbnail:
                default_storage.delete(deleted_thumbnail.replace('/media/', ''))
                destination.thumbnail = None
            if 'thumbnail' in request.data:
                thumbnail = Utils.upload_thumnail(request, 'thumbnail')
                print("thumnail", thumbnail)
                request.data['thumbnail'] = thumbnail
           
            serializer = DestinationSerializer(destination, data=request.data, partial=True)
            if serializer.is_valid():
                with transaction.atomic():
                    updated = serializer.save(updated_by=request.user)
                return AppResponse.success(SuccessCodes.UPDATE_DESTINATION, data={"data": DestinationSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_DESTINATION_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            if destination.thumbnail not in [None, '']:
                print("delete thumbnail", destination.thumbnail)
                default_storage.delete(destination.thumbnail.replace('/media/', ''))
            destination.delete()
            return AppResponse.success(SuccessCodes.DELETE_DESTINATION)

    except destination.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "destination not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
    

@auto_schema_post(QuerykitSerializer)
@api_view(['POST'])
def list_destination(request):
    try:
        list_destination = Destination.objects.all()
        paginated_destination, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=list_destination).values()
        serializers = DestinationSerializer(paginated_destination, many=True)
        return AppResponse.success(SuccessCodes.LIST_DESTINATION, data={'data':serializers.data, 'total':total})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_DESTINATION_FAIL, str(e))
    

    
    
@api_view(["GET"])
def destination_paticular(request, slug):
    try:
        destination = Destination.objects.get(slug__icontains = slug)
        serializers = DestinationDetailSerializer(instance = destination)
        return AppResponse.success(SuccessCodes.LIST_DESTINATION, data = {'data':serializers.data})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_DESTINATION_FAIL, str(e))