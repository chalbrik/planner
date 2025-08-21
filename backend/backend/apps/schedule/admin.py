from django.contrib import admin
from django.contrib import admin
from .models import WorkHours

@admin.register(WorkHours)
class WorkHoursAdmin(admin.ModelAdmin):
    list_display = ('id', 'employee', 'location', 'date', 'hours')
    list_filter = ('date', 'location')
    search_fields = ('employee__full_name', 'location__name')
    date_hierarchy = 'date'