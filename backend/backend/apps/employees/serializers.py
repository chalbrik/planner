from rest_framework import serializers
from .models import Employee, VacationLeave, PreviousEmployers, School
from .services import EmployeeService
from ..locations.models import Location


class PreviousEmployerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreviousEmployers
        fields = ['employer_name', 'employee_position', 'work_date_start', 'work_date_end']

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['school_type', 'school_name', 'graduation_year']

class EmployeeSerializer(serializers.ModelSerializer):
    contract_date_start = serializers.DateField(required=False, allow_null=True)
    contract_date_end = serializers.DateField(required=False, allow_null=True)
    locations = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Location.objects.all(),  # ✅ ZMIANA: usuń read_only, dodaj queryset
        required=False  # opcjonalne
    )

    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'birth_date', 'phone', 'email', 'agreement_type',
                  'identification_number', 'job', 'contract_date_start', 'contract_date_end',
                  'job_rate', 'hour_rate', 'locations']

class EmployeeDetailSerializer(serializers.ModelSerializer):
    school = SchoolSerializer(read_only=True)
    previous_employers = PreviousEmployerSerializer(many=True, read_only=True)
    contract_date_start = serializers.DateField(required=False, allow_null=True)
    contract_date_end = serializers.DateField(required=False, allow_null=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'full_name', 'birth_date', 'email', 'phone', 'agreement_type',
            'identification_number', 'job', 'contract_date_start',
            'contract_date_end', 'job_rate', 'hour_rate',
            'school', 'previous_employers', 'locations'  # zagnieżdżone obiekty
        ]


class EmployeeCreateSerializer(serializers.ModelSerializer):
    # Zagnieżdżone dane - tylko definicje pól
    school_type = serializers.CharField(required=False, allow_blank=True, write_only=True)
    school_name = serializers.CharField(required=False, allow_blank=True, write_only=True)
    graduation_year = serializers.DateField(required=False, write_only=True)
    previous_employers = PreviousEmployerSerializer(many=True, required=False, write_only=True)
    birth_date = serializers.DateField(required=False, write_only=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'full_name', 'phone', 'email', 'agreement_type',
            'identification_number', 'job', 'contract_date_start',
            'contract_date_end', 'job_rate', 'hour_rate',
            'school_type', 'school_name', 'graduation_year',
            'previous_employers', 'birth_date', 'locations'
        ]

    def create(self, validated_data):
        """
        Tworzy pracownika z powiązanymi danymi przy użyciu EmployeeService.
        Pobiera user z kontekstu serializatora.
        """
        import logging
        logger = logging.getLogger(__name__)

        logger.info(f"🚀 SERIALIZER CREATE CALLED with: {validated_data.keys()}")

        # Pobierz user z kontekstu (przekazany przez ViewSet)
        user = self.context.get('user')
        logger.info(f"🚀 USER from context: {user}")

        if user:
            validated_data['user'] = user

        # Użyj serwisu do tworzenia z relacjami
        result = EmployeeService.create_employee_with_relations(validated_data)
        logger.info(f"🚀 SERIALIZER FINISHED, returning: {result.id}")
        return result

class VacationLeaveSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.__str__', read_only=True)

    class Meta:
        model = VacationLeave
        fields = [
            'id',
            'employee',
            'employee_name',
            'current_vacation_days',
            'used_vacation_days',
            'remaining_vacation_days',
            'current_vacation_hours',
            'used_vacation_hours',
            'remaining_vacation_hours'
        ]

