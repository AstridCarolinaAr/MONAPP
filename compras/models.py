from django.db import models
from django.core.exceptions import ValidationError
from django.conf import settings
from Proveedores.models import Proveedor
from Productos.models import Producto


class Compra(models.Model):
    fecha = models.DateField(auto_now_add=True)

    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name="compras"
    )

    precio_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)

  
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )


    def __str__(self):
        return f"Compra #{self.id} - {self.proveedor.nombre_proveedor}"


class DetalleCompra(models.Model):
    compra = models.ForeignKey(
        Compra,
        on_delete=models.PROTECT,
        related_name="detalles"
    )

    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT,
        related_name="detalles_compra"
    )

    cantidad = models.IntegerField()
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    def clean(self):
        if self.cantidad <= 0:
            raise ValidationError({"cantidad": "Debe ser mayor que cero"})

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad}"