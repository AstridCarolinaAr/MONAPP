from django.db import models
from Productos.models import Producto
from Proveedores.models import Proveedor

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
    precio_unitario = models.DecimalField(max_digits=10, decimal_places=2)

    

    def clean(self):
        if self.cantidad <= 0:
            raise ValidationError({'cantidad': 'Debe ser mayor que cero'})

    def __str__(self):
        return f"{self.producto.nombre} x {self.cantidad}"
    
    
class Stock(models.Model):
    producto=models.OneToOneField(Producto,on_delete=models.CASCADE,
    related_name='stock'
    )
    cantidad_actual=models.IntegerField(default=0)
    actualizado_en=models.DateTimeField(auto_now=True)
    
    def __str__(self):
     return f"{self.producto.nombre} - {self.cantidad_actual}"
