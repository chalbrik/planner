"""
ViewSets dla modułu work_hours.
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse

from .models import WorkHours
from .serializers import WorkHoursSerializer
from .services import PDFGeneratorService
from .validators import ScheduleParamsValidator


class WorkHoursViewSet(viewsets.ModelViewSet):
    """ViewSet dla zarządzania grafikami pracy."""

    queryset = WorkHours.objects.all()
    serializer_class = WorkHoursSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrowanie queryset na podstawie parametrów."""
        queryset = super().get_queryset()

        # Filtrowanie po miesiącu i roku
        queryset = self._filter_by_month_year(queryset)

        # Filtrowanie po pracowniku
        queryset = self._filter_by_employee(queryset)

        # Filtrowanie po lokacji
        queryset = self._filter_by_location(queryset)

        return queryset

    def _filter_by_month_year(self, queryset):
        """Filtrowanie po miesiącu i roku."""
        month = self.request.query_params.get('month')
        year = self.request.query_params.get('year')

        if month and year:
            try:
                month = int(month)
                year = int(year)
                queryset = queryset.filter(date__month=month, date__year=year)
            except (ValueError, TypeError):
                pass

        return queryset

    def _filter_by_employee(self, queryset):
        """Filtrowanie po pracowniku."""
        employee_id = self.request.query_params.get('employee_id')
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset

    def _filter_by_location(self, queryset):
        """Filtrowanie po lokacji."""
        location_id = self.request.query_params.get('location')
        if location_id:
            try:
                queryset = queryset.filter(location_id=location_id)
            except (ValueError, TypeError):
                pass
        return queryset

    @action(detail=False, methods=['get'], url_path='generate-schedule-pdf')
    def generate_schedule_pdf(self, request):
        """Generuje PDF z grafikiem dla wybranej lokacji i miesiąca."""
        # Walidacja parametrów
        validator = ScheduleParamsValidator(request.query_params)
        if not validator.is_valid():
            return Response(validator.errors, status=400)

        # Generowanie PDF
        pdf_service = PDFGeneratorService(
            user=request.user,
            location_id=validator.location_id,
            month=validator.month,
            year=validator.year
        )

        try:
            pdf_file, filename = pdf_service.generate_schedule_pdf()
        except ValueError as e:
            return Response({"error": str(e)}, status=404)

        # Zwrócenie odpowiedzi
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response

    @action(detail=False, methods=['get'], url_path='generate-attendance-sheets')
    def generate_attendance_sheets(self, request):
        """Generuje listy obecności dla każdego dnia miesiąca."""
        # Walidacja parametrów
        validator = ScheduleParamsValidator(request.query_params)
        if not validator.is_valid():
            return Response(validator.errors, status=400)

        # Generowanie PDF
        pdf_service = PDFGeneratorService(
            user=request.user,
            location_id=validator.location_id,
            month=validator.month,
            year=validator.year
        )

        try:
            pdf_file, filename = pdf_service.generate_attendance_sheets()
        except ValueError as e:
            return Response({"error": str(e)}, status=404)

        # Zwrócenie odpowiedzi
        response = HttpResponse(pdf_file, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response