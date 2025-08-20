import uuid

from django.db import models


# Create your models here.

class Location(models.Model):
    objects = models.Manager()
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    name = models.CharField(max_length=100, verbose_name="Nazwa lokacji")
    address = models.TextField(blank=True, verbose_name="Adres")


    def __str__(self):
        return f"{self.name}"

    class Meta:
        verbose_name = "Lokacja"
        verbose_name_plural = "Lokacje"
        ordering = ['name']
