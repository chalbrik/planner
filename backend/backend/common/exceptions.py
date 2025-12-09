"""
Custom exceptions i exception handler dla spójnych błędów API
"""
from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


class ResourceNotFound(Exception):
    """Zasób nie został znaleziony"""
    pass


class PermissionDenied(Exception):
    """Brak uprawnień"""
    pass


class ValidationError(Exception):
    """Błąd walidacji"""
    pass


def custom_exception_handler(exc, context):
    """
    Zwraca spójny format błędów w całym API:
    {
      "error": {
        "code": "ERROR_CODE",
        "message": "Human readable message",
        "details": {...}
      }
    }
    """
    response = exception_handler(exc, context)

    if response is not None:
        custom_response = {
            "error": {
                "code": exc.__class__.__name__.upper(),
                "message": str(exc),
                "details": response.data
            }
        }
        response.data = custom_response

    return response
