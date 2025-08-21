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
        unique_together = ('employee', 'location', 'date')  # Jeden wpis na pracownika na dzień

    def __str__(self):
        return f"{self.employee} - {self.date} - {self.hours}"
