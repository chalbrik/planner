"""
Funkcje pomocnicze dla modułu work_hours.
"""
import re


def calculate_hours(hours_str):
    """
    Oblicza liczbę godzin z formatu 'HH:MM-HH:MM' lub 'H-H'.
    Zwraca liczbę godzin jako float.
    """
    if not hours_str or hours_str == '-':
        return 0

    try:
        # Format: "8:00-16:00" lub "08:00-16:00"
        if ':' in hours_str:
            match = re.match(r'(\d{1,2}):(\d{2})-(\d{1,2}):(\d{2})', hours_str)
            if match:
                start_h, start_m, end_h, end_m = map(int, match.groups())
                start_total = start_h + start_m / 60
                end_total = end_h + end_m / 60
                return end_total - start_total

        # Format: "8-16" lub "08-16"
        match = re.match(r'(\d{1,2})-(\d{1,2})', hours_str)
        if match:
            start_h, end_h = map(int, match.groups())
            return end_h - start_h

    except (ValueError, AttributeError):
        pass

    return 0


def get_polish_weekday_name(weekday_index, short=False):
    """
    Zwraca nazwę dnia tygodnia po polsku.

    Args:
        weekday_index: Indeks dnia tygodnia (0=poniedziałek, 6=niedziela)
        short: Jeśli True, zwraca skróconą nazwę
    """
    if short:
        weekdays = ['Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'So', 'Nd']
    else:
        weekdays = [
            'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek',
            'Piątek', 'Sobota', 'Niedziela'
        ]

    return weekdays[weekday_index]


def get_polish_month_name(month_number):
    """
    Zwraca nazwę miesiąca po polsku.

    Args:
        month_number: Numer miesiąca (1-12)
    """
    months = [
        '', 'Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
        'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień'
    ]

    return months[month_number]