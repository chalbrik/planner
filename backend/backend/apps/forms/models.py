import uuid
from django.db import models


class FormSubmission(models.Model):
    id = models.UUIDField(
        primary_key=True,
        default=uuid.uuid4,
        editable=False
    )

    full_name = models.CharField(
        max_length=200,
        verbose_name="Imię i nazwisko"
    )

    disposal = models.TextField(
        verbose_name="Dyspozycja"
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
        verbose_name="Data utworzenia"
    )

    ip_address = models.GenericIPAddressField(
        null=True,
        blank=True,
        verbose_name="Adres IP"
    )

    class Meta:
        verbose_name = "Zgłoszenie"
        verbose_name_plural = "Zgłoszenia"
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.full_name} - {self.created_at.strftime('%Y-%m-%d %H:%M')}"