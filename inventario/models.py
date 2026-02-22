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