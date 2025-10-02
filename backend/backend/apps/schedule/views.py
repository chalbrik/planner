from django.shortcuts import render
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.decorators import action
from django.http import HttpResponse
from datetime import datetime
from .models import WorkHours
from .serializers import WorkHoursSerializer
from weasyprint import HTML


class WorkHoursViewSet(viewsets.ModelViewSet):
    queryset = WorkHours.objects.all()
    serializer_class = WorkHoursSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()

        # Filtrowanie po miesiącu i roku
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')

        if month and year:
            try:
                month = int(month)
                year = int(year)
                queryset = queryset.filter(date__month=month, date__year=year)
            except (ValueError, TypeError):
                pass

        # Filtrowanie po pracowniku
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)

        # Filtrowanie po lokacji
        location_id = self.request.query_params.get('location')
        if location_id:
            try:
                queryset = queryset.filter(location_id=location_id)
            except (ValueError, TypeError):
                pass

        return queryset

    @action(detail=False, methods=['get'], url_path='generate-schedule-pdf')
    def generate_schedule_pdf(self, request):
        """Generuje PDF z grafikiem dla wybranej lokacji i miesiąca"""

        # Pobierz parametry z URL
        location_id = request.query_params.get('location')
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        # Walidacja
        if not all([location_id, month, year]):
            return Response(
                {"error": "Brakuje parametrów: location, month, year"},
                status=400
            )

        try:
            month = int(month)
            year = int(year)
        except ValueError:
            return Response(
                {"error": "Nieprawidłowy format parametrów"},
                status=400
            )

        # === NOWE: Pobieranie danych z bazy ===

        # 1. Import modelu Employee
        from backend.apps.employees.models import Employee

        # 2. Pobierz pracowników z danej lokacji
        employees = Employee.objects.filter(
            locations__id=location_id,
            user=request.user  # Tylko pracownicy zalogowanego użytkownika
        ).distinct()

        # 3. Podziel na UoP i zlecenia
        permanent_employees = employees.filter(agreement_type='permanent')
        contract_employees = employees.filter(agreement_type='contract')

        # 4. Pobierz WorkHours dla danego miesiąca i lokacji
        work_hours = WorkHours.objects.filter(
            location_id=location_id,
            date__month=month,
            date__year=year
        )

        # 5. Testowa odpowiedź - sprawdzamy co pobraliśmy
        return Response({
            "message": "Dane pobrane!",
            "location_id": location_id,
            "month": month,
            "year": year,
            "permanent_count": permanent_employees.count(),
            "contract_count": contract_employees.count(),
            "work_hours_count": work_hours.count()
        })