from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction

from .models import MovimientoInventario, DetalleMovimiento
from Proveedores.models import Proveedor
from Productos.models import Producto
from django.db.models import Sum


# @login_required
def inventario_lista(request):

    movimientos = MovimientoInventario.objects.all().order_by('-fecha')

    total_ingresos = movimientos.aggregate(
        total=Sum('precio_total')
    )['total'] or 0

    proveedores = Proveedor.objects.all()
    productos = Producto.objects.all()

    return render(
        request,
        'inventario/inventario.html',
        {
            'movimientos': movimientos,
            'total_ingresos': total_ingresos,
            'proveedores': proveedores,
            'productos': productos,
        }
    )

# @login_required
def crear_movimiento_inventario(request):

    proveedores = Proveedor.objects.all()
    productos = Producto.objects.all()

    if request.method == 'POST':
        try:
            with transaction.atomic():

                proveedor = get_object_or_404(
                    Proveedor,
                    id=request.POST.get('proveedor')
                )

                movimiento = MovimientoInventario.objects.create(
                    proveedor=proveedor,
                    fecha=request.POST.get('fecha'),
                    precio_total=request.POST.get('precio_total'),
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

                    DetalleMovimiento.objects.create(
                        movimiento=movimiento,
                        producto=producto,
                        cantidad=int(cant)
                    )

                messages.success(request, "Inventario registrado correctamente.")
                return redirect('inventario:inventario_vista')

        except Exception as e:
            messages.error(request, f"Error al guardar inventario: {e}")

    return render(
        request,
        'inventario/crear_inventario.html',
        {
            'proveedores': proveedores,
            'productos': productos
        }
    )

    


# @login_required
def editar_movimiento(request, id_movimiento):

    movimiento = get_object_or_404(MovimientoInventario, id=id_movimiento)
    detalles = DetalleMovimiento.objects.filter(movimiento=movimiento)

    if request.method == 'POST':
        try:
            with transaction.atomic():

                detalles.delete()

                movimiento.proveedor_id = request.POST.get('proveedor')
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
                    if not cant:
                        continue

                    DetalleMovimiento.objects.create(
                        movimiento=movimiento,
                        producto_id=prod_id,
                        cantidad=int(cant)
                    )

                messages.success(request, "Inventario actualizado correctamente.")
                return redirect('inventario:inventario_vista')

        except Exception as e:
            messages.error(request, f"Error: {e}")
            return redirect('inventario:inventario_vista')   # ← importante

    
    return redirect('inventario:inventario_vista')


    
@login_required
def eliminar_movimiento(request, id_movimiento):

    movimiento = get_object_or_404(MovimientoInventario, id=id_movimiento)

    if request.method == 'POST':
        DetalleMovimiento.objects.filter(movimiento=movimiento).delete()
        movimiento.delete()

        messages.success(request, "Movimiento eliminado.")
        return redirect('inventario:inventario_vista')



# def exportar_txt(request):