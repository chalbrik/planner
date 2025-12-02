from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Employee, VacationLeave
from .serializers import EmployeeSerializer, VacationLeaveSerializer, EmployeeCreateSerializer, EmployeeDetailSerializer
from ...common.mixins import QueryOptimizationMixin
from ...common.permissions import IsEmployeeOwner
from ...common.viewsets import BaseUserOwnedViewSet


class EmployeeViewSet(QueryOptimizationMixin, BaseUserOwnedViewSet):
    queryset = Employee.objects.all()
    serializer_class = EmployeeSerializer

    select_related_fields = ['user']
    prefetch_related_fields = ['locations', 'vacation_leaves', 'school', 'previous_employers']

    def get_queryset(self):
        """Dodatkowe filtrowanie (oprócz user)"""
        queryset = super().get_queryset()

        # Filtruj tylko z lokacjami
        queryset = queryset.filter(locations__isnull=False).distinct()

        # Filtruj po konkretnej lokacji
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


class VacationLeaveViewSet(QueryOptimizationMixin, viewsets.ModelViewSet):
    queryset = VacationLeave.objects.all()
    serializer_class = VacationLeaveSerializer
    permission_classes = [IsAuthenticated, IsEmployeeOwner]

    select_related_fields = ['employee', 'employee__user']

    def get_queryset(self):
        queryset = super().get_queryset()
        queryset = queryset.filter(employee__user=self.request.user)

        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        return queryset