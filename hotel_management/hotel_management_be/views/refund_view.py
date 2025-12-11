from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAdminUser
from hotel_management_be.models.booking import Refund
from hotel_management_be.serializers.refund_serializer import RefundSerializer
from libs.response_handle import AppResponse
from constants.success_codes import SuccessCodes
from constants.error_codes import ErrorCodes
from libs.querykit.querykit import Querykit
from libs.querykit.querykit_serializer import QuerykitSerializer
from utils.swagger_decorators import auto_schema_post, auto_schema_delete, auto_schema_patch

@auto_schema_post(QuerykitSerializer)
@permission_classes([IsAdminUser])
@api_view(['POST'])
def list_refund(request):
    try:
        refunds = Refund.objects.all()
        paginated_refunds, total = Querykit.apply_filter_paginate_search_sort(request=request, queryset=refunds).values()
        serializers = RefundSerializer(paginated_refunds, many=True)
        return AppResponse.success(SuccessCodes.LIST_AMENITY, data={'data':serializers.data, 'total':total})
    except Exception as e:
        return AppResponse.error(ErrorCodes.LIST_AMENITY_FAIL, str(e))

@auto_schema_patch(RefundSerializer)
@permission_classes([IsAdminUser])
@auto_schema_delete(RefundSerializer)
@api_view(['PATCH', 'DELETE'])
def refund_detail(request, uuid):
    try:
        refund = Refund.objects.get(uuid=uuid)

        if request.method == 'PATCH':
            serializer = RefundSerializer(refund, data=request.data, partial=True)
            if serializer.is_valid():
                updated = serializer.save()
                return AppResponse.success(SuccessCodes.UPDATE_AMENITY, data={"data": RefundSerializer(updated).data})
            return AppResponse.error(ErrorCodes.UPDATE_AMENITY_FAIL, serializer.errors)

        elif request.method == 'DELETE':
            refund.delete()
            return AppResponse.success(SuccessCodes.DELETE_AMENITY)

    except Refund.DoesNotExist:
        return AppResponse.error(ErrorCodes.NOT_FOUND, "Refund not found")
    except Exception as e:
        return AppResponse.error(ErrorCodes.UNKNOWN_ERROR, str(e))
