from django.db import models
import uuid


class ProductoWeb(models.Model):
    """
    Modelo exclusivo para el catálogo público de la web.
    Independiente del inventario interno.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(
        max_length=200,
        verbose_name='Nombre del Producto',
    )
    precio = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name='Precio Público',
    )
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
    )
    imagen = models.ImageField(
        upload_to='productos_web/',
        blank=True,
        null=True,
        verbose_name='Imagen',
    )
    visible = models.BooleanField(
        default=True,
        verbose_name='Visible en la Web',
    )
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Creado')
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name='Modificado')

    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Producto Web'
        verbose_name_plural = 'Productos Web'

    def __str__(self):
        return f"{self.nombre} – ${self.precio}"
