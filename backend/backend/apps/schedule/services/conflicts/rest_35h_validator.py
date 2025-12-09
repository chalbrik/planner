from typing import Dict, List
from datetime import datetime, timedelta
from collections import defaultdict
from .base_validator import BaseConflictValidator


class Rest35hValidator(BaseConflictValidator):
    """
    Walidator sprawdzający 35-godzinny nieprzerwany odpoczynek tygodniowy.
    Zgodnie z Kodeksem Pracy: w każdym tygodniu min. 35h ciągłego odpoczynku.
    """

    def validate(self) -> Dict[str, List[int]]:
        """
        Zwraca słownik: {"employee-id": [1, 3], ...}
        gdzie [1, 3] to numery tygodni z konfliktem
        """
        conflicts = defaultdict(list)

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

            # Grupujemy według tygodni
            weeks = defaultdict(list)
            for shift in sorted_shifts:
                # Numer tygodnia (ISO: poniedziałek = początek)
                week_num = shift.date.isocalendar()[1]
                weeks[week_num].append(shift)

            # Sprawdzamy każdy tydzień
            for week_num, week_shifts in weeks.items():
                if not self._has_35h_rest(week_shifts):
                    conflicts[emp_id].append(week_num)

        return dict(conflicts)

    def _has_35h_rest(self, week_shifts: list) -> bool:
        """
        Sprawdza czy w danym tygodniu jest 35h ciągłego odpoczynku.
        """
        if not week_shifts:
            return True

        # Sortujemy zmiany chronologicznie
        sorted_shifts = sorted(week_shifts, key=lambda x: x.date)

        # Tworzymy listę wszystkich okresów pracy (start, end)
        work_periods = []
        for shift in sorted_shifts:
            # Parsuj godziny
            parsed = self.parse_shift_hours(shift.hours)

            # Pomiń jeśli nie można sparsować (np. "dwh", "dwn", inne string wartości)
            if not parsed:
                continue

            try:
                # Rozpakuj tuple
                start_h, start_m, end_h, end_m = parsed

                # Konwertuj na stringi HH:MM
                start_str = f"{start_h:02d}:{start_m:02d}"
                end_str = f"{end_h:02d}:{end_m:02d}"

                start = datetime.strptime(
                    f"{shift.date} {start_str}",
                    "%Y-%m-%d %H:%M"
                )
                end = datetime.strptime(
                    f"{shift.date} {end_str}",
                    "%Y-%m-%d %H:%M"
                )

                # Obsługa nocnych zmian
                start_time = datetime.strptime(start_str, "%H:%M").time()
                end_time = datetime.strptime(end_str, "%H:%M").time()

                if end_time < start_time:
                    # Zmiana nocna - dodaj dzień do końca
                    end += timedelta(days=1)

                work_periods.append((start, end))
            except (ValueError, AttributeError, TypeError):
                continue

        if not work_periods:
            return True

        # Sprawdzamy przerwy między zmianami
        for i in range(len(work_periods) - 1):
            current_end = work_periods[i][1]
            next_start = work_periods[i + 1][0]

            rest_hours = (next_start - current_end).total_seconds() / 3600

            # Jeśli znaleziono 35h odpoczynku
            if rest_hours >= 35:
                return True

        # Sprawdź również odpoczynek od końca ostatniej zmiany do końca tygodnia
        # oraz od początku tygodnia do pierwszej zmiany
        # (uproszczona wersja - można rozbudować)

        return False
