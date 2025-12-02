from .models import Location
from .serializers import LocationSerializer
from ...common.viewsets import BaseUserOwnedViewSet


class LocationViewSet(BaseUserOwnedViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer