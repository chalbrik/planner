from typing import Dict, Any
from ..models import WorkHours, Employee
from .conflicts import ConflictAggregator


class ConflictDetectionService:
    """
    Serwis wykrywania konfliktów w harmonogramie.

    Refaktoryzowana wersja - deleguje pracę do ConflictAggregator.
    Single Responsibility: dostarcza interfejs dla ViewSet.
    """

    def __init__(self, location_id: str, month: int, year: int):
        """
        Inicjalizacja serwisu.

        Args:
            location_id: UUID lokacji
            month: Miesiąc (1-12)
            year: Rok (np. 2024)
        """
        self.location_id = location_id
        self.month = month
        self.year = year

    def detect_all_conflicts(self) -> Dict[str, Any]:
        """
        Wykrywa wszystkie konflikty dla harmonogramu lokacji.

        Returns:
            Słownik z konfliktami:
            {
                'rest_11h': [...],           # Lista konfliktów 11h
                'rest_35h': {...},           # Dict z tygodniami
                'exceed_12h': [...]          # Lista przekroczeń 12h
            }
        """
        # Pobierz godziny pracy dla lokacji i miesiąca
        work_hours = WorkHours.objects.filter(
            location_id=self.location_id,
            date__month=self.month,
            date__year=self.year
        ).select_related('employee').order_by('date')

        # Pobierz pracowników na umowie o pracę (tylko UoP podlega tym przepisom)
        employee_ids = work_hours.values_list('employee_id', flat=True).distinct()
        employees = Employee.objects.filter(
            id__in=employee_ids,
            agreement_type='permanent'  # Tylko UoP
        )

        # Deleguj do agregatora
        aggregator = ConflictAggregator(work_hours, employees, self.month, self.year)
        conflicts = aggregator.detect_all_conflicts()

        # Mapuj klucze do formatu oczekiwanego przez frontend
        return {
            'rest_11h': conflicts['rest_11h_conflicts'],
            'rest_35h': conflicts['rest_35h_conflicts'],
            'exceed_12h': conflicts['shift_12h_conflicts']
        }
