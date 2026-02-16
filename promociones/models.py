from django.db import models
import uuid


class Promocion(models.Model):
    """Modelo para gestionar promociones con descuento y vigencia."""

    ETIQUETA_CHOICES = [
        ('nuevo', 'Nuevo'),
        ('especial', 'Especial'),
        ('limitado', 'Limitado'),
        ('descuento', 'Descuento'),
        ('exclusivo', 'Exclusivo'),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre de la Promoción',
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Texto que se muestra en la tarjeta pública',
    )
    etiqueta = models.CharField(
        max_length=20,
        choices=ETIQUETA_CHOICES,
        default='nuevo',
        verbose_name='Etiqueta',
        help_text='Badge visible en la web pública',
    )
    porcentaje_descuento = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        verbose_name='% de Descuento',
        help_text='Valor entre 0 y 100',
    )
    fecha_inicio = models.DateField(
        verbose_name='Fecha de Inicio',
    )
    fecha_fin = models.DateField(
        verbose_name='Fecha de Fin',
    )
    activa = models.BooleanField(
        default=True,
        verbose_name='Activa',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name='Modificado')

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Promoción'
        verbose_name_plural = 'Promociones'

    def __str__(self):
        return f"{self.nombre} – {self.porcentaje_descuento}%"
