from django.contrib import admin
from django.contrib import admin
from .models import WorkHours

@admin.register(WorkHours)
class WorkHoursAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'date', 'hours')
    list_filter = ('date',)
    search_fields = ('employee__first_name', 'employee__last_name')
    date_hierarchy = 'date'
