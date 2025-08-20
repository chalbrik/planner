from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .models import Employee, VacationLeave
from .serializers import EmployeeSerializer, VacationLeaveSerializer, EmployeeCreateSerializer, EmployeeDetailSerializer


class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all()
    permission_classes = [IsAuthenticated]

    def get_serializer_class(self):
        if self.action == 'create':
            return EmployeeCreateSerializer
        elif self.action == 'retrive':
            return EmployeeDetailSerializer
        return EmployeeSerializer

class VacationLeaveViewSet(viewsets.ModelViewSet):
    queryset = VacationLeave.objects.all()
    serializer_class = VacationLeaveSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrowanie po pracowniku
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        return queryset