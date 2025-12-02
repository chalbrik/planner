"""
Business logic for authentication operations.
"""
from typing import Dict, Optional
from django.contrib.auth import authenticate, get_user_model
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthenticationService:
    """
    Service handling authentication logic.
    """

    @staticmethod
    def authenticate_user(username: str, password: str) -> Optional[User]:
        """
        Autentykuje użytkownika.

        Args:
            username: Nazwa użytkownika
            password: Hasło

        Returns:
            User object jeśli dane poprawne, None jeśli nie
        """
        user = authenticate(username=username, password=password)
        return user

    @staticmethod
    def generate_tokens(user: User) -> Dict[str, str]:
        """
        Generuje JWT tokeny dla użytkownika.

        Args:
            user: User object

        Returns:
            Dict z 'access' i 'refresh' tokenami
        """
        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh)
        }

    @staticmethod
    def refresh_access_token(refresh_token: str) -> Dict[str, str]:
        """
        Odświeża access token używając refresh tokenu.

        Args:
            refresh_token: Refresh token (string)

        Returns:
            Dict z nowym 'access' i 'refresh' tokenem

        Raises:
            Exception jeśli refresh token nieprawidłowy
        """
        try:
            refresh = RefreshToken(refresh_token)

            # Wygeneruj nowy refresh token (rotation)
            refresh.set_jti()
            refresh.set_exp()

            return {
                'access': str(refresh.access_token),
                'refresh': str(refresh)
            }
        except Exception as e:
            raise Exception(f"Invalid refresh token: {str(e)}")

    @staticmethod
    def revoke_token(refresh_token: str) -> None:
        """
        Unieważnia refresh token (blacklist).

        Args:
            refresh_token: Token do unieważnienia
        """
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
        except Exception:
            # Token już invalid lub blacklisted
            pass
