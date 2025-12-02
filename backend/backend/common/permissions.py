"""
Klasa sprawdzająca czy użytkownik jest właścicielem zasobu

"""
from rest_framework import permissions

class IsOwnerPermission(permissions.BasePermission):
    """
    Pozwala tylko właścicielowi (owner) edytować/usuwać obiekt.
    """
    def has_object_permission(self, request, view, obj):
        if hasattr(obj, "user"):
            return obj.user == request.user
        return False


class IsOwnerOrReadOnly(permissions.BasePermission):
    """
    Pozwala czytać wszystkim, ale edytować tylko właścicielowi.

    GET - każdy może
    POST/PUT/DELETE - tylko owner
    """
    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        if hasattr(obj, 'user'):
            return obj.user == request.user
        return False

class IsEmployeeOwner(permissions.BasePermission):
    """
     Dla obiektów które mają employee.user zamiast bezpośrednio user.
     Używane dla WorkHours.
     """
    def has_object_permission(self, request, view, obj):
        # Sprawdź czy obiekt ma employee
        if hasattr(obj, 'employee'):
            # Sprawdź czy employee ma user
            if hasattr(obj.employee, 'user'):
                return obj.employee.user == request.user

        # Może też mieć bezpośrednio user (Employee)
        if hasattr(obj, 'user'):
            return obj.user == request.user

        return False
