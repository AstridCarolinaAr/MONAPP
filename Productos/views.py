from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import Producto
from .forms import ProductoForm
from core.funciones import bloquear_eliminar
from django.db.models import Count

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

    return render(
        request,
        'productos/lista_productos_publica.html',
        {
            'productos': productos,
            'buscar': buscar,
            'orden': orden,
        }
    )


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

    return render(
        request,
        'productos/detalle_producto_publico.html',
        {
            'producto': producto,
            'productos_relacionados': productos_relacionados,
        }
    )


@login_required
def lista_productos_admin(request):

    productos = Producto.objects.select_related("id_marca")

    # =========================
    # FILTRO POR LÍNEA
    # =========================
    linea = request.GET.get("linea")
    if linea:
        productos = productos.filter(linea=linea)

    # =========================
    # BUSCADOR
    # =========================
    q = request.GET.get("q")
    if q:
        productos = productos.filter(
            Q(nombre__icontains=q) |
            Q(codigo__icontains=q) |
            Q(id_marca__nombre__icontains=q) |
            Q(presentacion__icontains=q) |
            Q(estado__icontains=q)
        )

    # =========================
    # ORDENAMIENTO
    # =========================
    orden = request.GET.get("orden")
    if orden == "nombre":
        productos = productos.order_by("nombre")
    elif orden == "nombre_desc":
        productos = productos.order_by("-nombre")
    elif orden == "codigo":
        productos = productos.order_by("codigo")
    elif orden == "marca":
        productos = productos.order_by("id_marca__nombre")
    elif orden == "presentacion":
        productos = productos.order_by("presentacion")
    else:
        productos = productos.order_by("nombre")


    total_productos = productos.count()

    productos_por_linea = (
        Producto.objects
        .values("linea")
        .annotate(total=Count("codigo"))
        .order_by("linea")
    )

    return render(
        request,
        "colaborador/lista_productos.html",
        {
            "productos": productos,
            "total_productos": total_productos,
            "productos_por_linea": productos_por_linea,
            "linea_seleccionada": linea,
        }
    )

@login_required
def crear_producto(request):
    grupos = list(request.user.groups.values_list('name', flat=True))

    if 'Administrador' not in grupos and 'Auxiliar' not in grupos:
        messages.error(request, 'No tienes permisos para crear productos.')
        return redirect('core:index')

    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES)

        if form.is_valid():
            producto = form.save()
            messages.success(
                request,
                f'Producto "{producto.nombre}" creado correctamente.'
            )
            return redirect('productos:lista_productos_admin')

        

    else:
        form = ProductoForm()

    return render(
        request,
        'colaborador/crear_producto.html',
        {
            'titulo': 'Crear Producto',
            'form': form,
        }
    )



@login_required
def editar_producto(request, codigo):
    
    grupos = list(request.user.groups.values_list('name', flat=True))
    if 'Administrador' not in grupos and 'Auxiliar' not in grupos:
        messages.error(request, 'No tienes permisos para editar productos.')
        return redirect('core:index')

    producto = get_object_or_404(Producto, codigo=codigo)

    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES, instance=producto)
        if form.is_valid():
            form.save()
            messages.success(
                request,
                f'Producto "{producto.nombre}" actualizado.'
            )
            return redirect('productos:lista_productos_admin')
    else:
        form = ProductoForm(instance=producto)

    return render(
        request,
        'colaborador/editar_producto.html',
        {
            'titulo': f'Editar Producto: {producto.nombre}',
            'form': form,
            'producto': producto,
        }
    )

@bloquear_eliminar("No tienes permiso para eliminar productos.")
def eliminar_producto(request, codigo):
    producto = get_object_or_404(Producto, codigo=codigo)

    if request.method == "POST":
        producto.delete()
        messages.success(request, "Producto eliminado correctamente.")
        return redirect("productos:lista_productos_admin")

    return render(request, "colaborador/eliminar_producto.html", {
        "producto": producto
    })