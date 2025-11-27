import requests
from rest_framework import status, viewsets
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from .serializers import FormSubmissionSerializer
from .models import FormSubmission
from django.conf import settings
import logging

logger = logging.getLogger(__name__)

def get_client_ip(request):
    """Pobiera adres IP klienta"""
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip


def verify_recaptcha(token, remote_ip=None):
    """
    Weryfikuje token reCAPTCHA v3 z Google API

    Args:
        token (str): Token reCAPTCHA z frontendu
        remote_ip (str, optional): Adres IP użytkownika

    Returns:
        dict: Odpowiedź z Google API lub błąd
    """
    secret_key = settings.RECAPTCHA_SECRET_KEY

    if not secret_key:
        return {
            'success': False,
            'error': 'RECAPTCHA_SECRET_KEY not configured'
        }

    url = 'https://www.google.com/recaptcha/api/siteverify'
    data = {
        'secret': secret_key,
        'response': token,
    }

    if remote_ip:
        data['remoteip'] = remote_ip
    try:
        logger.info(f"🔍 Sending to Google: secret={secret_key[:10]}..., token={token[:50]}...")
        response = requests.post(url, data=data, timeout=5)
        result = response.json()

        # ✅ LOGUJ WSZYSTKO
        logger.info("=" * 60)
        logger.info("📩 GOOGLE RECAPTCHA RESPONSE:")
        import json
        logger.info(json.dumps(result, indent=2))
        logger.info("=" * 60)

        return result
    except requests.RequestException as e:
        logger.error(f"❌ Request exception: {str(e)}")
        return {
            'success': False,
            'error': str(e)
        }


class FormSubmissionView(APIView):
    """
    Publiczny endpoint do przyjmowania zgłoszeń z formularza.
    Nie wymaga autentykacji.

    POST /api/forms/submit
    """
    permission_classes = [AllowAny]

    def post(self, request):
        recaptcha_token = request.data.get('recaptchaToken')

        logger.info("=" * 60)
        logger.info("📨 FORM SUBMISSION REQUEST RECEIVED")
        logger.info(f"Request data: {request.data}")

        if not recaptcha_token:
            return Response(
                {'error': 'Token reCAPTCHA jest wymagany'},
                status=status.HTTP_400_BAD_REQUEST
            )

        client_ip = get_client_ip(request)
        recaptcha_result = verify_recaptcha(recaptcha_token, client_ip)
        logger.info(f"reCAPTCHA token: {recaptcha_token[:50] if recaptcha_token else 'NONE'}...")

        if not recaptcha_result.get('success'):
            return Response(
                {
                    'error': 'Weryfikacja reCAPTCHA nieudana',
                    'details': recaptcha_result.get('error-codes', [])
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        score = recaptcha_result.get('score', 0)
        if score < 0.5:  # Możesz dostosować próg (0.0 - 1.0)
            return Response(
                {'error': 'Wykryto podejrzaną aktywność'},
                status=status.HTTP_400_BAD_REQUEST
            )

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

class FormSubmissionsListViewSet(viewsets.ModelViewSet):
    queryset = FormSubmission.objects.all()
    serializer_class = FormSubmissionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = FormSubmission.objects.all().order_by('-created_at')

        return queryset