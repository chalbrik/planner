# backend/apps/forms/urls.py
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import FormSubmissionView, FormSubmissionsListViewSet

app_name = 'forms'

router = DefaultRouter()
router.register(r'', FormSubmissionsListViewSet, basename='disposal')

urlpatterns = [
    path('submit', FormSubmissionView.as_view(), name='submit'),
    path('', include(router.urls))
]