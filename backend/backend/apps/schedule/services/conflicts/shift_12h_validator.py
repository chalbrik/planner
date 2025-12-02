from typing import List
from .base_validator import BaseConflictValidator


class Shift12hValidator(BaseConflictValidator):
    """
    Walidator sprawdzający czy zmiany nie przekraczają 12 godzin.
    Zgodnie z Kodeksem Pracy: doba pracownicza max 12h (z wyjątkami).
    """

    def validate(self) -> List[str]:
        """
        Zwraca listę konfliktów w formacie: ["employee-id-YYYY-MM-DD", ...]
        """
        conflicts = []

        for wh in self.work_hours:
            try:
                # Oblicz długość zmiany
                shift_length = self.calculate_shift_length(wh.hours)

                # Jeśli przekracza 12h
                if shift_length > 12:
                    conflict_key = f"{wh.employee.id}-{wh.date}"
                    if conflict_key not in conflicts:
                        conflicts.append(conflict_key)
            except (ValueError, AttributeError):
                # Ignoruj błędne formaty godzin
                continue

        return conflicts
