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
    
    ultima_entrada_fecha = models.DateField(null=True, blank=True)
    ultima_entrada_cantidad = models.IntegerField(default=0)
    ultima_entrada_precio = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    ultimo_proveedor= models.ForeignKey(Proveedor,null=True, blank=True,on_delete=models.SET_NULL)
    
    def __str__(self):
        return f"{self.producto.nombre} - {self.cantidad_actual}"