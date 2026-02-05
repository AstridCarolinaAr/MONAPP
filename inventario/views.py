from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction

from .models import MovimientoInventario, DetalleMovimiento
from Proveedores.models import Proveedor
from Productos.models import Producto


@login_required
def inventario_vista(request):

    proveedores = Proveedor.objects.all()
    productos = Producto.objects.all()
    movimientos = MovimientoInventario.objects.all().order_by('-fecha')

    if request.method == 'POST':
        try:
            with transaction.atomic():

                proveedor = get_object_or_404(
                    Proveedor,
                    id=request.POST.get('proveedor')
                )

                fecha = request.POST.get('fecha')
                precio_total = request.POST.get('precio_total')

                movimiento = MovimientoInventario.objects.create(
                    proveedor=proveedor,
                    fecha=fecha,
                    precio_total=precio_total,
                    usuario=request.user,
                    nombre_repartidor=request.POST.get('nombre_repartidor'),
                    apellido_repartidor=request.POST.get('apellido_repartidor'),
                    cedula_repartidor=request.POST.get('cedula_repartidor'),
                    telefono_repartidor=request.POST.get('telefono_repartidor'),
                    placa_vehiculo=request.POST.get('placa_vehiculo'),
                    tipo_vehiculo=request.POST.get('tipo_vehiculo'),
                )

                productos_ids = request.POST.getlist('producto[]')
                cantidades = request.POST.getlist('cantidad[]')

                if not productos_ids:
                    raise Exception("Debe agregar al menos un producto.")

                for prod_id, cant in zip(productos_ids, cantidades):
                    producto = get_object_or_404(Producto, codigo=prod_id)
                    cantidad = int(cant)

                    DetalleMovimiento.objects.create(
                        movimiento=movimiento,
                        producto=producto,
                        cantidad=cantidad
                    )

                    # sumar stock
                    producto.cantidad += cantidad
                    producto.save()

                messages.success(request, "Inventario registrado correctamente.")
                return redirect('inventario:inventario_vista')

        except Exception as e:
            messages.error(request, f"Error al guardar inventario: {e}")

    return render(request, 'inventario/inventario.html', {
        'proveedores': proveedores,
        'productos': productos,
        'movimientos': movimientos
    })


@login_required
def editar_movimiento(request, id_movimiento):

    movimiento = get_object_or_404(MovimientoInventario, id=id_movimiento)
    detalles = DetalleMovimiento.objects.filter(movimiento=movimiento)

    proveedores = Proveedor.objects.all()
    productos = Producto.objects.all()

    if request.method == 'POST':
        try:
            with transaction.atomic():

                # DEVOLVER STOCK ANTERIOR
                for d in detalles:
                    producto = d.producto
                    producto.cantidad -= d.cantidad
                    producto.save()

                detalles.delete()

                movimiento.proveedor = get_object_or_404(
                    Proveedor,
                    id=request.POST.get('proveedor')
                )
                movimiento.fecha = request.POST.get('fecha')
                movimiento.precio_total = request.POST.get('precio_total')

                movimiento.nombre_repartidor = request.POST.get('nombre_repartidor')
                movimiento.apellido_repartidor = request.POST.get('apellido_repartidor')
                movimiento.cedula_repartidor = request.POST.get('cedula_repartidor')
                movimiento.telefono_repartidor = request.POST.get('telefono_repartidor')
                movimiento.placa_vehiculo = request.POST.get('placa_vehiculo')
                movimiento.tipo_vehiculo = request.POST.get('tipo_vehiculo')
                movimiento.save()

                productos_ids = request.POST.getlist('producto[]')
                cantidades = request.POST.getlist('cantidad[]')

                for prod_id, cant in zip(productos_ids, cantidades):
                    producto = get_object_or_404(Producto, codigo=prod_id)
                    cantidad = int(cant)

                    DetalleMovimiento.objects.create(
                        movimiento=movimiento,
                        producto=producto,
                        cantidad=cantidad
                    )

                    producto.cantidad += cantidad
                    producto.save()

                messages.success(request, "Inventario actualizado correctamente.")
                return redirect('inventario:inventario_vista')

        except Exception as e:
            messages.error(request, f"Error al actualizar inventario: {e}")

    return render(request, 'inventario/editar_inventario.html', {
        'movimiento': movimiento,
        'detalles': detalles,
        'proveedores': proveedores,
        'productos': productos
    })

# def exportar_txt(request):