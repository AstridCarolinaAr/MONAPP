from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import ProductoWeb
from .forms import ProductoWebForm


# ─────────────────────── LISTA ───────────────────────
@login_required
def lista_productos_web(request):
    productos = ProductoWeb.objects.all()
    form = ProductoWebForm()                       # formulario para el modal "Agregar"
    return render(request, 'productos_web/lista.html', {
        'productos': productos,
        'form': form,
    })


# ─────────────────────── CREAR ───────────────────────
@login_required
def crear_producto_web(request):
    if request.method == 'POST':
        form = ProductoWebForm(request.POST, request.FILES)
        if form.is_valid():
            producto = form.save()
            messages.success(request, f'Producto "{producto.nombre}" creado exitosamente.')
            return redirect('productos_web:lista')
        else:
            messages.error(request, 'Corrige los errores del formulario.')
    else:
        form = ProductoWebForm()

    return render(request, 'productos_web/form.html', {
        'form': form,
        'titulo': 'Agregar Producto Web',
    })


# ─────────────────────── EDITAR ──────────────────────
@login_required
def editar_producto_web(request, pk):
    producto = get_object_or_404(ProductoWeb, pk=pk)

    if request.method == 'POST':
        form = ProductoWebForm(request.POST, request.FILES, instance=producto)
        if form.is_valid():
            form.save()
            messages.success(request, f'Producto "{producto.nombre}" actualizado.')
            return redirect('productos_web:lista')
        else:
            messages.error(request, 'Corrige los errores del formulario.')
    else:
        form = ProductoWebForm(instance=producto)

    return render(request, 'productos_web/form.html', {
        'form': form,
        'titulo': 'Editar Producto Web',
        'producto': producto,
    })


# ─────────────────────── ELIMINAR ────────────────────
@login_required
def eliminar_producto_web(request, pk):
    producto = get_object_or_404(ProductoWeb, pk=pk)

    if request.method == 'POST':
        nombre = producto.nombre
        producto.delete()
        messages.success(request, f'Producto "{nombre}" eliminado del catálogo web.')
        return redirect('productos_web:lista')

    return render(request, 'productos_web/confirmar_eliminar.html', {
        'producto': producto,
    })


# ─────────────────── TOGGLE VISIBILIDAD (AJAX) ──────
@login_required
@require_POST
def toggle_visible(request, pk):
    """Cambia visible/oculto vía AJAX y devuelve JSON."""
    producto = get_object_or_404(ProductoWeb, pk=pk)
    producto.visible = not producto.visible
    producto.save(update_fields=['visible'])
    return JsonResponse({
        'ok': True,
        'visible': producto.visible,
    })
