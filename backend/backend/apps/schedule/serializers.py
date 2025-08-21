from rest_framework import serializers
from .models import WorkHours


class WorkHoursSerializer(serializers.ModelSerializer):
    employee_name = serializers.CharField(source='employee.__str__', read_only=True)
    location_name = serializers.CharField(source='location.name', read_only=True)

    class Meta:
        model = WorkHours
        fields = ['id', 'employee', 'employee_name', 'location', 'location_name', 'date', 'hours']


