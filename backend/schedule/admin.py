from django.contrib import admin

# Register your models here.

from django.contrib import admin
from .models import Employee, WorkHours

@admin.register(Employee)
class EmployeeAdmin(admin.ModelAdmin):
    list_display = ('id', 'first_name', 'last_name', 'email', 'phone')
    search_fields = ('first_name', 'last_name', 'email', 'phone')

@admin.register(WorkHours)
class WorkHoursAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'date', 'hours')
    list_filter = ('date',)
    search_fields = ('employee__first_name', 'employee__last_name')
    date_hierarchy = 'date'
