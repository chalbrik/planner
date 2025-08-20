from django.shortcuts import render
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer

from rest_framework_simplejwt.tokens import RefreshToken
from datetime import datetime, timedelta
from django.conf import settings

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

        # Używaj Django authenticate zamiast ręcznego wyszukiwania
        from django.contrib.auth import authenticate
        user = authenticate(username=username, password=password)

        if user is None:
            return Response(
                {'detail': 'Nieprawidłowa nazwa użytkownika lub hasło.'},
                status=status.HTTP_401_UNAUTHORIZED
            )

        # Generowanie tokenów
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)

        # Ustawianie odpowiedzi
        response = Response({'access': access_token})

        # Obliczamy czas wygaśnięcia cookie
        expires = datetime.now() + timedelta(days=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].days)

        # Ustawiamy cookie z refresh tokenem
        response.set_cookie(
            key='refresh_token',
            value=str(refresh),
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

        try:
            refresh = RefreshToken(refresh_token)
            access_token = str(refresh.access_token)

            # Pobierz użytkownika z tokenu
            user_id = refresh.payload.get('user_id')
            user = User.objects.get(id=user_id)

            # Generujemy nowy refresh token
            new_refresh = RefreshToken.for_user(user)

            # Tworzymy odpowiedź z nowym access tokenem
            response = Response({'access': access_token})

            # Obliczamy czas wygaśnięcia cookie
            expires = datetime.now() + timedelta(days=settings.SIMPLE_JWT['REFRESH_TOKEN_LIFETIME'].days)

            # Ustawiamy cookie z nowym refresh tokenem
            response.set_cookie(
                key='refresh_token',
                value=str(new_refresh),
                httponly=True,
                secure=settings.SESSION_COOKIE_SECURE,
                samesite='Strict',
                expires=expires.timestamp(),
                path='/api/auth/token/refresh/'
            )

            return response

        except Exception as e:
            return Response(
                {'detail': f'Invalid refresh token: {str(e)}'},
                status=status.HTTP_401_UNAUTHORIZED
            )


class LogoutView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request, *args, **kwargs):
        response = Response({'detail': 'Wylogowano pomyślnie.'})
        response.delete_cookie('refresh_token', path='/api/auth/token/refresh/')
        return response
