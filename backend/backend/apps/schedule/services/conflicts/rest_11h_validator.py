from typing import List
from datetime import datetime, timedelta
from .base_validator import BaseConflictValidator


class Rest11hValidator(BaseConflictValidator):
    """
    Walidator sprawdzający 11-godzinny odpoczynek między zmianami.
    Zgodnie z Kodeksem Pracy: między zmianami musi być min. 11h przerwy.
    """

    def validate(self) -> List[str]:
        """
        Zwraca listę konfliktów w formacie: ["employee-id-YYYY-MM-DD", ...]
        """
        conflicts = []

        # Grupujemy zmiany według pracownika
        employee_shifts = {}
        for wh in self.work_hours:
            emp_id = wh.employee.id
            if emp_id not in employee_shifts:
                employee_shifts[emp_id] = []
            employee_shifts[emp_id].append(wh)

        # Sprawdzamy każdego pracownika
        for emp_id, shifts in employee_shifts.items():
            # Sortujemy zmiany chronologicznie
            sorted_shifts = sorted(shifts, key=lambda x: x.date)

            # Sprawdzamy kolejne pary zmian
            for i in range(len(sorted_shifts) - 1):
                current_shift = sorted_shifts[i]
                next_shift = sorted_shifts[i + 1]

                # Pobierz godziny zakończenia obecnej zmiany
                parsed_current = self.parse_shift_hours(current_shift.hours)
                parsed_next = self.parse_shift_hours(next_shift.hours)

                # Pomiń jeśli którykolwiek jest None (np. "dwh", "dwn", inne string wartości)
                if not parsed_current or not parsed_next:
                    continue

                # Rozpakuj tuple
                try:
                    current_start_h, current_start_m, current_end_h, current_end_m = parsed_current
                    next_start_h, next_start_m, next_end_h, next_end_m = parsed_next
                except (ValueError, TypeError):
                    continue

                # Konwertuj na stringi HH:MM
                current_start_str = f"{current_start_h:02d}:{current_start_m:02d}"
                current_end_str = f"{current_end_h:02d}:{current_end_m:02d}"
                next_start_str = f"{next_start_h:02d}:{next_start_m:02d}"

                # Parsuj do datetime
                current_end = datetime.strptime(
                    f"{current_shift.date} {current_end_str}",
                    "%Y-%m-%d %H:%M"
                )
                next_start = datetime.strptime(
                    f"{next_shift.date} {next_start_str}",
                    "%Y-%m-%d %H:%M"
                )

                # Obsługa nocnych zmian (np. 22:00 - 06:00)
                # Jeśli koniec < początek, to zmiana przechodzi przez północ
                current_shift_start_time = datetime.strptime(current_start_str, "%H:%M").time()
                current_shift_end_time = datetime.strptime(current_end_str, "%H:%M").time()

                if current_shift_end_time < current_shift_start_time:
                    # Zmiana nocna - dodaj dzień do końca
                    current_end += timedelta(days=1)

                # Sprawdź różnicę czasu
                time_diff = (next_start - current_end).total_seconds() / 3600

                # Jeśli mniej niż 11h odpoczynku
                if time_diff < 11:
                    conflict_key = f"{emp_id}-{next_shift.date}"
                    if conflict_key not in conflicts:
                        conflicts.append(conflict_key)

        return conflicts
