from typing import Dict, Any
from .rest_11h_validator import Rest11hValidator
from .rest_35h_validator import Rest35hValidator
from .shift_12h_validator import Shift12hValidator


class ConflictAggregator:
    """
    Agregator łączący wszystkie walidatory konfliktów.
    Single Responsibility: koordynuje walidacje i zbiera wyniki.
    """

    def __init__(self, work_hours, employees, month: int, year: int):
        self.work_hours = work_hours
        self.employees = employees
        self.month = month
        self.year = year

    def detect_all_conflicts(self) -> Dict[str, Any]:
        """
        Uruchamia wszystkie walidatory i zwraca zagregowane wyniki.

        Returns:
            {
                'rest_11h_conflicts': [...],
                'rest_35h_conflicts': {...},
                'shift_12h_conflicts': [...]
            }
        """
        # Inicjalizuj walidatory
        rest_11h = Rest11hValidator(self.work_hours, self.employees, self.month, self.year)
        rest_35h = Rest35hValidator(self.work_hours, self.employees, self.month, self.year)
        shift_12h = Shift12hValidator(self.work_hours, self.employees, self.month, self.year)

        # Uruchom walidacje
        return {
            'rest_11h_conflicts': rest_11h.validate(),
            'rest_35h_conflicts': rest_35h.validate(),
            'shift_12h_conflicts': shift_12h.validate()
        }
