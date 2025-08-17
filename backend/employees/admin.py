from django.contrib import admin
from .models import Employee, VacationLeave, School, PreviousEmployers


@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'full_name', 'email', 'phone', 'agreement_type', 'identification_number', 'job', 'contract_date_start', 'contract_date_end', 'job_rate', 'hour_rate')
    search_fields = ('first_name', 'last_name', 'email', 'phone', 'agreement_type', 'identification_number', 'job', 'contract_date_start', 'contract_date_end', 'job_rate', 'hour_rate')


@admin.register(VacationLeave)
class VacationLeave(admin.ModelAdmin):
    list_display = ('id', 'employee', 'current_vacation_days', 'current_vacation_hours', 'used_vacation_days', 'used_vacation_hours', 'remaining_vacation_days', 'remaining_vacation_hours')
    list_filter = ('employee',)
    search_fields = ('employee__first_name', 'employee__last_name')

@admin.register(School)
class School(admin.ModelAdmin):
    list_display = ('id', 'employee', 'school_type', 'school_name', 'graduation_year')
    list_filter = ('employee',)
    search_fields = ('id', 'employee', 'school_type', 'school_name', 'graduation_year')

@admin.register(PreviousEmployers)
class School(admin.ModelAdmin):
    list_display = ('id', 'employee', 'employer_name', 'employee_position', 'work_date_start', 'work_date_end')
    list_filter = ('employee',)
    search_fields = ('id', 'employee', 'employer_name', 'employee_position', 'work_date_start', 'work_date_end')

