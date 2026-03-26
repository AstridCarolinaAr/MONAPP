from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
from django.db.models.functions import Lower, Trim
import uuid

class Servicio(models.Model):
    id_servicio = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200, verbose_name='Nombre del Servicio')
    precio = models.DecimalField(
        max_digits=10, 
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name='Precio'
    )
    descripcion = models.TextField(verbose_name='Descripción')
    imagen = models.ImageField(
        upload_to='servicios/',
        null=True,
        blank=True,
        verbose_name='Imagen del Servicio'
    )
    activo = models.BooleanField(default=True, verbose_name='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name='Última Modificación')
    
    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'
        constraints = [
            models.UniqueConstraint(
                Lower(Trim('nombre')),
                name='servicios_nombre_normalizado_unique',
            ),
        ]

    def _normalizar_nombre(self):
        return ' '.join((self.nombre or '').split())

    def clean(self):
        super().clean()
        nombre_normalizado = self._normalizar_nombre()

        if not nombre_normalizado:
            raise ValidationError({'nombre': 'El nombre del servicio es obligatorio.'})

        duplicado = Servicio.objects.filter(nombre__iexact=nombre_normalizado)
        if self.pk:
            duplicado = duplicado.exclude(pk=self.pk)

        if duplicado.exists():
            raise ValidationError({'nombre': 'Ya existe un servicio con este nombre.'})

        self.nombre = nombre_normalizado

    def save(self, *args, **kwargs):
        self.nombre = self._normalizar_nombre()
        return super().save(*args, **kwargs)
    
    def __str__(self):
        return f"{self.nombre} - ${self.precio}"
