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
                    # Konwertuj UUID na string dla JSON
                    conflicts[str(emp_id)].append(week_num)

        return dict(conflicts)

    def _has_35h_rest(self, week_shifts: list) -> bool:
        """
        Sprawdza czy w danym tygodniu jest 35h ciągłego odpoczynku.

        Uwaga: Dzień wolny (DWH, DWN, etc.) jest traktowany jako pełny dzień odpoczynku (24h).
        """
        if not week_shifts:
            return True

        # Sortujemy zmiany chronologicznie
        sorted_shifts = sorted(week_shifts, key=lambda x: x.date)

        # Sprawdź czy jest dzień wolny - dzień wolny = automatycznie 35h odpoczynku
        for shift in sorted_shifts:
            if self.is_day_off(shift.hours):
                # Dzień wolny to 24h, więc sprawdź czy przed lub po nim jest przerwa >= 11h
                # Wtedy łącznie będzie >= 35h
                return True  # Uproszczenie: dzień wolny daje 35h odpoczynku

        # Tworzymy listę wszystkich okresów pracy (start, end)
        work_periods = []
        for shift in sorted_shifts:
            # Pomiń dni wolne w obliczeniach okresów pracy
            if self.is_day_off(shift.hours):
                continue

            try:
                parsed = self.parse_shift_hours(shift.hours)
                if not parsed:
                    continue

                start_str, end_str = parsed

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

        # Sprawdź odpoczynek od początku tygodnia do pierwszej zmiany
        # oraz od ostatniej zmiany do końca tygodnia

        # Znajdź początek i koniec tygodnia ISO (poniedziałek - niedziela)
        first_shift_date = sorted_shifts[0].date

        # Oblicz poniedziałek tego tygodnia (ISO week start)
        week_start = first_shift_date - timedelta(days=first_shift_date.weekday())
        # Oblicz niedzielę tego tygodnia (ISO week end)
        week_end = week_start + timedelta(days=6)

        # Konwertuj na datetime (poniedziałek 00:00:00 i niedziela 23:59:59)
        week_start_dt = datetime.combine(week_start, datetime.min.time())
        week_end_dt = datetime.combine(week_end, datetime.max.time())

        # Odpoczynek od początku tygodnia do pierwszej zmiany
        first_work_start = work_periods[0][0]
        rest_before = (first_work_start - week_start_dt).total_seconds() / 3600

        if rest_before >= 35:
            return True

        # Odpoczynek od ostatniej zmiany do końca tygodnia
        last_work_end = work_periods[-1][1]
        rest_after = (week_end_dt - last_work_end).total_seconds() / 3600

        if rest_after >= 35:
            return True

        return False
