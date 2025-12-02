"""
Base class for conflict validators.
"""
from abc import ABC, abstractmethod
from typing import List, Set, Dict, Any
from ...models import WorkHours
from ....employees.models import Employee


class BaseConflictValidator(ABC):
    """
    Abstrakcyjna klasa bazowa dla walidatorów konfliktów.

    Każdy walidator musi implementować metodę validate().
    """

    def __init__(
            self,
            work_hours: List[WorkHours],
            employees: List[Employee],
            month: int,
            year: int
    ):
        """
        Args:
            work_hours: Lista WorkHours do walidacji
            employees: Lista pracowników (tylko UoP)
            month: Miesiąc (1-12)
            year: Rok
        """
        self.work_hours = work_hours
        self.employees = employees
        self.month = month
        self.year = year

    @abstractmethod
    def validate(self) -> Any:
        """
        Główna metoda walidacji - MUSI być zaimplementowana w podklasie.

        Returns:
            Wynik walidacji (typ zależy od walidatora)
        """
        pass

    # === HELPER METHODS (współdzielone) ===

    @staticmethod
    def parse_shift_hours(hours_string: str) -> tuple:
        """
        Parsuje string godzin "8:00-16:00" na (start_hour, start_min, end_hour, end_min).
        """
        import re
        match = re.match(r'(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})', hours_string)
        if not match:
            return None
        return tuple(map(int, match.groups()))

    @staticmethod
    def calculate_shift_length(hours_string: str) -> float:
        """
        Oblicza długość zmiany w godzinach.
        """
        parsed = BaseConflictValidator.parse_shift_hours(hours_string)
        if not parsed:
            return 0.0

        start_hour, start_min, end_hour, end_min = parsed
        start_minutes = start_hour * 60 + start_min
        end_minutes = end_hour * 60 + end_min
        return (end_minutes - start_minutes) / 60

    @staticmethod
    def get_days_in_month(year: int, month: int) -> int:
        """
        Zwraca liczbę dni w miesiącu.
        """
        from datetime import datetime, timedelta
        if month == 12:
            next_month = datetime(year + 1, 1, 1)
        else:
            next_month = datetime(year, month + 1, 1)
        last_day = next_month - timedelta(days=1)
        return last_day.day
