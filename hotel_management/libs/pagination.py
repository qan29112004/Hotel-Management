from rest_framework.pagination import LimitOffsetPagination

class MyPagination(LimitOffsetPagination):
    default_limit = 2
    max_limit = 100
    
    def get_limit(self, request):
        # Thử lấy từ request.data trước, fallback sang query_params
        if hasattr(request, 'data') and 'limit' in request.data:
            try:
                limit = int(request.data['limit'])
                if limit > 0:
                    return min(limit, self.max_limit)
            except (ValueError, TypeError):
                pass

        # Fallback về query string
        return super().get_limit(request)

    def get_offset(self, request):
        # Thử lấy từ request.data trước, fallback sang query_params
        if hasattr(request, 'data') and 'offset' in request.data:
            try:
                offset = int(request.data['offset'])
                if offset >= 0:
                    return offset
            except (ValueError, TypeError):
                pass

        return super().get_offset(request)

    
    def paginate_queryset(self, queryset, request, scale=1, view=None):
        self.request = request
        self.limit = self.get_limit(request)
        if self.limit is None:
            return None

        self.count = self.get_count(queryset)
        self.offset = self.get_offset(request)
        if self.count > self.limit and self.template is not None:
            self.display_page_controls = True

        if self.count == 0 or self.offset > self.count:
            return []
        return list(queryset[self.offset * scale : self.offset * scale + self.limit * scale])

    def get_paginated_response(self, data):
        return {
            'total':self.count,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'data': data
        }
    def get_paginated_exclude_response(self, data):
        return {
            'exclude_hotel': data
        }
