from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EmployeeViewSet, WorkHoursViewSet, VacationLeaveViewSet

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'work-hours', WorkHoursViewSet)
router.register(r'vacation-leaves', VacationLeaveViewSet)

urlpatterns = [
    path('', include(router.urls)),
]