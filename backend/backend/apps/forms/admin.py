from django.contrib import admin

# Register your models here.
# backend/apps/forms/admin.py

from django.contrib import admin
from .models import FormSubmission


@admin.register(FormSubmission)
class FormSubmissionAdmin(admin.ModelAdmin):
    """Panel administracyjny dla zgłoszeń z formularza"""

    list_display = ['full_name', 'created_at', 'ip_address']
    list_filter = ['created_at']
    search_fields = ['full_name', 'disposal']
    readonly_fields = ['id', 'created_at', 'ip_address']

    fieldsets = (
        ('Dane formularza', {
            'fields': ('full_name', 'disposal')
        }),
        ('Metadane', {
            'fields': ('id', 'created_at', 'ip_address'),
            'classes': ('collapse',)
        }),
    )

    def has_add_permission(self, request):
        """Zablokuj dodawanie przez admin - tylko przez API"""
        return False