from django.db.models.signals import post_save,post_delete
from django.dispatch import receiver
from django.db.models import Sum
from compras.models import Compra,DetalleCompra
from inventario.models import Stock



def  recalcular_stock(producto):
    stock,_=Stock.objects.get_or_create(producto=producto)
    
    total=DetalleCompra.objectsfilter(produto=producto).aggregate(t=Sum("cantidad"))["t"] or 0
    stock.cantidad_actual =total
    stock.save()

@receiver(post_save,sender=Compra)
def actualizar_stock_guardar_detalle(sender,instance,**kwargs):
    recalcular_stock(instance.producto)

@receiver(post_delete,sender=Compra)
def actualizar_stock_eliminar_detalle(sender,instance,**kwargs):
    recalcular_stock(instance.producto)