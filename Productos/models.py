from django.db import models
from django.core.exceptions import ValidationError


class Marca(models.Model):
    """
    Modelo para las marcas de productos
    """
    nombre = models.CharField(max_length=100, unique=True)
    descripcion = models.TextField(blank=True)
    activo = models.BooleanField(default=True)
    fecha_creacion = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Marca"
        verbose_name_plural = "Marcas"
        ordering = ['nombre']

    def __str__(self):
        return self.nombre


class Producto(models.Model):
    """
    Modelo para productos
    """

    # ===============================
    # CHOICES
    # ===============================
    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('agotado', 'Agotado'),
        ('descontinuado', 'Descontinuado'),
        ('en_transito', 'En Tránsito'),
    ]

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

    # ===============================
    # CAMPOS
    # ===============================
    codigo = models.AutoField(primary_key=True)

    id_marca = models.ForeignKey(
        Marca,
        on_delete=models.PROTECT,
        related_name='productos',
        verbose_name='Marca'
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

    nombre = models.CharField(
        max_length=60,
        verbose_name='Nombre del Producto',
        help_text='Nombre del producto',
        unique=True
    )

    precio = models.IntegerField(
        verbose_name='Precio',
        help_text='Precio del producto en pesos colombianos'
    )

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

    unidad_medida = models.CharField(
        max_length=45,
        choices=UNIDAD_MEDIDA_CHOICES,
        default='unidad',
        verbose_name='Unidad de Medida'
    )

    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='disponible',
        verbose_name='Estado'
    )

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    # ===============================
    # META
    # ===============================
    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['estado']),
            models.Index(fields=['linea']),
        ]

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
