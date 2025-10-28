# backend/apps/forms/serializers.py

from rest_framework import serializers
from .models import FormSubmission


class FormSubmissionSerializer(serializers.ModelSerializer):
    """Serializer dla publicznego formularza"""

    class Meta:
        model = FormSubmission
        fields = ['id', 'full_name', 'disposal', 'created_at']
        read_only_fields = ['id', 'created_at']

    def validate_full_name(self, value):
        """Walidacja imienia i nazwiska"""
        if len(value.strip()) < 2:
            raise serializers.ValidationError(
                "Imię i nazwisko musi mieć minimum 2 znaki"
            )
        return value.strip()

    def validate_disposal(self, value):
        """Walidacja dyspozycji"""
        if len(value.strip()) < 10:
            raise serializers.ValidationError(
                "Dyspozycja musi mieć minimum 10 znaków"
            )
        return value.strip()