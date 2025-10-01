from django.contrib import admin
from .models import Employee, VacationLeave, School, PreviousEmployers


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = (
    'id', 'user', 'full_name', 'birth_date', 'email', 'phone', 'agreement_type', 'identification_number', 'job', 'contract_date_start',
    'contract_date_end', 'job_rate', 'hour_rate', 'get_locations')
    search_fields = ('user', 'full_name', 'email', 'phone', 'agreement_type', 'identification_number', 'job')

    def get_locations(self, obj):
        return ", ".join([location.name for location in obj.locations.all()])

    get_locations.short_description = 'Lokacje'


@admin.register(VacationLeave)
class VacationLeaveAdmin(admin.ModelAdmin):
    list_display = (
    'id', 'employee', 'current_vacation_days', 'current_vacation_hours', 'used_vacation_days', 'used_vacation_hours',
    'remaining_vacation_days', 'remaining_vacation_hours')
    list_filter = ('employee',)
    search_fields = ('employee__full_name',)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'school_type', 'school_name', 'graduation_year')
    list_filter = ('employee',)
    search_fields = ('employee__full_name', 'school_type', 'school_name')


@admin.register(PreviousEmployers)
class PreviousEmployersAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'employer_name', 'employee_position', 'work_date_start', 'work_date_end')
    list_filter = ('employee',)
    search_fields = ('employee__full_name', 'employer_name', 'employee_position')