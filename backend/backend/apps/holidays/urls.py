from django.urls import path
from .views import MonthHolidaysView

urlpatterns = [
    path(
        'holidays/<int:year>/<int:month>/',
        MonthHolidaysView.as_view(),
        name='month_holidays'
    ),
]