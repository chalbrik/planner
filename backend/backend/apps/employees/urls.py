from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, VacationLeaveViewSet

router = DefaultRouter()
router.register(r'', EmployeeViewSet, basename='employee')
router.register(r'vacation-leaves', VacationLeaveViewSet)

urlpatterns = [
    path('', include(router.urls)),
]