# backend/apps/forms/urls.py

from django.urls import path
from .views import FormSubmissionView

app_name = 'forms'

urlpatterns = [
    path('submit', FormSubmissionView.as_view(), name='submit'),
]