from rest_framework import serializers
from .models import Employee, WorkHours, VacationLeave


class EmployeeSerializer(serializers.ModelSerializer):
    contract_date_start = serializers.DateField(format='%d.%m.%Y', required=False, allow_null=True)
    contract_date_end = serializers.DateField(format='%d.%m.%Y', required=False, allow_null=True)

    class Meta:
        model = Employee
        fields = ['id', 'first_name', 'last_name', 'phone', 'email', 'agreement_type', 'identification_number', 'job', 'contract_date_start', 'contract_date_end', 'job_rate', 'hour_rate']


class WorkHoursSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.__str__', read_only=True)

    class Meta:
        model = WorkHours
        fields = ['id', 'employee', 'employee_name', 'date', 'hours']


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

