"""
Serwisy dla modułu work_hours - logika biznesowa.
"""
from calendar import monthrange
from datetime import date
from django.template.loader import render_to_string
from weasyprint import HTML

from backend.apps.locations.models import Location
from backend.apps.employees.models import Employee
from .models import WorkHours
from .utils import calculate_hours, get_polish_weekday_name, get_polish_month_name


class PDFGeneratorService:
    """Serwis do generowania PDF z grafikami i listami obecności."""

    def __init__(self, user, location_id, month, year):
        self.user = user
        self.location_id = location_id
        self.month = month
        self.year = year
        self.location = None
        self._load_location()

    def _load_location(self):
        """Pobiera lokację z bazy danych."""
        try:
            self.location = Location.objects.get(id=self.location_id, user=self.user)
        except Location.DoesNotExist:
            raise ValueError("Lokacja nie została znaleziona")

    def generate_schedule_pdf(self):
        """Generuje PDF z grafikiem dla wybranej lokacji i miesiąca."""
        context = self._prepare_schedule_context()
        html_string = render_to_string('schedule/schedule_pdf.html', context)

        pdf_file = HTML(string=html_string).write_pdf()
        filename = f'grafik_{self.location.name}_{self.month}_{self.year}.pdf'

        return pdf_file, filename

    def generate_attendance_sheets(self):
        """Generuje listy obecności dla każdego dnia miesiąca."""
        context = self._prepare_attendance_context()
        html_string = render_to_string('schedule/attendance_sheets.html', context)

        pdf_file = HTML(string=html_string).write_pdf()
        filename = f'lista_obecnosci_{self.location.name}_{self.month}_{self.year}.pdf'

        return pdf_file, filename

    def _prepare_schedule_context(self):
        """Przygotowuje kontekst dla szablonu grafiku."""
        employees = self._get_employees()
        work_hours = self._get_work_hours()
        days = self._get_days_structure()
        hours_map = self._build_hours_map(work_hours)
        employees_schedule = self._build_employees_schedule(employees, hours_map)

        return {
            'location_name': self.location.name,
            'month_name': get_polish_month_name(self.month),
            'year': self.year,
            'days': days,
            'employees_schedule': employees_schedule,
        }

    def _prepare_attendance_context(self):
        """Przygotowuje kontekst dla szablonu list obecności."""
        work_hours = self._get_work_hours()
        days_data = self._build_days_data(work_hours)

        return {
            'location_name': self.location.name,
            'month_name': get_polish_month_name(self.month),
            'year': self.year,
            'days_data': days_data
        }

    def _get_employees(self):
        """Pobiera pracowników z danej lokacji."""
        return Employee.objects.filter(
            locations__id=self.location_id,
            user=self.user
        ).distinct().order_by('full_name')

    def _get_work_hours(self):
        """Pobiera WorkHours dla danego miesiąca i lokacji."""
        return WorkHours.objects.filter(
            location_id=self.location_id,
            date__month=self.month,
            date__year=self.year
        ).select_related('employee')

    def _get_days_structure(self):
        """Przygotowuje strukturę dni miesiąca."""
        num_days = monthrange(self.year, self.month)[1]
        polish_weekdays_short = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']

        days = []
        for day in range(1, num_days + 1):
            current_date = date(self.year, self.month, day)
            weekday_index = current_date.weekday()
            days.append({
                'day': day,
                'weekday': polish_weekdays_short[weekday_index],
                'is_weekend': weekday_index >= 5
            })

        return days

    def _build_hours_map(self, work_hours):
        """Tworzy mapę godzin: {employee_id: {day: hours}}."""
        hours_map = {}
        for wh in work_hours:
            if wh.employee_id not in hours_map:
                hours_map[wh.employee_id] = {}
            hours_map[wh.employee_id][wh.date.day] = wh.hours
        return hours_map

    def _build_employees_schedule(self, employees, hours_map):
        """Przygotowuje dane pracowników z grafikiem i sumą godzin."""
        employees_schedule = []
        for employee in employees:
            employee_hours = hours_map.get(employee.id, {})
            total_hours = sum(
                calculate_hours(hours) for hours in employee_hours.values()
            )

            employees_schedule.append({
                'name': employee.full_name,
                'hours': employee_hours,
                'total_hours': round(total_hours, 1)
            })

        return employees_schedule

    def _build_days_data(self, work_hours):
        """Buduje strukturę danych dla list obecności: {dzień: [(pracownik, godziny), ...]}."""
        num_days = monthrange(self.year, self.month)[1]

        # Inicjalizacja struktury dla każdego dnia
        days_data = {}
        for day in range(1, num_days + 1):
            current_date = date(self.year, self.month, day)
            days_data[day] = {
                'date': current_date,
                'day_number': day,
                'weekday': get_polish_weekday_name(current_date.weekday()),
                'employees': []
            }

        # Wypełnienie danymi pracowników
        for wh in work_hours.order_by('date', 'employee__full_name'):
            day = wh.date.day
            days_data[day]['employees'].append({
                'name': wh.employee.full_name,
                'hours': wh.hours
            })

        return days_data