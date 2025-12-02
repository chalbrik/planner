"""
Business logic for Location operations.
"""
from typing import List
from django.contrib.auth import get_user_model
from ..models import Location

User = get_user_model()


class LocationService:
    """
    Service class handling Location business logic.
    """

    @staticmethod
    def create_location(user: User, validated_data: dict) -> Location:
        """
        Tworzy nową lokację dla użytkownika.
        """
        validated_data['user'] = user
        location = Location.objects.create(**validated_data)
        return location

    @staticmethod
    def update_location(location_id: str, validated_data: dict) -> Location:
        """
        Aktualizuje istniejącą lokację.
        """
        location = Location.objects.get(id=location_id)
        for key, value in validated_data.items():
            setattr(location, key, value)
        location.save()
        return location

    @staticmethod
    def delete_location(location_id: str) -> None:
        """
        Usuwa lokację.
        """
        location = Location.objects.get(id=location_id)
        location.delete()

    @staticmethod
    def get_user_locations(user: User) -> List[Location]:
        """
        Pobiera wszystkie lokacje użytkownika.
        """
        return Location.objects.filter(user=user)
