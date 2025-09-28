from typing import Dict, Any
from django.db import transaction
from .identification_service import IdentificationService
from .vacation_service import VacationService
from ..models import Employee, School, PreviousEmployers
import logging

logger = logging.getLogger(__name__)


class EmployeeService:
    @staticmethod
    @transaction.atomic
    def create_employee_with_relations(validated_data: Dict[str, Any]) -> Employee:
        """Tworzy pracownika wraz z powiązanymi danymi."""
        logger.info(f"🔥 EMPLOYEE SERVICE CALLED with data: {validated_data.keys()}")

        # Sprawdź czy user został przekazany
        user = validated_data.get('user')
        if not user:
            raise ValueError("Pole 'user' jest wymagane do utworzenia pracownika")

        birth_date = validated_data.pop('birth_date', None)
        school_type = validated_data.pop('school_type', '')

        # Wyciągnij dane relacji
        school_data = {
            'school_type': school_type,
            'school_name': validated_data.pop('school_name', ''),
            'graduation_year': validated_data.pop('graduation_year', None)
        }

        locations_data = validated_data.pop('locations', [])
        previous_employers_data = validated_data.pop('previous_employers', [])

        # Generuj numer ewidencyjny
        if not validated_data.get('identification_number'):
            validated_data['identification_number'] = IdentificationService.generate_employee_id()

        logger.info(f"🔥 CREATING EMPLOYEE with: {validated_data}")

        # Utwórz pracownika (user jest już w validated_data)
        employee = Employee.objects.create(**validated_data)

        logger.info(f"🔥 EMPLOYEE CREATED: {employee.id} - {employee.full_name}")

        # Utwórz szkołę
        if school_data.get('school_type') and school_data['school_type'] != '':
            School.objects.create(employee=employee, **school_data)

        # Przypisz lokacje
        if locations_data:
            employee.locations.set(locations_data)

        # Utwórz poprzednich pracodawców
        for employer_data in previous_employers_data:
            PreviousEmployers.objects.create(employee=employee, **employer_data)

        # Oblicz urlop uwzględniając staż pracy
        if birth_date:
            vacation_data = VacationService.calculate_vacation_days(
                birth_date,
                validated_data.get('agreement_type', 'permanent'),
                school_type,
                previous_employers_data
            )
            VacationService.create_vacation_leave(employee, vacation_data)

        return employee