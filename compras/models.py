from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _
from Proveedores.models import Proveedor
from Productos.models import Producto
from django.conf import settings

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
        super().clean()

        if self.cantidad is None or self.precio_unitario is None or self.producto_id is None:
            return

        if self.cantidad <= 0:
            raise ValidationError({"cantidad": _("La cantidad debe ser mayor que 0.")})

        if self.precio_unitario <= 0:
            raise ValidationError({"precio_unitario": _("El precio unitario debe ser mayor que 0.")})

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad}"