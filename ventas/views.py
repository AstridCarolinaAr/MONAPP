from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from .models import Venta
from django.contrib import messages
from .forms import VentaForm
from Productos.models import Producto  # ajusta si el nombre cambia
from django.core.exceptions import ValidationError

def lista_ventas(request):
    q = request.GET.get('q', '').strip()
    estado = request.GET.get('estado')

    ventas = Venta.objects.select_related('cliente')

    if q:
        ventas = ventas.filter(
            Q(codigo_venta__icontains=q) |
            Q(cliente__nombre__icontains=q) |
            Q(cliente__apellido__icontains=q)
        )

    if estado:
        ventas = ventas.filter(estado=estado)

    return render(request, 'ventas/lista_ventas.html', {
        'ventas': ventas,
        'q': q,
        'estado': estado,
    })


def crear_venta(request):
    productos = Producto.objects.all()

    if request.method == 'POST':
        form = VentaForm(request.POST)

        if form.is_valid():
            venta = form.save(commit=False)

            # 🔒 Precio viene del producto (NO del formulario)
            producto = Producto.objects.get(id=request.POST.get('producto'))
            venta.precio_unitario = producto.precio

            # 🧮 Subtotal automático
            venta.subtotal = venta.precio_unitario * venta.cantidad

            # 🧑‍💼 Colaborador (placeholder por ahora)
            venta.codigo_colaborador = 'PENDIENTE'
            venta.nombre_colaborador = 'Pendiente'

            venta.save()
            messages.success(request, 'Venta registrada correctamente.')
            return redirect('ventas:lista')
    else:
        form = VentaForm()

    return render(request, 'ventas/crear_venta.html', {
        'form': form,
        'productos': productos
    })

def editar_venta(request, pk):
    return render(request, 'ventas/editar_venta.html')


def detalle_venta(request, pk):
    return render(request, 'ventas/detalle_venta.html')

def clean(self):
    if self.cantidad <= 0:
        raise ValidationError("La cantidad debe ser mayor a 0")

    if self.precio_unitario <= 0:
        raise ValidationError("El precio debe ser mayor a 0")
