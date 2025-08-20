from typing import Optional
from ..models import Employee


class IdentificationService:
    @staticmethod
    def generate_employee_id() -> str:
        """Generuje unikalny numer ewidencyjny pracownika w formacie MP-XXX"""
        # Znajdź ostatni numer ewidencyjny
        last_employee = Employee.objects.filter(
            identification_number__startswith='MP-'
        ).order_by('-identification_number').first()

        if not last_employee or not last_employee.identification_number:
            return "MP-001"

        try:
            last_number = int(last_employee.identification_number.split('-')[1])
            new_number = last_number + 1
            return f"MP-{new_number:03d}"
        except (ValueError, IndexError):
            return "MP-001"