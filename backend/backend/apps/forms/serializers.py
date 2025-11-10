from rest_framework import serializers
from .models import FormSubmission


class FormSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormSubmission
        fields = ['id', 'full_name', 'disposal', 'created_at']
        read_only_fields = ['id', 'created_at']
        extra_kwargs = {
            'full_name': {'required': True, 'allow_blank': False},
            'disposal': {'required': True, 'allow_blank': False}
        }