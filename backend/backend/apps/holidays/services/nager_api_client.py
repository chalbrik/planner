import requests
import logging
from typing import List, Dict
from datetime import datetime

logger = logging.getLogger(__name__)


class NagerApiClient:
    """Prosty klient do pobierania świąt z Nager.Date API dla Polski"""

    BASE_URL = "https://date.nager.at/api/v3"
    COUNTRY_CODE = "PL"  # Polska

    def __init__(self, timeout: int = 10):
        self.timeout = timeout
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'DjangoApp-HolidayService/1.0'
        })

    def get_public_holidays(self, year: int) -> List[Dict]:
        """
        Pobiera wszystkie święta państwowe dla Polski w danym roku

        Args:
            year: Rok dla którego mają być pobrane święta

        Returns:
            Lista słowników z datami świąt w formacie:
            [{"date": "2025-01-01", "localName": "Nowy Rok", "name": "New Year's Day"}, ...]

        Raises:
            requests.RequestException: W przypadku błędu komunikacji z API
        """
        url = f"{self.BASE_URL}/PublicHolidays/{year}/{self.COUNTRY_CODE}"

        try:
            logger.info(f"📅 Pobieranie świąt dla Polski, rok {year}")

            response = self.session.get(url, timeout=self.timeout)
            response.raise_for_status()

            holidays = response.json()
            logger.info(f"✅ Pobrano {len(holidays)} świąt dla roku {year}")

            return holidays

        except requests.RequestException as e:
            logger.error(f"❌ Błąd API Nager.Date dla roku {year}: {e}")
            raise