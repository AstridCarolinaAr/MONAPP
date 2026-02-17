from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from .models import Venta, DetalleVenta
from compras.models import DetalleCompra
from django.contrib import messages
from .forms import VentaForm
from Productos.models import Producto  
from django.core.exceptions import ValidationError
import json
from django.db import transaction
from servicios.models import Servicio  
from personal.models import Personal 
from django.db.models import Sum


def lista_ventas(request):
    q = request.GET.get("q", "").strip()
    estado = request.GET.get("estado")

    ventas = Venta.objects.select_related("cliente").filter(estado="activa")

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
    productos_stock = []

    for p in productos:
        entradas = DetalleCompra.objects.filter(
            producto=p
        ).aggregate(total=Sum("cantidad"))["total"] or 0

        salidas = DetalleVenta.objects.filter(
            producto=p,
            venta__estado='activa'
        ).aggregate(total=Sum("cantidad"))["total"] or 0

        stock_real = entradas - salidas

        productos_stock.append({
            "producto": p,
            "stock": stock_real
        })

    servicios = Servicio.objects.all()
    personal = Personal.objects.all()

    if request.method == 'POST':
        form = VentaForm(request.POST)
        items_json = request.POST.get('items')

        if form.is_valid() and items_json:
            items = json.loads(items_json)

            # ===============================
            # CREAR VENTA
            # ===============================
            venta = form.save(commit=False)
            venta.codigo_colaborador = 'PENDIENTE'
            venta.nombre_colaborador = 'Pendiente'
            venta.save()

            # ===============================
            # DETALLES
            # ===============================
            for item in items:

                # ===== PRODUCTO =====
                if item['tipo'] == 'producto':

                    codigo = item.get('id')

                    # 🔒 Último seguro: si viene vacío o None, lo ignoramos
                    if not codigo:
                        continue

                    producto = Producto.objects.select_for_update().get(
                        codigo=codigo
                    )

                    entradas = DetalleCompra.objects.filter(
                        producto=producto
                    ).aggregate(total=Sum("cantidad"))["total"] or 0

                    salidas = DetalleVenta.objects.filter(
                        producto=producto,
                        venta__estado='activa'
                    ).aggregate(total=Sum("cantidad"))["total"] or 0

                    stock_real = entradas - salidas

                    if item['cantidad'] > stock_real:
                        raise ValidationError(
                            f"Stock insuficiente para {producto.nombre}"
                        )

                    DetalleVenta.objects.create(
                        venta=venta,
                        producto=producto,
                        precio_unitario=item['precio'],
                        cantidad=item['cantidad'],
                        subtotal=item['subtotal']
                    )


                # ===== SERVICIO =====
                elif item['tipo'] == 'servicio':

                    servicio = Servicio.objects.get(
                        id_servicio=item['id_servicio']
                    )

                    colaborador = Personal.objects.get(
                        id=item['id_personal']
                    )

                    DetalleVenta.objects.create(
                        venta=venta,
                        servicio=servicio,
                        colaborador_servicio=colaborador,
                        precio_unitario=item['precio'],
                        cantidad=1,
                        subtotal=item['precio']
                    )

            messages.success(request, 'Venta registrada correctamente.')
            return redirect('ventas:lista')

        messages.error(request, 'No se pudo registrar la venta.')

    else:
        form = VentaForm()

    return render(request, 'ventas/crear_venta.html', {
        'form': form,
        'productos_stock': productos_stock,
        'servicios': servicios,
        'personal': personal,
    })


def editar_venta(request, pk):
    return render(request, "ventas/editar_venta.html")


def detalle_venta(request, venta_id):
    venta = get_object_or_404(Venta, id=venta_id)
    detalles = venta.detalles.all()  # related_name del DetalleVenta

    total = sum(d.subtotal for d in detalles)

    return render(request, 'ventas/detalle_venta.html', {
        'venta': venta,
        'detalles': detalles,
        'total': total,
    })
    
def detalle_venta_modal(request, venta_id):
    venta = get_object_or_404(Venta, id=venta_id)
    detalles = venta.detalles.all()
    total = sum(d.subtotal for d in detalles)

    return render(request, 'ventas/partials/detalle_venta_modal.html', {
        'venta': venta,
        'detalles': detalles,
        'total': total
    })

@transaction.atomic
def anular_venta(request, venta_id):
    venta = get_object_or_404(Venta, id=venta_id)

    if venta.estado == 'anulada':
        return redirect('ventas:lista')

    if request.method == "POST":
        venta.estado = 'anulada'
        venta.save()

    return redirect('ventas:lista')



def clean(self):
    if self.cantidad <= 0:
        raise ValidationError("La cantidad debe ser mayor a 0")

    if self.precio_unitario <= 0:
        raise ValidationError("El precio debe ser mayor a 0")
