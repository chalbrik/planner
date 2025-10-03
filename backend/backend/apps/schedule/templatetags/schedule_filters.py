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