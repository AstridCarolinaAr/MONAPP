from django.db import models
from django.core.validators import MinValueValidator
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
    video = models.FileField(
        upload_to='servicios/videos/',
        null=True,
        blank=True,
        verbose_name='Video del Servicio'
    )
    activo = models.BooleanField(default=True, verbose_name='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name='Última Modificación')
    
    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Servicio'
        verbose_name_plural = 'Servicios'
    
    def __str__(self):
        return f"{self.nombre} - ${self.precio}"