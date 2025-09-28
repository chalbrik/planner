from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Employee, VacationLeave
from .serializers import EmployeeSerializer, VacationLeaveSerializer, EmployeeCreateSerializer, EmployeeDetailSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()  # Bazowy queryset dla DRF Router
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Zwraca tylko pracowników należących do zalogowanego użytkownika"""
        # Filtruj po właścicielu
        queryset = Employee.objects.filter(user=self.request.user)

        # Filtruj tylko pracowników z przypisanymi lokacjami
        queryset = queryset.filter(locations__isnull=False).distinct()

        # Dodatkowe filtrowanie po konkretnej lokacji (opcjonalne)
        location_id = self.request.query_params.get('location')
        if location_id:
            queryset = queryset.filter(locations=location_id)

        return queryset

    def get_serializer_context(self):
        """Dodaj user do kontekstu serializatora"""
        context = super().get_serializer_context()
        context['user'] = self.request.user
        return context

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        elif self.action == 'retrieve':
            return EmployeeDetailSerializer
        return EmployeeSerializer


class VacationLeaveViewSet(viewsets.ModelViewSet):
    queryset = VacationLeave.objects.all()
    serializer_class = VacationLeaveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Zwraca tylko urlopy pracowników należących do zalogowanego użytkownika"""
        queryset = VacationLeave.objects.filter(employee__user=self.request.user)

        # Filtrowanie po pracowniku
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        return queryset