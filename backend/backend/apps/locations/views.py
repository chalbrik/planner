from django.db.models import Exists, OuterRef
from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated

from .models import Location
from .serializers import LocationSerializer
from ..schedule.models import WorkHours


class LocationViewSet(viewsets.ModelViewSet):
    queryset = Location.objects.all()  # Bazowy queryset dla DRF Router
    serializer_class = LocationSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Zwraca tylko lokacje należące do zalogowanego użytkownika"""
        return Location.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        """Automatycznie przypisuje zalogowanego użytkownika przy tworzeniu lokacji"""
        serializer.save(user=self.request.user)