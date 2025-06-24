import uuid

from django.db import models

# Create your models here.

from django.contrib.auth import get_user_model

User = get_user_model()

class Employee(models.Model):
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(max_length=254, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)

    def __str__(self):
        return f"{self.first_name} {self.last_name}"

    class Meta:
        verbose_name = "Pracownik"
        verbose_name_plural = "Pracownicy"


class WorkHours(models.Model):
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='work_hours', verbose_name="Pracownik")
    date = models.DateField(verbose_name="Data pracy")
    hours = models.CharField(max_length=50, verbose_name="Godziny pracy", help_text="np. 8:00-16:00")

    class Meta:
        verbose_name = "Godziny pracy"
        verbose_name_plural = "Godziny pracy"
        unique_together = ('employee', 'date')  # Jeden wpis na pracownika na dzień

    def __str__(self):
        return f"{self.employee} - {self.date} - {self.hours}"
