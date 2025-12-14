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
    def is_day_off(hours_string: str) -> bool:
        """
        Sprawdza czy wpis to dzień wolny (np. DWH, DWN, NŚ, etc.).

        Args:
            hours_string: String z godzinami lub skrótem dnia wolnego

        Returns:
            True jeśli to dzień wolny, False w przeciwnym razie
        """
        if not hours_string:
            return False

        # Lista skrótów dni wolnych
        day_off_codes = ['DWH', 'DWN', 'NŚ', 'DWS', 'DW5', 'WYP', 'UŻ', 'URZ', 'UNP', 'CH', 'OPZ']

        # Sprawdź czy string jest skrótem dnia wolnego (case insensitive)
        return hours_string.strip().upper() in day_off_codes

    @staticmethod
    def parse_shift_hours(hours_string: str) -> tuple:
        """
        Parsuje string godzin "8:00-16:00" na ("HH:MM", "HH:MM").

        Args:
            hours_string: String z godzinami w formacie "HH:MM-HH:MM"

        Returns:
            Tuple (start_str, end_str) lub None jeśli format nieprawidłowy

        Example:
            parse_shift_hours("8:00-16:00") -> ("08:00", "16:00")
        """
        import re

        # Sprawdź czy to dzień wolny
        if BaseConflictValidator.is_day_off(hours_string):
            return None

        match = re.match(r'(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})', hours_string)
        if not match:
            return None

        start_hour, start_min, end_hour, end_min = map(int, match.groups())

        # Zwróć jako stringi w formacie HH:MM
        return (f"{start_hour:02d}:{start_min:02d}", f"{end_hour:02d}:{end_min:02d}")

    @staticmethod
    def calculate_shift_length(hours_string: str) -> float:
        """
        Oblicza długość zmiany w godzinach.

        Args:
            hours_string: String z godzinami w formacie "HH:MM-HH:MM"

        Returns:
            Długość zmiany w godzinach (float), 0.0 dla dni wolnych
        """
        parsed = BaseConflictValidator.parse_shift_hours(hours_string)
        if not parsed:
            return 0.0

        start_str, end_str = parsed

        # Parsuj stringi "HH:MM" na godziny i minuty
        start_hour, start_min = map(int, start_str.split(':'))
        end_hour, end_min = map(int, end_str.split(':'))

        start_minutes = start_hour * 60 + start_min
        end_minutes = end_hour * 60 + end_min

        # Obsługa zmian nocnych (koniec < początek)
        if end_minutes < start_minutes:
            end_minutes += 24 * 60

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
