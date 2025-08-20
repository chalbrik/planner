from django.urls import path
from .views import (
    RegisterView,
    UserView,
    CheckAuthView,
    TokenObtainPairWithCookieView,
    TokenRefreshWithCookieView,
    LogoutView
)

urlpatterns = [
    path('token/', TokenObtainPairWithCookieView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshWithCookieView.as_view(), name='token_refresh'),

    path('logout/', LogoutView.as_view(), name='token_verify'),

    path('register/', RegisterView.as_view(), name='register'),
    path('user/', UserView.as_view(), name='user'),
    path('check-auth/', CheckAuthView.as_view(), name='check_auth'),
]