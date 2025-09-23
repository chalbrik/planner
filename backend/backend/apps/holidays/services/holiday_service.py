import logging
from typing import List, Dict
from datetime import datetime
from .nager_api_client import NagerApiClient

logger = logging.getLogger(__name__)


class HolidayService:
    """Serwis do pobierania świąt dla konkretnego miesiąca"""

    def __init__(self):
        self.api_client = NagerApiClient()

    def get_holidays_for_month(self, year: int, month: int) -> List[Dict]:
        """
        Pobiera święta przypadające w konkretnym miesiącu

        Args:
            year: Rok (np. 2025)
            month: Miesiąc (1-12)

        Returns:
            Lista słowników z datami świąt w danym miesiącu:
            [
                {
                    "date": "2025-08-15",
                    "localName": "Wniebowzięcie Najświętszej Maryi Panny",
                    "name": "Assumption of Mary",
                    "day": "Friday"
                }
            ]
        """
        try:
            # Pobierz wszystkie święta dla roku
            all_holidays = self.api_client.get_public_holidays(year)

            # Filtruj tylko święta z konkretnego miesiąca
            month_holidays = []

            for holiday in all_holidays:
                holiday_date = datetime.strptime(holiday['date'], '%Y-%m-%d')

                if holiday_date.month == month:
                    # Dodaj dzień tygodnia dla wygody
                    day_names = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
                    holiday['day'] = day_names[holiday_date.weekday()]

                    month_holidays.append(holiday)

            logger.info(f"📅 Znaleziono {len(month_holidays)} świąt w {month}/{year}")
            return month_holidays

        except Exception as e:
            logger.error(f"❌ Błąd podczas filtrowania świąt dla {month}/{year}: {e}")
            # Zwróć pustą listę w przypadku błędu
            return []