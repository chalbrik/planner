from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Employee, WorkHours, VacationLeave

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'email', 'phone', 'agreement_type', 'identification_number', 'job', 'contract_date_start', 'contract_date_end', 'job_rate', 'hour_rate')
    search_fields = ('first_name', 'last_name', 'email', 'phone', 'agreement_type', 'identification_number', 'job', 'contract_date_start', 'contract_date_end', 'job_rate', 'hour_rate')

@admin.register(WorkHours)
class WorkHoursAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'date', 'hours')
    list_filter = ('date',)
    search_fields = ('employee__first_name', 'employee__last_name')
    date_hierarchy = 'date'

@admin.register(VacationLeave)
class VacationLeave(admin.ModelAdmin):
    list_display = ('id', 'employee', 'current_vacation_days', 'current_vacation_hours', 'used_vacation_days', 'used_vacation_hours', 'remaining_vacation_days', 'remaining_vacation_hours')
    list_filter = ('employee',)
    search_fields = ('employee__first_name', 'employee__last_name')
