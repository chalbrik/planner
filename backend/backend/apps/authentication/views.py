from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer
from datetime import datetime, timedelta
from django.conf import settings
from .services import AuthenticationService

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class UserView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user


class CheckAuthView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        return Response({'detail': 'Uwierzytelnienie pomyślne'})


class TokenObtainPairWithCookieView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response(
                {'detail': 'Username and password are required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        user = AuthenticationService.authenticate_user(username, password)

        if user is None:
            return Response(
                {'detail': 'Nieprawidłowa nazwa użytkownika lub hasło.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        tokens = AuthenticationService.generate_tokens(user)
        access_token = tokens['access']

        response = Response({'access': access_token})

        # Obliczamy czas wygaśnięcia cookie
        expires = datetime.now() + timedelta(days=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].days)

        response.set_cookie(
            key='refresh_token',
            value=tokens['refresh'],
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,  # Używaj wartości z konfiguracji Django
            samesite='Strict',
            expires=expires.timestamp(),
            path='/api/auth/token/refresh/'
        )

        return response


class TokenRefreshWithCookieView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # Pobieramy refresh token z cookie
        refresh_token = request.COOKIES.get('refresh_token')

        if not refresh_token:
            return Response(
                {'detail': 'Refresh token not found.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # ← JEDEN try-except wystarczy!
        try:
            tokens = AuthenticationService.refresh_access_token(refresh_token)
            access_token = tokens['access']
        except ValueError as e:
            return Response(
                {'detail': f'Invalid refresh token: {str(e)}'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Tworzymy odpowiedź z nowym access tokenem
        response = Response({'access': access_token})

        # Obliczamy czas wygaśnięcia cookie
        expires = datetime.now() + timedelta(days=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].days)

        # Ustawiamy cookie z nowym refresh tokenem
        response.set_cookie(
            key='refresh_token',
            value=tokens['refresh'],
            httponly=True,
            secure=settings.SESSION_COOKIE_SECURE,
            samesite='Strict',
            expires=expires.timestamp(),
            path='/api/auth/token/refresh/'
        )

        return response


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        # Blacklist token jeśli istnieje
        refresh_token = request.COOKIES.get('refresh_token')
        if refresh_token:
            AuthenticationService.blacklist_token(refresh_token)

        response = Response({'detail': 'Wylogowano pomyślnie.'})
        response.delete_cookie('refresh_token', path='/api/auth/token/refresh/')
        return response
