from django.db import models
from django.core.exceptions import ValidationError
from Proveedores.models import Proveedor
from Productos.models import Producto
from django.contrib.auth.decorators import login_required
from django.conf import settings


class MovimientoInventario(models.Model):

    fecha = models.DateField(auto_now_add=True)
    proveedor = models.ForeignKey(
        Proveedor,
        on_delete=models.PROTECT,
        related_name='movimientos'
    )

    precio_total = models.DecimalField(
        max_digits=12,
        decimal_places=2
    )

    # ===============================
    # DATOS DEL REPARTIDOR
    # ===============================
    nombre_repartidor = models.CharField(max_length=150)
    apellido_repartidor = models.CharField(max_length=150)
    cedula_repartidor = models.CharField(max_length=20)
    telefono_repartidor = models.CharField(max_length=20)

    # ===============================
    # DATOS DEL VEHÍCULO
    # ===============================
    tipo_vehiculo = models.CharField(max_length=100)
    placa_vehiculo = models.CharField(max_length=20)
    usuario = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )
    


    def clean(self):
        if not self.cedula_repartidor.isdigit():
            raise ValidationError({'cedula_repartidor': 'Solo números'})

        if not self.telefono_repartidor.isdigit():
            raise ValidationError({'telefono_repartidor': 'Solo números'})

    def __str__(self):
        return f"Entrada #{self.id} - {self.proveedor.nombre_proveedor}"


# ======================================================
# DETALLE DE PRODUCTOS POR MOVIMIENTO
# ======================================================

class DetalleMovimiento(models.Model):
    movimiento = models.ForeignKey(
        MovimientoInventario,
        on_delete=models.CASCADE,
        related_name="detalles"
    )
    producto = models.ForeignKey(Producto, on_delete=models.CASCADE)
    cantidad = models.IntegerField()


    def clean(self):
        if self.cantidad <= 0:
            raise ValidationError({'cantidad': 'Debe ser mayor que cero'})

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad}"
