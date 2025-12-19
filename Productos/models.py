from django.db import models

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
    Relacionado con la tabla producto de tu base de datos
    """
    
    # Choices para el campo estado
    ESTADO_CHOICES = [
        ('disponible', 'Disponible'),
        ('agotado', 'Agotado'),
        ('descontinuado', 'Descontinuado'),
        ('en_transito', 'En Tránsito'),
    ]
    
    # Choices para unidad de medida
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
    
    # Campo codigo como clave primaria
    codigo = models.AutoField(primary_key=True)
    
    # Relaciones con otras tablas
    id_marca = models.ForeignKey(
        Marca,
        on_delete=models.PROTECT,
        related_name='productos',
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
    
    precio = models.IntegerField(
        verbose_name='Precio',
        help_text='Precio del producto en pesos colombianos'
    )
    
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
    
    unidad_medida = models.CharField(
        max_length=45,
        choices=UNIDAD_MEDIDA_CHOICES,
        default='unidad',
        verbose_name='Unidad de Medida',
        help_text='Unidad de medida del producto'
    )
    
    estado = models.CharField(
        max_length=20,
        choices=ESTADO_CHOICES,
        default='disponible',
        verbose_name='Estado',
        help_text='Estado actual del producto'
    )
    
    # Campos adicionales útiles
    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['nombre']
        indexes = [
            models.Index(fields=['nombre']),
            models.Index(fields=['estado']),
            models.Index(fields=['linea']),
        ]
    
    def __str__(self):
        return f"{self.codigo} - {self.nombre}"
    
    def get_precio_formateado(self):
        """Retorna el precio formateado en pesos colombianos"""
        return f"${self.precio:,}"
    
    def esta_disponible(self):
        """Verifica si el producto está disponible"""
        return self.estado == 'disponible'
    
    def get_nombre_completo(self):
        """Retorna el nombre completo con presentación"""
        if self.presentacion:
            return f"{self.nombre} - {self.presentacion}"
        return self.nombre