from django.db import models
<<<<<<< HEAD
=======
from django.core.exceptions import ValidationError

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0

class Marca(models.Model):
    """
    Modelo para las marcas de productos
    """
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)
<<<<<<< HEAD
    
=======

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    class Meta:
        verbose_name = "Marca"
        verbose_name_plural = "Marcas"
        ordering = ['nombre']
<<<<<<< HEAD
    
=======

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    def __str__(self):
        return self.nombre


class Producto(models.Model):
    """
    Modelo para productos
<<<<<<< HEAD
    Relacionado con la tabla producto de tu base de datos
    """
    
    # Choices para el campo estado
=======
    """

    # ===============================
    # CHOICES
    # ===============================
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('agotado', 'Agotado'),
        ('descontinuado', 'Descontinuado'),
        ('en_transito', 'En Tránsito'),
    ]
<<<<<<< HEAD
    
    # Choices para unidad de medida
=======

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    UNIDAD_MEDIDA_CHOICES = [
        ('unidad', 'Unidad'),
        ('kg', 'Kilogramo'),
        ('g', 'Gramo'),
        ('litro', 'Litro'),
        ('ml', 'Mililitro'),
        ('caja', 'Caja'),
        ('paquete', 'Paquete'),
        ('metro', 'Metro'),
    ]
<<<<<<< HEAD
    
    # Campo codigo como clave primaria
    codigo = models.AutoField(primary_key=True)
    
    # Relaciones con otras tablas
=======

    # ===============================
    # CAMPOS
    # ===============================
    codigo = models.AutoField(primary_key=True)

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    id_marca = models.ForeignKey(
        Marca,
        on_delete=models.PROTECT,
        related_name='productos',
<<<<<<< HEAD
        verbose_name='Marca',
        help_text='Marca del producto'
    )
    
    codigo_compra = models.IntegerField(
        null=True,
        blank=True,
        help_text='Código de compra asociado'
    )
    
    codigo_cliente = models.IntegerField(
        null=True,
        blank=True,
        help_text='Código de cliente asociado'
    )
    
    # Información del producto
    nombre = models.CharField(
        max_length=60,
        verbose_name='Nombre del Producto',
        help_text='Nombre del producto'
    )
    
=======
        verbose_name='Marca'
    )
    nombre = models.CharField(
        max_length=60,
        verbose_name='Nombre del Producto',
        help_text='Nombre del producto',
        unique=True
    )

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    precio = models.IntegerField(
        verbose_name='Precio',
        help_text='Precio del producto en pesos colombianos'
    )
<<<<<<< HEAD
    
    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción',
        help_text='Descripción detallada del producto'
    )
    
    linea = models.CharField(
        max_length=45,
        blank=True,
        verbose_name='Línea',
        help_text='Línea o categoría del producto'
    )
    
    presentacion = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Presentación',
        help_text='Presentación del producto (ej: 500ml, caja x12)'
    )
    
=======

    descripcion = models.TextField(
        blank=True,
        verbose_name='Descripción'
    )

    linea = models.CharField(
        max_length=45,
        blank=True,
        verbose_name='Línea'
    )

    presentacion = models.CharField(
        max_length=50,
        blank=True,
        verbose_name='Presentación'
    )

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    unidad_medida = models.CharField(
        max_length=45,
        choices=UNIDAD_MEDIDA_CHOICES,
        default='unidad',
<<<<<<< HEAD
        verbose_name='Unidad de Medida',
        help_text='Unidad de medida del producto'
    )
    
=======
        verbose_name='Unidad de Medida'
    )

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='disponible',
<<<<<<< HEAD
        verbose_name='Estado',
        help_text='Estado actual del producto'
    )
    
    # Campos adicionales útiles
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
=======
        verbose_name='Estado'
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    # ===============================
    # META
    # ===============================
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['estado']),
            models.Index(fields=['linea']),
        ]
<<<<<<< HEAD
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    def get_precio_formateado(self):
        """Retorna el precio formateado en pesos colombianos"""
        return f"${self.precio:,}".replace (",", ".")
    
    def esta_disponible(self):
        """Verifica si el producto está disponible"""
        return self.estado == 'disponible'
    
    def get_nombre_completo(self):
        """Retorna el nombre completo con presentación"""
        if self.presentacion:
            return f"{self.nombre} - {self.presentacion}"
        return self.nombre
=======

    # ===============================
    # VALIDACIONES PRO
    # ===============================
    def clean(self):
        # Normalizar nombre
        self.nombre = self.nombre.strip().title()

        # Validar nombre duplicado (case-insensitive)
        if Producto.objects.exclude(pk=self.pk).filter(
            nombre__iexact=self.nombre
        ).exists():
            raise ValidationError({
                'nombre': 'Ya existe un producto con este nombre.'
            })

    def save(self, *args, **kwargs):
        self.full_clean()  # fuerza clean()
        super().save(*args, **kwargs)

    # ===============================
    # MÉTODOS ÚTILES
    # ===============================
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"

    def get_precio_formateado(self):
        return f"${self.precio:,}".replace(",", ".")

    def esta_disponible(self):
        return self.estado == 'disponible'

    def get_nombre_completo(self):
        if self.presentacion:
            return f"{self.nombre} - {self.presentacion}"
        return self.nombre
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
