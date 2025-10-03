"""
Walidatory dla modułu work_hours.
"""


class ScheduleParamsValidator:
    """Walidator parametrów dla generowania grafików i list obecności."""

    def __init__(self, query_params):
        self.query_params = query_params
        self.errors = {}
        self._location_id = None
        self._month = None
        self._year = None
        self._validate()

    def _validate(self):
        """Waliduje wszystkie parametry."""
        self._validate_required_params()
        if not self.errors:
            self._validate_month_year()

    def _validate_required_params(self):
        """Sprawdza czy wszystkie wymagane parametry są obecne."""
        location_id = self.query_params.get('location')
        month = self.query_params.get('month')
        year = self.query_params.get('year')

        if not all([location_id, month, year]):
            self.errors['error'] = 'Brakuje parametrów: location, month, year'
            return

        self._location_id = location_id

    def _validate_month_year(self):
        """Waliduje format miesiąca i roku."""
        try:
            self._month = int(self.query_params.get('month'))
            self._year = int(self.query_params.get('year'))

            if not (1 <= self._month <= 12):
                self.errors['error'] = 'Miesiąc musi być w zakresie 1-12'

            if self._year < 1900 or self._year > 2100:
                self.errors['error'] = 'Rok musi być w zakresie 1900-2100'

        except (ValueError, TypeError):
            self.errors['error'] = 'Nieprawidłowy format parametrów'

    def is_valid(self):
        """Zwraca True jeśli parametry są poprawne."""
        return not bool(self.errors)

    @property
    def location_id(self):
        return self._location_id

    @property
    def month(self):
        return self._month

    @property
    def year(self):
        return self._year