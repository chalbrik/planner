from rest_framework import serializers
from .models import Employee, VacationLeave, PreviousEmployers, School
from .services import EmployeeService

class PreviousEmployerSerializer(serializers.ModelSerializer):
    class Meta:
        model = PreviousEmployers
        fields = ['employer_name', 'employee_position', 'work_date_start', 'work_date_end']

class SchoolSerializer(serializers.ModelSerializer):
    class Meta:
        model = School
        fields = ['school_type', 'school_name', 'graduation_year']

class EmployeeSerializer(serializers.ModelSerializer):
    contract_date_start = serializers.DateField(format='%d.%m.%Y', required=False, allow_null=True)
    contract_date_end = serializers.DateField(format='%d.%m.%Y', required=False, allow_null=True)

    class Meta:
        model = Employee
        fields = ['id', 'full_name', 'phone', 'email', 'agreement_type', 'identification_number', 'job',
                  'contract_date_start', 'contract_date_end', 'job_rate', 'hour_rate']

class EmployeeDetailSerializer(serializers.ModelSerializer):
    school = SchoolSerializer(read_only=True)
    previous_employers = PreviousEmployerSerializer(many=True, read_only=True)
    contract_date_start = serializers.DateField(format='%d.%m.%Y', required=False, allow_null=True)
    contract_date_end = serializers.DateField(format='%d.%m.%Y', required=False, allow_null=True)

    class Meta:
        model = Employee
        fields = [
            'id', 'full_name', 'email', 'phone', 'agreement_type',
            'identification_number', 'job', 'contract_date_start',
            'contract_date_end', 'job_rate', 'hour_rate',
            'school', 'previous_employers'  # zagnieżdżone obiekty
        ]


class EmployeeCreateSerializer(serializers.ModelSerializer):
    # Zagniezdzone dane - tylko definicje pól
    school_type = serializers.CharField(required=False, write_only=True)
    school_name = serializers.CharField(required=False, write_only=True)
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
            'previous_employers', 'birth_date'
        ]

    def create(self, validated_data):
        return EmployeeService.create_employee_with_relations(validated_data)

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

