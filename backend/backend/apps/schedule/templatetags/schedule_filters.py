from django import template

register = template.Library()


@register.filter
def get_item(dictionary, key):
    """
    Pobiera wartość ze słownika dla danego klucza.

    Użycie w template:
    {{ my_dict|get_item:my_key }}

    Args:
        dictionary: Słownik z danymi
        key: Klucz do pobrania

    Returns:
        Wartość ze słownika lub None jeśli klucz nie istnieje
    """
    if dictionary is None:
        return None
    return dictionary.get(key)


@register.filter
def hours_to_hm(hours):
    """
    Konwertuje godziny dziesiętne na format "Xh Ymin" z zaokrągleniem do najbliższej.

    Użycie w template:
    {{ total_hours|hours_to_hm }}

    Args:
        hours: Liczba godzin w formacie dziesiętnym (np. 134.8)

    Returns:
        String w formacie "Xh Ymin" (np. "134h 48min")
    """
    if hours is None or hours == 0:
        return "0h"

    try:
        hours_float = float(hours)
        hours_int = int(hours_float)
        minutes = round((hours_float - hours_int) * 60)

        if minutes == 0:
            return f"{hours_int}h"
        elif minutes == 60:
            return f"{hours_int + 1}h"
        else:
            return f"{hours_int}h {minutes}min"
    except (ValueError, TypeError):
        return hours


@register.filter
def split_hours(value):
    """
    Dzieli godziny "8:00-16:00" na dwie linie.

    Użycie w template:
    {{ "8:00-16:00"|split_hours }}

    Args:
        value: String z godzinami w formacie "HH:MM-HH:MM"

    Returns:
        String z godzinami w dwóch liniach: "HH:MM\nHH:MM"
    """
    if not value or value == '-':
        return '-'

    # Sprawdź czy to format godzin z myślnikiem
    if '-' in value:
        return value.replace('-', '\n')

    return value