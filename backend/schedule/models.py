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
    agreement_type = models.CharField(
        max_length=20,
        choices=[
            ("permanent", "Umowa o pracę"),
            ("contract", "Umowa na zlecenie")
        ],
        default='permanent',
        verbose_name="Rodzaj umowy"
    )
    identification_number = models.CharField(
        max_length=50,
        verbose_name="Numer ewidencyjny",
        null=True,
        blank=True
    )
    job = models.CharField(
        max_length=20,
        verbose_name="Wymiar etatu",
        null=True,
        blank=True
    )
    contract_date_start = models.DateField(
        verbose_name="Data rozpoczęcia umowy",
        null=True,
        blank=True
    )
    contract_date_end = models.DateField(
        verbose_name="Data zakończenia umowy",
        null=True,
        blank=True
    )
    job_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Stawka etatowa",
        null=True,
        blank=True,
    )
    hour_rate = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Stawka godzinowa",
        null=True,
        blank=True
    )

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



class VacationLeave(models.Model):
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name="vacation_leaves", verbose_name="Pracownik")
    current_vacation_days = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0,
        verbose_name="Bieżący urlop (dni)",
    )
    current_vacation_hours = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0,
        verbose_name="Bieżący urlop (godziny)",
    )
    remaining_vacation_days = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0,
        verbose_name="Zaległy urlop (dni)",
    )
    remaining_vacation_hours = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        default=0,
        verbose_name="Zaległy urlop (godziny)",
    )
    used_vacation_days = models.DecimalField(
        max_digits=5,
        decimal_places=1,
        default=0,
        verbose_name="Wykorzystano (dni)",
    )
    used_vacation_hours = models.DecimalField(
        max_digits=6,
        decimal_places=1,
        default=0,
        verbose_name="Wykorzystano (godziny)",
    )

    def __str__(self):
        return f"{self.employee} - Urlop"

    class Meta:
        verbose_name = "Urlop"
        verbose_name_plural = "Urlopy"