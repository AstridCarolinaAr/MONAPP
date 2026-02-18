from django.db.models.signals import post_save,post_delete
from django.dispatch import receiver
from django.db.models import Sum
from compras.models import Compra,DetalleCompra
from inventario.models import Stock



def  recalcular_stock(producto):
    stock,_=Stock.objects.get_or_create(producto=producto)
    
    total=producto.detalles_compra.aggregate(Sum('cantidad'))['t'] or 0
    stock.cantidad_actual =total
    
    
    ultimo=(
        producto.detalle_compra
        .select_related("compra_proveedor")
        .order_by("-compra_proveedor__fecha")
        .first()
    )
    
    if ultimo: 
        stock.ultima_entrada_fecha=ultimo.compra_proveedor.fecha
        stock.ultima_entrada_cantidad=ultimo.cantidad
        stock.ultimo_precio_unitario=ultimo.precio_unitario
        stock.ultimo_proveedor=ultimo.compra_proveedor
    stock.save()
@receiver(post_save,sender=Compra)
def compra_post_save(sender,instance,created,*args,**kwargs):
    if created:
        for detalle in instance.detalles.all():
            recalcular_stock(detalle.producto)

@receiver(post_delete,sender=Compra)
def compra_post_delete(sender,instance,*args,**kwargs):
    for detalle in instance.detalles.all():
        recalcular_stock(detalle.producto)