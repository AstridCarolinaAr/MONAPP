from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.db.models import Q
from .models import Producto, Marca
from .forms import ProductoForm, MarcaForm


# ==================== FUNCIÓN AUXILIAR ====================
def es_staff(user):
    return user.is_staff


# ==================== VISTAS PÚBLICAS ====================

def lista_productos_publica(request):
    productos = Producto.objects.filter(estado='disponible')

    buscar = request.GET.get('buscar', '')
    if buscar:
        productos = productos.filter(
            Q(nombre__icontains=buscar) |
            Q(descripcion__icontains=buscar) |
            Q(linea__icontains=buscar)
        )

    orden = request.GET.get('orden', 'reciente')
    if orden == 'reciente':
        productos = productos.order_by('-fecha_creacion')
    elif orden == 'precio_asc':
        productos = productos.order_by('precio')
    elif orden == 'precio_desc':
        productos = productos.order_by('-precio')
    elif orden == 'nombre':
        productos = productos.order_by('nombre')

    context = {
        'productos': productos,
        'buscar': buscar,
        'orden': orden,
    }
    return render(request, 'productos/lista_productos_publica.html', context)


def detalle_producto_publico(request, codigo):
    producto = get_object_or_404(
        Producto,
        codigo=codigo,
        estado='disponible'
    )

    productos_relacionados = Producto.objects.filter(
        linea=producto.linea,
        estado='disponible'
    ).exclude(codigo=producto.codigo)[:4]

    context = {
        'producto': producto,
        'productos_relacionados': productos_relacionados,
    }
    return render(request, 'productos/detalle_producto_publico.html', context)


# ==================== PANEL ADMIN ====================

@login_required
@user_passes_test(es_staff, login_url='usuarios:login')
def lista_productos_admin(request):
    productos = Producto.objects.select_related('id_marca').all()

    buscar = request.GET.get('buscar', '')
    if buscar:
        productos = productos.filter(
            Q(nombre__icontains=buscar) |
            Q(descripcion__icontains=buscar)
        )

    estado = request.GET.get('estado')
    if estado:
        productos = productos.filter(estado=estado)

    orden = request.GET.get('orden', 'reciente')
    if orden == 'reciente':
        productos = productos.order_by('-fecha_creacion')
    elif orden == 'precio_asc':
        productos = productos.order_by('precio')
    elif orden == 'precio_desc':
        productos = productos.order_by('-precio')
    elif orden == 'nombre':
        productos = productos.order_by('nombre')

    context = {
        'titulo': 'Gestión de Productos',
        'productos': productos,
        'buscar': buscar,
        'estado': estado,
        'orden': orden,
    }
    return render(request, 'productos/panel_admin_base/lista_productos.html', context)


@login_required
@user_passes_test(es_staff, login_url='usuarios:login')
def crear_producto(request):
    if request.method == 'POST':
        form = ProductoForm(request.POST)
        if form.is_valid():
            producto = form.save()
            messages.success(
                request,
                f'Producto "{producto.nombre}" creado correctamente.'
            )
            return redirect('productos:lista_productos_admin')
        else:
            messages.error(request, 'Corrige los errores del formulario.')
    else:
        form = ProductoForm()

    context = {
        'titulo': 'Crear Producto',
        'form': form,
        'accion': 'Crear'
    }
    return render(request, 'productos/panel_admin/crear_producto.html', context)


@login_required
@user_passes_test(es_staff, login_url='usuarios:login')
def editar_producto(request, codigo):
    producto = get_object_or_404(Producto, codigo=codigo)

    if request.method == 'POST':
        form = ProductoForm(request.POST, instance=producto)
        if form.is_valid():
            form.save()
            messages.success(
                request,
                f'Producto "{producto.nombre}" actualizado.'
            )
            return redirect('productos:lista_productos_admin')
        else:
            messages.error(request, 'Corrige los errores del formulario.')
    else:
        form = ProductoForm(instance=producto)

    context = {
        'titulo': f'Editar Producto: {producto.nombre}',
        'form': form,
        'producto': producto,
        'accion': 'Actualizar'
    }
    return render(request, 'productos/panel_admin/editar_producto.html', context)


@login_required
@user_passes_test(es_staff, login_url='usuarios:login')
def eliminar_producto(request, codigo):
    producto = get_object_or_404(Producto, codigo=codigo)

    if request.method == 'POST':
        nombre = producto.nombre
        producto.delete()
        messages.success(
            request,
            f'Producto "{nombre}" eliminado.'
        )
        return redirect('productos:lista_productos_admin')

    context = {
        'titulo': 'Eliminar Producto',
        'producto': producto
    }
    return render(request, 'productos/panel_admin/eliminar_producto.html', context)
