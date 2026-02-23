from django.db import models
from django.core.validators import MinValueValidator

class Producto(models.Model):
    """Modelo para gestionar productos del inventario"""
    nombre = models.CharField(
        max_length=100,
        verbose_name="Nombre del Producto",
        help_text="Ingrese el nombre del producto"
    )
    descripcion = models.TextField(
        verbose_name="Descripción",
        help_text="Proporcione una descripción detallada del producto"
    )
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Precio (COP)",
        validators=[MinValueValidator(0.01)],
        help_text="Precio en pesos colombianos"
    )
    stock = models.IntegerField(
        verbose_name="Cantidad en Stock",
        validators=[MinValueValidator(0)],
        help_text="Cantidad disponible en inventario"
    )
    imagen = models.ImageField(
        upload_to='productos/',
        null=True,
        blank=True,
        verbose_name="Imagen del Producto",
        help_text="Opcional: Cargue una imagen representativa"
    )
    creado_en = models.DateTimeField(auto_now_add=True, verbose_name="Creado en")
    actualizado_en = models.DateTimeField(auto_now=True, verbose_name="Actualizado en")

    class Meta:
        verbose_name = "Producto"
        verbose_name_plural = "Productos"
        ordering = ['-actualizado_en']

    def __str__(self):
        return f"{self.nombre} - ${self.precio:,.2f}"

    @property
    def estado_stock(self):
        if self.stock <= 0:
            return "Sin stock"
        elif self.stock <= 5:
            return "Stock bajo"
        else:
            return "En stock"


class Promocion(models.Model):
    """Modelo para gestionar promociones y descuentos"""
    titulo = models.CharField(
        max_length=100,
        verbose_name="Título de la Promoción",
        help_text="Nombre descriptivo de la promoción"
    )
    descripcion = models.TextField(
        verbose_name="Descripción",
        help_text="Explique los detalles de la promoción"
    )
    descuento = models.IntegerField(
        verbose_name="Porcentaje de Descuento",
        validators=[MinValueValidator(1)],
        help_text="Ingrese un número entre 1 y 100"
    )
    fecha_inicio = models.DateField(
        verbose_name="Fecha de Inicio"
    )
    fecha_fin = models.DateField(
        verbose_name="Fecha de Finalización"
    )
    creado_en = models.DateTimeField(auto_now_add=True, verbose_name="Creado en")
    actualizado_en = models.DateTimeField(auto_now=True, verbose_name="Actualizado en")

    class Meta:
        verbose_name = "Promoción"
        verbose_name_plural = "Promociones"
        ordering = ['-fecha_inicio']

    def __str__(self):
        return f"{self.titulo} ({self.descuento}% OFF)"

    @property
    def esta_activa(self):
        from django.utils import timezone
        hoy = timezone.now().date()
        return self.fecha_inicio <= hoy <= self.fecha_fin


class Servicio(models.Model):
    """Modelo para gestionar servicios ofrecidos"""
    nombre = models.CharField(
        max_length=100,
        verbose_name="Nombre del Servicio",
        help_text="Ingrese el nombre del servicio"
    )
    descripcion = models.TextField(
        verbose_name="Descripción",
        help_text="Describe qué incluye y en qué consiste el servicio"
    )
    precio_base = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        verbose_name="Precio Base (COP)",
        validators=[MinValueValidator(0.01)],
        help_text="Precio base en pesos colombianos"
    )
    duracion_estimada = models.CharField(
        max_length=50,
        verbose_name="Duración Estimada",
        help_text="Ej: 2 horas, 3 días, 1 semana"
    )
    creado_en = models.DateTimeField(auto_now_add=True, verbose_name="Creado en")
    actualizado_en = models.DateTimeField(auto_now=True, verbose_name="Actualizado en")

    class Meta:
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"
        ordering = ['-actualizado_en']

    def __str__(self):
        return f"{self.nombre} - ${self.precio_base:,.2f}"