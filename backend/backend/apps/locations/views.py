from django.db.models import Exists, OuterRef
from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Location
from .serializers import LocationSerializer
from ..schedule.models import WorkHours


# Create your views here.

class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()
    serializer_class = LocationSerializer

    def get_queryset(self):
        # Zwróć tylko lokacje które mają przypisane godziny pracy
        return Location.objects.filter(
            Exists(WorkHours.objects.filter(location=OuterRef('pk')))
        ).distinct()

