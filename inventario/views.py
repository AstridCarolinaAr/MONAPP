from django.shortcuts import render
from .models import Stock
from Proveedores.models import Proveedor
from Productos.models import Producto
from django.db.models import Sum
from .models import Stock

def inventario_lista(request):
    stock = Stock.objects.select_related('producto').all()

    return render(request, 'inventario/inventario.html', {
        'stock': stock,
    })
