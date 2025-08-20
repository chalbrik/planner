from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, VacationLeaveViewSet

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'vacation-leaves', VacationLeaveViewSet)

urlpatterns = [
    path('', include(router.urls)),
]