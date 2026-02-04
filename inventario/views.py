from django.shortcuts import render, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from .models import MovimientoInventario, DetalleMovimiento
from Proveedores.models import Proveedor
from Productos.models import Producto
from django.db import transaction


@login_required
def inventario_vista(request):

    proveedores = Proveedor.objects.all()
    productos = Producto.objects.all()
    movimientos = MovimientoInventario.objects.all().order_by('-fecha')

    if request.method == 'POST':
        try:
            with transaction.atomic():

                proveedor = Proveedor.objects.get(id=request.POST['proveedor'])
                fecha = request.POST['fecha']
                precio_total = request.POST['precio_total']

                movimiento = MovimientoInventario.objects.create(
                    proveedor=proveedor,
                    fecha=fecha,
                    precio_total=precio_total,
                    usuario=request.user
                )

                productos_ids = request.POST.getlist('producto[]')
                cantidades = request.POST.getlist('cantidad[]')

                for prod_id, cant in zip(productos_ids, cantidades):
                    producto = Producto.objects.get(codigo=prod_id)

                    DetalleMovimiento.objects.create(
                        movimiento=movimiento,
                        producto=producto,
                        cantidad=int(cant)
                    )

                    #  SUMAR STOCK AUTOMÁTICAMENTE
                    producto.cantidad += int(cant)
                    producto.save()

                # DATOS REPARTIDOR + VEHÍCULO
                movimiento.nombre_repartidor = request.POST['nombre_repartidor']
                movimiento.apellido_repartidor = request.POST['apellido_repartidor']
                movimiento.cedula_repartidor = request.POST['cedula_repartidor']
                movimiento.telefono_repartidor = request.POST['telefono_repartidor']
                movimiento.placa_vehiculo = request.POST['placa_vehiculo']
                movimiento.tipo_vehiculo = request.POST['tipo_vehiculo']
                movimiento.save()

                messages.success(request, "Inventario registrado correctamente.")

                return redirect('inventario:inventario_vista')

        except Exception as e:
            messages.error(request, f"Error al guardar inventario: {e}")

    return render(request, 'inventario/inventario.html', {
        'proveedores': proveedores,
        'productos': productos,
        'movimientos': movimientos
    })
