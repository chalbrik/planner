from django.shortcuts import render

# Create your views here.
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .services.holiday_service import HolidayService
import requests

logger = logging.getLogger(__name__)


class MonthHolidaysView(APIView):
    """
    Endpoint do pobierania świąt w konkretnym miesiącu
    GET /api/holidays/{year}/{month}/
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, year: int, month: int):
        """Pobiera święta dla konkretnego miesiąca"""

        try:
            # Walidacja parametrów
            if not (1 <= month <= 12):
                return Response(
                    {'error': 'Miesiąc musi być między 1 a 12'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if not (2000 <= year <= 2030):
                return Response(
                    {'error': 'Rok musi być między 2000 a 2030'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            holiday_service = HolidayService()
            holidays = holiday_service.get_holidays_for_month(year, month)

            return Response({
                'year': year,
                'month': month,
                'holidays': holidays
            })

        except requests.RequestException as e:
            logger.error(f"❌ Błąd API w endpoint holidays/{year}/{month}/: {e}", exc_info=True)
            return Response(
                {'error': 'Błąd komunikacji z API świąt'},
                status=status.HTTP_503_SERVICE_UNAVAILABLE
            )

        except (ValueError, KeyError) as e:
            logger.error(f"❌ Błąd parsowania w endpoint holidays/{year}/{month}/: {e}", exc_info=True)
            return Response(
                {'error': 'Błąd przetwarzania danych świąt'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )