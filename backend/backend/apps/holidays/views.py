from django.shortcuts import render

# Create your views here.
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from .services.holiday_service import HolidayService

logger = logging.getLogger(__name__)


class MonthHolidaysView(APIView):
    """
    Endpoint do pobierania świąt w konkretnym miesiącu
    GET /api/holidays/{year}/{month}/
    """
    permission_classes = [IsAuthenticated]  # Wymaga logowania
    # permission_classes = []

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

            # Pobierz święta przez serwis
            holiday_service = HolidayService()
            holidays = holiday_service.get_holidays_for_month(year, month)

            logger.info(f"📅 Zwracam {len(holidays)} świąt dla {month}/{year}")

            return Response({
                'year': year,
                'month': month,
                'holidays': holidays
            })

        except Exception as e:
            logger.error(f"❌ Błąd endpoint holidays/{year}/{month}/: {e}")
            return Response(
                {'error': 'Błąd podczas pobierania świąt'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )