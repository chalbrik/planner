import uuid
from django.db import models
from ..employees.models import Employee
from ..locations.models import Location


class WorkHours(models.Model):
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='work_hours', verbose_name="Pracownik")
    location = models.ForeignKey(Location, on_delete=models.CASCADE, verbose_name="Lokacja", null=True, blank=True)
    date = models.DateField(verbose_name="Data pracy")
    hours = models.CharField(max_length=50, verbose_name="Godziny pracy", help_text="np. 8:00-16:00")

    class Meta:
        verbose_name = "Godziny pracy"
        verbose_name_plural = "Godziny pracy"

        indexes = [
            # Indeks dla zapytań po lokacji i dacie (najczęstsze zapytanie)
            models.Index(fields=['location', 'date'], name='workhours_loc_date_idx'),

            # Indeks dla zapytań po pracowniku i dacie
            models.Index(fields=['employee', 'date'], name='workhours_emp_date_idx'),

            # Indeks dla sortowania po dacie
            models.Index(fields=['date'], name='workhours_date_idx'),
        ]

        # Kolejność domyślna
        ordering = ['date', 'employee']

    def __str__(self):
        return f"{self.employee} - {self.date} - {self.hours}"
