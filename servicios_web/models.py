from django.db import models
import uuid

class ServicioWeb(models.Model):
    id_servicio_web = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)

    servicio_origen = models.OneToOneField(
        'servicios.Servicio',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='servicio_web',
        verbose_name='Servicio origen'
    )

    nombre = models.CharField(max_length=200, verbose_name='Nombre del Servicio')
    descripcion = models.TextField(verbose_name='Descripción del Servicio')
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name='Precio al público'
    )
    imagen = models.ImageField(
        upload_to='servicios_web/imagenes/',
        null=True,
        blank=True,
        verbose_name='Imagen del Servicio (opcional)'
    )
    video = models.FileField(
        upload_to='servicios_web/videos/',
        null=True,
        blank=True,
        verbose_name='Video del Servicio (opcional)'
    )
    activo = models.BooleanField(default=True, verbose_name='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name='Última Modificación')

    class Meta:
        ordering = ['nombre']
        verbose_name = 'Servicio Web'
        verbose_name_plural = 'Servicios Web'

    def __str__(self):
        return self.nombre