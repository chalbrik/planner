from rest_framework import serializers
from .models import Employee, WorkHours

class EmployeeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Employee
        fields = ['id', 'first_name', 'last_name', 'phone', 'email']


class WorkHoursSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.__str__', read_only=True)

    class Meta:
        model = WorkHours
        fields = ['id', 'employee', 'employee_name', 'date', 'hours']