from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import WorkHoursViewSet

router = DefaultRouter()
router.register(r'work-hours', WorkHoursViewSet)

urlpatterns = [
    path('', include(router.urls)),
]