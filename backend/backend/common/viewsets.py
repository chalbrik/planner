"""
Bazowe viewsets z automatycznym filtrowaniem po użytkowniku
"""
from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticated
from .permissions import IsOwnerPermission

class BaseUserOwnedViewSet(viewsets.ModelViewSet):
    """
     Bazowy ViewSet dla modeli które mają pole 'user'.

     Automatycznie:
     - Filtruje queryset po user=request.user
     - Ustawia user przy tworzeniu obiektu
     - Dodaje IsOwnerPermission
     """

    permission_classes = [IsAuthenticated, IsOwnerPermission]

    def get_queryset(self):
        """
        Zwraca tylko obiekty należące do zalogowanego użytkownika.
        """
        queryset = super().get_queryset()
        return queryset.filter(user=self.request.user)

    def perform_create(self, serializer):
        """
        Automatycznie ustawia user przy tworzeniu obiektu.
        """
        serializer.save(user=self.request.user)