from django.shortcuts import render
from .models import Stock

def inventario_lista(request):
    stock = Stock.objects.select_related('producto').all()

    return render(request, 'inventario/inventario.html', {
        'stock': stock,
    })