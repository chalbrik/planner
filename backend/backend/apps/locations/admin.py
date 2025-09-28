from django.contrib import admin

from .models import Location


# Register your models here.
@admin.register(Location)
class LocationAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'identification_number', 'name', 'address')
    list_filter = ('name',)
    search_fields = ('id', 'user', 'identification_number', 'name', 'address')
