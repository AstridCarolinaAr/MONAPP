from django.db import models
from django.utils.timezone import now
from clientes.models import Cliente
from Productos.models import Producto


class Venta(models.Model):

    # ===============================
    # IDENTIFICACIÓN
    # ===============================
    codigo_venta = models.CharField(
        max_length=10,
        unique=True,
        editable=False
    )

    # ===============================
    # RELACIONES
    # ===============================
    cliente = models.ForeignKey(
        Cliente,
        on_delete=models.PROTECT,
        related_name='ventas'
    )

    # ===============================
    # PRODUCTO / SERVICIO
    # ===============================
    codigo_producto = models.CharField(
        max_length=50,
        verbose_name="Código producto / servicio"
    )

    precio_unitario = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        verbose_name="Precio unitario"
    )

    cantidad = models.PositiveIntegerField(
        verbose_name="Cantidad"
    )

    subtotal = models.DecimalField(
        max_digits=14,
        decimal_places=2,
        editable=False
    )

    # ===============================
    # COLABORADOR
    # ===============================
    codigo_colaborador = models.CharField(
        max_length=20,
        verbose_name="Código colaborador"
    )

    nombre_colaborador = models.CharField(
        max_length=150,
        verbose_name="Nombre colaborador"
    )

    # ===============================
    # FECHA
    # ===============================
    fecha = models.DateTimeField(default=now)

    # ===============================
    # META
    # ===============================
    class Meta:
        verbose_name = "Venta"
        verbose_name_plural = "Ventas"
        ordering = ['-fecha']

    # ===============================
    # LÓGICA AUTOMÁTICA
    # ===============================
    def save(self, *args, **kwargs):
        # Código automático
        if not self.codigo_venta:
            ultima = Venta.objects.order_by('-id').first()
            if ultima:
                numero = int(ultima.codigo_venta.replace('V', '')) + 1
            else:
                numero = 1
            self.codigo_venta = f"V{numero:05d}"

        # Subtotal automático
        self.subtotal = self.precio_unitario * self.cantidad

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo_venta} - {self.cliente}"
    
class DetalleVenta(models.Model):
    venta = models.ForeignKey(
        'Venta',
        on_delete=models.CASCADE,
        related_name='detalles'
    )
    producto = models.ForeignKey(
        Producto,
        on_delete=models.PROTECT
    )
    precio_unitario = models.DecimalField(max_digits=12, decimal_places=2)
    cantidad = models.PositiveIntegerField()
    subtotal = models.DecimalField(max_digits=14, decimal_places=2)

    def __str__(self):
        return f"{self.producto} x {self.cantidad}"


