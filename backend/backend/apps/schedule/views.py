"""
ViewSets dla modułu work_hours.
"""
import logging
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse

from django.core.exceptions import ValidationError

from .models import WorkHours
from .serializers import WorkHoursSerializer
from .services.conflict_detection_service import ConflictDetectionService
from .services.pdf_service import PDFGeneratorService

from .validators import ScheduleParamsValidator

logger = logging.getLogger(__name__)

class WorkHoursViewSet(viewsets.ModelViewSet):
    """ViewSet dla zarządzania grafikami pracy."""

    queryset = WorkHours.objects.all()
    serializer_class = WorkHoursSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Filtrowanie queryset na podstawie parametrów."""
        queryset = super().get_queryset()

        # ✅ OPTYMALIZACJA: select_related w metodzie, nie w atrybucie klasy!
        queryset = queryset.select_related('employee', 'location')

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

    def list(self, request, *args, **kwargs):
        """
        GET /api/work-hours/?location=xxx&month=11&year=2025
        Zwraca work_hours + konflikty
        """
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)

        # Pobierz parametry do obliczenia konfliktów
        location_id = request.query_params.get('location')
        month = request.query_params.get('month')
        year = request.query_params.get('year')

        # Oblicz konflikty jeśli są wymagane parametry
        conflicts = None
        if location_id and month and year:
            try:
                conflict_service = ConflictDetectionService(
                    location_id=location_id,
                    month=int(month),
                    year=int(year)
                )
                conflicts = conflict_service.detect_all_conflicts()
            except (ValueError, TypeError) as e:
                logger.error(f"Błędne parametry przy obliczaniu konfliktów: {e}", exc_info=True)
                conflicts = {
                    'rest_11h': [],
                    'rest_35h': {},
                    'exceed_12h': []
                }
            except ValidationError as e:
                logger.error(f"Błąd walidacji przy obliczaniu konfliktów: {e}", exc_info=True)
                conflicts = {
                    'rest_11h': [],
                    'rest_35h': {},
                    'exceed_12h': []
                }

        return Response({
            'work_hours': serializer.data,
            'conflicts': conflicts
        })

    def create(self, request, *args, **kwargs):
        """
        POST /api/work-hours/
        Zapisuje work_hours i zwraca je + konflikty
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        self.perform_create(serializer)

        # Pobierz zapisany obiekt
        instance = serializer.instance

        # Oblicz konflikty dla tej lokacji i miesiąca
        conflicts = self._calculate_conflicts_for_instance(instance)

        headers = self.get_success_headers(serializer.data)
        return Response({
            **serializer.data,
            'conflicts': conflicts
        }, status=status.HTTP_201_CREATED, headers=headers)

    def update(self, request, *args, **kwargs):
        """
        PATCH/PUT /api/work-hours/{id}/
        Aktualizuje work_hours i zwraca konflikty
        """
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)

        # Oblicz konflikty dla zaktualizowanego obiektu
        conflicts = self._calculate_conflicts_for_instance(serializer.instance)

        return Response({
            **serializer.data,
            'conflicts': conflicts
        })

    def destroy(self, request, *args, **kwargs):
        """
        DELETE /api/work-hours/{id}/
        Usuwa work_hours i zwraca konflikty dla pozostałych
        """
        instance = self.get_object()

        # Zapisz dane przed usunięciem (potrzebne do obliczenia konfliktów)
        location_id = str(instance.location_id)
        month = instance.date.month
        year = instance.date.year

        # Usuń obiekt
        self.perform_destroy(instance)

        # Oblicz konflikty po usunięciu
        try:
            conflict_service = ConflictDetectionService(
                location_id=location_id,
                month=month,
                year=year
            )
            conflicts = conflict_service.detect_all_conflicts()
        except (ValueError, TypeError) as e:
            logger.error(f"Błędne parametry przy obliczaniu konfliktów po usunięciu: {e}", exc_info=True)
            conflicts = {
                'rest_11h': [],
                'rest_35h': {},
                'exceed_12h': []
            }
        except ValidationError as e:
            logger.error(f"Błąd walidacji przy obliczaniu konfliktów po usunięciu: {e}", exc_info=True)
            conflicts = {
                'rest_11h': [],
                'rest_35h': {},
                'exceed_12h': []
            }

        return Response({
            'deleted': True,
            'conflicts': conflicts
        }, status=status.HTTP_200_OK)

    def _calculate_conflicts_for_instance(self, instance):
        """
        Pomocnicza metoda do obliczania konfliktów dla danego WorkHours.

        Args:
            instance: Instancja WorkHours

        Returns:
            Dict z konfliktami
        """
        try:
            conflict_service = ConflictDetectionService(
                location_id=str(instance.location_id),
                month=instance.date.month,
                year=instance.date.year
            )
            return conflict_service.detect_all_conflicts()
        except (ValueError, TypeError) as e:
            logger.error(f"Błędne parametry przy obliczaniu konfliktów dla instancji {instance.id}: {e}", exc_info=True)
            return {
                'rest_11h': [],
                'rest_35h': {},
                'exceed_12h': []
            }
        except ValidationError as e:
            logger.error(f"Błąd walidacji przy obliczaniu konfliktów dla instancji {instance.id}: {e}", exc_info=True)
            return {
                'rest_11h': [],
                'rest_35h': {},
                'exceed_12h': []
            }

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
