from django.shortcuts import render

# Create your views here.
# backend/apps/forms/views.py

from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import FormSubmissionSerializer


def get_client_ip(request):
    """Pobiera adres IP klienta"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


class FormSubmissionView(APIView):
    """
    Publiczny endpoint do przyjmowania zgłoszeń z formularza.
    Nie wymaga autentykacji.

    POST /api/forms/submit
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = FormSubmissionSerializer(data=request.data)

        if serializer.is_valid():
            # Zapisz z adresem IP
            submission = serializer.save(
                ip_address=get_client_ip(request)
            )

            return Response(
                {
                    'message': 'Formularz został wysłany pomyślnie',
                    'id': str(submission.id),
                    'created_at': submission.created_at
                },
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )