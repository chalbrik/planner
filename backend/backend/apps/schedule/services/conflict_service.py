"""
Serwis do wykrywania konfliktów w harmonogramach pracy.
"""
import re
from datetime import datetime, timedelta


from ..models import WorkHours
from ...employees.models import Employee


class ConflictDetectionService:
    """
    Serwis odpowiedzialny za wykrywanie konfliktów w harmonogramie pracy.
    """

    def __init__(self, location_id: str, month: int, year: int):
        """
        Inicjalizacja serwisu.

        Args:
            location_id: UUID lokacji
            month: Miesiąc (1-12)
            year: Rok
        """
        self.location_id = location_id
        self.month = month
        self.year = year
        self.work_hours = None
        self.employees = None

    def detect_all_conflicts(self):
        """
        Główna metoda - wykrywa wszystkie typy konfliktów.

        Returns:
            Dict z kluczami: rest_11h, rest_35h, exceed_12h
        """
        # Pobierz dane z bazy
        self._load_data()

        # Wykryj wszystkie konflikty
        conflicts = {
            'rest_11h': self._check_11h_rest(),
            'rest_35h': self._check_35h_rest(),
            'exceed_12h': self._check_12h_exceed()
        }

        return conflicts

    def _load_data(self):
        """Ładuje dane z bazy - work_hours i employees."""
        # Pobierz godziny pracy dla lokacji i miesiąca
        self.work_hours = WorkHours.objects.filter(
            location_id=self.location_id,
            date__month=self.month,
            date__year=self.year
        ).select_related('employee').order_by('date')

        # Pobierz pracowników na umowie o pracę dla tej lokacji
        employee_ids = self.work_hours.values_list('employee_id', flat=True).distinct()
        self.employees = Employee.objects.filter(
            id__in=employee_ids,
            agreement_type='permanent'  # Tylko UoP
        )

    def _check_11h_rest(self):
        """
        Sprawdza czy między zmianami jest przerwa 11h.

        Returns:
            Lista kluczy komórek z konfliktem (format: "employee_id-YYYY-MM-DD")
        """
        conflicts = set()

        # Pogrupuj godziny po pracownikach
        work_hours_by_employee = {}
        for wh in self.work_hours:
            if wh.employee_id not in work_hours_by_employee:
                work_hours_by_employee[wh.employee_id] = []
            work_hours_by_employee[wh.employee_id].append(wh)

        # Sprawdź każdego pracownika
        for employee_id, shifts in work_hours_by_employee.items():
            # Tylko dla pracowników na UoP
            if not self.employees.filter(id=employee_id).exists():
                continue

            # Posortuj zmiany po dacie
            shifts = sorted(shifts, key=lambda x: x.date)

            # Sprawdź każdą parę kolejnych zmian
            for i in range(len(shifts) - 1):
                current_shift = shifts[i]
                next_shift = shifts[i + 1]

                rest_hours = self._calculate_rest_between(current_shift, next_shift)

                if rest_hours < 11:
                    # Dodaj obie komórki do konfliktów
                    conflicts.add(f"{employee_id}-{current_shift.date}")
                    conflicts.add(f"{employee_id}-{next_shift.date}")

        return list(conflicts)

    def _check_35h_rest(self):
        """
        Sprawdza czy w każdym tygodniu jest przerwa 35h.
        UWAGA: Ostatni tydzień miesiąca jest pomijany (przerwa może być w następnym miesiącu).

        Returns:
            Dict: {employee_id: [week1, week2, ...]} - tygodnie z konfliktem
        """
        bad_weeks = {}

        # Oblicz liczbę tygodni w miesiącu
        days_in_month = self._get_days_in_month()
        num_weeks = (days_in_month + 6) // 7  # Zaokrąglenie w górę

        # Pogrupuj po pracownikach
        work_hours_by_employee = {}
        for wh in self.work_hours:
            if wh.employee_id not in work_hours_by_employee:
                work_hours_by_employee[wh.employee_id] = []
            work_hours_by_employee[wh.employee_id].append(wh)

        # Sprawdź każdego pracownika
        for employee_id, shifts in work_hours_by_employee.items():
            # Tylko dla pracowników na UoP
            if not self.employees.filter(id=employee_id).exists():
                continue

            employee_bad_weeks = []

            # Pogrupuj zmiany po tygodniach
            shifts_by_week = {}
            for shift in shifts:
                week_number = (shift.date.day + 6) // 7  # Tydzień 1-5
                if week_number not in shifts_by_week:
                    shifts_by_week[week_number] = []
                shifts_by_week[week_number].append(shift)

            # ✅ ZMIANA: Sprawdź każdy tydzień OPRÓCZ OSTATNIEGO
            for week in range(1, num_weeks):  # ← Zmienione z num_weeks + 1 na num_weeks
                week_shifts = shifts_by_week.get(week, [])

                if not week_shifts:
                    # Brak zmian = cały tydzień wolny (OK)
                    continue

                # Sprawdź czy jest przerwa 35h w tym tygodniu
                rest_periods = self._calculate_rest_periods_in_week(
                    week_shifts, week, days_in_month
                )

                has_long_rest = any(period >= 35 for period in rest_periods)

                if not has_long_rest:
                    employee_bad_weeks.append(week)

            if employee_bad_weeks:
                bad_weeks[str(employee_id)] = employee_bad_weeks

        return bad_weeks

    def _check_12h_exceed(self):
        """
        Sprawdza czy zmiana przekracza 12h.

        Returns:
            Lista kluczy komórek (format: "employee_id-YYYY-MM-DD")
        """
        exceeding = set()

        for wh in self.work_hours:
            # Tylko dla pracowników na UoP
            if not self.employees.filter(id=wh.employee_id).exists():
                continue

            shift_length = self._parse_shift_length(wh.hours)

            if shift_length and shift_length > 12:
                exceeding.add(f"{wh.employee_id}-{wh.date}")

        return list(exceeding)

    # === METODY POMOCNICZE ===

    def _parse_shift_length(self, hours_string: str):
        """
        Parsuje string godzin i zwraca długość zmiany w godzinach.

        Args:
            hours_string: Format "8:00-16:00"

        Returns:
            Długość zmiany w godzinach (float) lub None
        """
        match = re.match(r'(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})', hours_string)

        if not match:
            return None

        start_hour, start_min, end_hour, end_min = map(int, match.groups())

        start_minutes = start_hour * 60 + start_min
        end_minutes = end_hour * 60 + end_min

        shift_minutes = end_minutes - start_minutes
        return shift_minutes / 60

    def _calculate_rest_between(self, current_shift, next_shift):
        """
        Oblicza przerwę między dwiema zmianami w godzinach.
        """
        # Parsuj koniec obecnej zmiany
        current_match = re.match(r'.*-(\d{1,2}):(\d{2})', current_shift.hours)
        if not current_match:
            return 24  # Błąd parsowania = zakładamy OK

        current_end_hour, current_end_min = map(int, current_match.groups())

        # Parsuj początek następnej zmiany
        next_match = re.match(r'(\d{1,2}):(\d{2})-', next_shift.hours)
        if not next_match:
            return 24

        next_start_hour, next_start_min = map(int, next_match.groups())

        # Stwórz datetime
        current_end = datetime.combine(
            current_shift.date,
            datetime.min.time().replace(hour=current_end_hour, minute=current_end_min)
        )

        next_start = datetime.combine(
            next_shift.date,
            datetime.min.time().replace(hour=next_start_hour, minute=next_start_min)
        )

        # Oblicz różnicę
        rest_delta = next_start - current_end
        return rest_delta.total_seconds() / 3600  # Konwersja na godziny

    def _calculate_rest_periods_in_week(self, week_shifts, week_number: int, days_in_month: int):
        """
        Oblicza wszystkie okresy odpoczynku w tygodniu.

        Returns:
            Lista długości przerw w godzinach
        """
        if not week_shifts:
            return [168]  # Cały tydzień = 7 dni * 24h

        rest_periods = []

        # Posortuj zmiany
        week_shifts = sorted(week_shifts, key=lambda x: x.date)

        # Granice tygodnia
        week_start = (week_number - 1) * 7 + 1
        week_end = min(week_number * 7, days_in_month)

        # 1. Przerwa od początku tygodnia do pierwszej zmiany
        first_shift = week_shifts[0]
        if first_shift.date.day > week_start:
            # Całe dni przed pierwszą zmianą
            days_before = first_shift.date.day - week_start
            rest_periods.append(days_before * 24)

        # 2. Przerwy między zmianami
        for i in range(len(week_shifts) - 1):
            rest = self._calculate_rest_between(week_shifts[i], week_shifts[i + 1])
            rest_periods.append(rest)

        # 3. Przerwa od ostatniej zmiany do końca tygodnia
        last_shift = week_shifts[-1]
        if last_shift.date.day < week_end:
            days_after = week_end - last_shift.date.day
            rest_periods.append(days_after * 24)

        return rest_periods

    def _get_days_in_month(self):
        """Zwraca liczbę dni w miesiącu."""
        if self.month == 12:
            next_month = datetime(self.year + 1, 1, 1)
        else:
            next_month = datetime(self.year, self.month + 1, 1)

        last_day = next_month - timedelta(days=1)
        return last_day.day