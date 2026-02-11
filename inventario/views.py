from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db import transaction

from .models import MovimientoInventario, DetalleMovimiento
from Proveedores.models import Proveedor
from Productos.models import Producto
from django.db.models import Sum
from .models import Stock



# @login_required
def inventario_lista(request):
    
    stock = Stock.objects.select_related('producto').order_by('producto__nombre')
    movimientos = MovimientoInventario.objects.all().order_by('-fecha')

    total_ingresos = movimientos.aggregate(
        total=Sum('precio_total')
    )['total'] or 0

    proveedores = Proveedor.objects.all()
    productos = Producto.objects.all()

    return render(
        request,
        'inventario/compra.html',
        {
            'movimientos': movimientos,
            'total_ingresos': total_ingresos,
            'proveedores': proveedores,
            'productos': productos,
            'stock': stock,
        }
    )

@login_required
def crear_movimiento_inventario(request):

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
                    precio_total=0,   
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
                precios = request.POST.getlist('precio_unitario[]')

                if not productos_ids:
                    raise Exception("Debe agregar al menos un producto.")

                total_general = 0

                for prod_id, cant, precio in zip(productos_ids, cantidades, precios):

                    producto = get_object_or_404(Producto, codigo=prod_id)

                    cant = int(cant)
                    precio = float(precio)

                    subtotal = cant * precio
                    total_general += subtotal

                    # crear detalle correcto
                    DetalleMovimiento.objects.create(
                        movimiento=movimiento,
                        producto=producto,
                        cantidad=cant,
                        precio_unitario=precio
                    )

                    # actualizar stock correctamente
                    stock, _ = Stock.objects.get_or_create(producto=producto)
                    stock.cantidad_actual += cant
                    stock.save()

                # guardar total REAL (no el del frontend)
                movimiento.precio_total = total_general
                movimiento.save()

                messages.success(request, "Inventario registrado correctamente.")
                return redirect('inventario:inventario_vista')

        except Exception as e:
            messages.error(request, f"Error al guardar inventario: {e}")
            return redirect('inventario:inventario_vista')

    
    return redirect('inventario:inventario_vista')


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
            return redirect('inventario:inventario_vista')  

    
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