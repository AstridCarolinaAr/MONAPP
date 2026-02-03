from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from .models import Venta
from django.contrib import messages
from .forms import VentaForm
from Productos.models import Producto  
from django.core.exceptions import ValidationError
import json
from django.db import transaction

from .models import  DetalleVenta


def lista_ventas(request):
    q = request.GET.get("q", "").strip()
    estado = request.GET.get("estado")

    ventas = Venta.objects.select_related("cliente")

    if q:
        ventas = ventas.filter(
            Q(codigo_venta__icontains=q)
            | Q(cliente__nombre__icontains=q)
            | Q(cliente__apellido__icontains=q)
        )

    if estado:
        ventas = ventas.filter(estado=estado)

    return render(
        request,
        "ventas/lista_ventas.html",
        {
            "ventas": ventas,
            "q": q,
            "estado": estado,
        },
    )


@transaction.atomic
def crear_venta(request):
    productos = Producto.objects.all()

    if request.method == 'POST':
        form = VentaForm(request.POST)
        items_json = request.POST.get('items')

        if form.is_valid() and items_json:
            items = json.loads(items_json)

            venta = form.save(commit=False)

            # Placeholder colaborador
            venta.codigo_colaborador = 'PENDIENTE'
            venta.nombre_colaborador = 'Pendiente'
            venta.save()

            for item in items:
                producto = Producto.objects.select_for_update().get(
                    codigo=item['codigo']
                )

                if item['cantidad'] > producto.cantidad:
                    raise ValueError("Stock insuficiente")

                DetalleVenta.objects.create(
                    venta=venta,
                    producto=producto,
                    precio_unitario=item['precio'],
                    cantidad=item['cantidad'],
                    subtotal=item['subtotal']
                )

                producto.cantidad -= item['cantidad']
                producto.save()

            messages.success(request, 'Venta registrada correctamente.')
            return redirect('ventas:lista')

        messages.error(request, 'No se pudo registrar la venta.')

    else:
        form = VentaForm()

    return render(request, 'ventas/crear_venta.html', {
        'form': form,
        'productos': productos
    })



def editar_venta(request, pk):
    return render(request, "ventas/editar_venta.html")


def detalle_venta(request, pk):
    return render(request, "ventas/detalle_venta.html")


def clean(self):
    if self.cantidad <= 0:
        raise ValidationError("La cantidad debe ser mayor a 0")

    if self.precio_unitario <= 0:
        raise ValidationError("El precio debe ser mayor a 0")
