from django.db import models

# Create your models here.
import uuid
from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()


class Employee(models.Model):
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    full_name = models.CharField(max_length=100)
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


class VacationLeave(models.Model):
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="vacation_leaves",
        verbose_name="Pracownik"
    )
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


class School(models.Model):
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.OneToOneField(
        Employee,
        on_delete=models.CASCADE,
        related_name="School",
        verbose_name="Pracownik"
    )
    school_type = models.CharField(
        max_length=100,
        verbose_name="Typ szkoły",
        default='Nieznany'
    )
    school_name = models.CharField(
        max_length=200,
        verbose_name="Nazwa szkoły",
        default='Nieznany'
    )
    graduation_year = models.DateField(
        verbose_name="Rok ukończenia szkoły",
        null=True,
        blank=True
    )

    def __str__(self):
        return f"{self.employee} - Szkoła"

    class Meta:
        verbose_name = "Szkoła"
        verbose_name_plural = "Szkoły"

class PreviousEmployers(models.Model):
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(
        Employee,
        on_delete=models.CASCADE,
        related_name="previous_employers",
        verbose_name="Pracownik"
    )
    employer_name = models.CharField(
        max_length=200,
        verbose_name="Pracodawca/Nazwa firmy",
        null=True,
        blank=True
    )
    employee_position = models.CharField(
        max_length=200,
        verbose_name="Stanowisko",
        null=True,
        blank=True
    )
    work_date_start = models.DateField(
        verbose_name="Data rozpoczęcia pracy",
        null=True,
        blank=True
    )
    work_date_end = models.DateField(
        verbose_name="Data zakończenia pracy",
        null=True,
        blank=True
    )