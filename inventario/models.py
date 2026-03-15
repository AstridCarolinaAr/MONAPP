from django.db import models
from django.conf import settings
from Productos.models import Producto


class Stock(models.Model):
    producto = models.OneToOneField(
        Producto,
        on_delete=models.CASCADE,
        related_name='stock'
    )
    cantidad_actual = models.IntegerField(default=0)
    actualizado_en = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.producto.nombre} - {self.cantidad_actual}"


class MovimientoStock(models.Model):
    TIPO_CHOICES = (
        ("COMPRA_ENTRADA", "Compra entrada"),
        ("COMPRA_EDICION", "Compra edición"),
        ("COMPRA_ANULACION", "Compra anulación"),
        ("DEV_COMPRA_SALIDA", "Devolución compra salida"),
        ("DEV_COMPRA_ANULACION", "Devolución compra anulación"),
        ("AJUSTE_MANUAL", "Ajuste manual"),
    )

    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name="movimientos_stock"
    )

    stock = models.ForeignKey(
        Stock,
        on_delete=models.PROTECT,
        related_name="movimientos"
    )

    tipo_movimiento = models.CharField(max_length=30, choices=TIPO_CHOICES)
    cantidad = models.IntegerField()
    stock_anterior = models.IntegerField()
    stock_posterior = models.IntegerField()

    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movimientos_stock"
    )

    compra = models.ForeignKey(
        "compras.Compra",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movimientos_stock"
    )

    devolucion = models.ForeignKey(
        "compras.DevolucionCompra",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="movimientos_stock"
    )

    observacion = models.TextField(blank=True)
    creado_en = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Movimiento de stock"
        verbose_name_plural = "Movimientos de stock"
        ordering = ["-creado_en", "-id"]
        indexes = [
            models.Index(fields=["producto", "creado_en"]),
            models.Index(fields=["tipo_movimiento", "creado_en"]),
        ]

    def __str__(self):
        signo = "+" if self.cantidad >= 0 else ""
        return f"{self.producto.nombre} | {self.tipo_movimiento} | {signo}{self.cantidad}"