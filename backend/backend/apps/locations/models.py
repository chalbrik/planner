import uuid

from django.db import models
from django.contrib.auth import get_user_model

User = get_user_model()

class Location(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='locations',
        verbose_name="Właściciel"
    )
    identification_number = models.CharField(
        max_length=50,
        verbose_name="Numer lokacji",
        null=True,
        blank=True,
        db_index = True
    )
    name = models.CharField(max_length=100, verbose_name="Nazwa lokacji")
    address = models.TextField(blank=True, verbose_name="Adres")


    def __str__(self):
        return f"{self.name}"

    class Meta:
        verbose_name = "Lokacja"
        verbose_name_plural = "Lokacje"
        ordering = ['name']
