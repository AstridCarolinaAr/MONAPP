from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from .models import Promocion
from .forms import PromocionForm


# ─────────────────────── LISTA ───────────────────────
@login_required
def lista_promociones(request):
    promociones = Promocion.objects.all()
    form = PromocionForm()  # formulario para el modal "Agregar"
    return render(request, 'promociones/lista.html', {
        'promociones': promociones,
        'form': form,
    })


# ─────────────────────── CREAR ───────────────────────
@login_required
def crear_promocion(request):
    if request.method == 'POST':
        form = PromocionForm(request.POST, request.FILES)
        if form.is_valid():
            promocion = form.save()
            messages.success(request, f'Promoción "{promocion.nombre}" creada exitosamente.')
            return redirect('promociones:lista')
        else:
            messages.error(request, 'Corrige los errores del formulario.')
    else:
        form = PromocionForm()

    return render(request, 'promociones/form.html', {
        'form': form,
        'titulo': 'Agregar Promoción',
    })


# ─────────────────────── EDITAR ──────────────────────
@login_required
def editar_promocion(request, pk):
    promocion = get_object_or_404(Promocion, pk=pk)

    if request.method == 'POST':
        form = PromocionForm(request.POST, request.FILES, instance=promocion)
        if form.is_valid():
            form.save()
            messages.success(request, f'Promoción "{promocion.nombre}" actualizada.')
            return redirect('promociones:lista')
        else:
            messages.error(request, 'Corrige los errores del formulario.')
    else:
        form = PromocionForm(instance=promocion)

    return render(request, 'promociones/form.html', {
        'form': form,
        'titulo': 'Editar Promoción',
        'promocion': promocion,
    })


# ─────────────────────── ELIMINAR ────────────────────
@login_required
def eliminar_promocion(request, pk):
    promocion = get_object_or_404(Promocion, pk=pk)

    if request.method == 'POST':
        nombre = promocion.nombre
        promocion.delete()
        messages.success(request, f'Promoción "{nombre}" eliminada.')
        return redirect('promociones:lista')

    return render(request, 'promociones/confirmar_eliminar.html', {
        'promocion': promocion,
    })


# ─────────────────── TOGGLE ESTADO (AJAX) ────────────
@login_required
@require_POST
def toggle_activa(request, pk):
    """Cambia activa/inactiva vía AJAX y devuelve JSON."""
    promocion = get_object_or_404(Promocion, pk=pk)
    promocion.activa = not promocion.activa
    promocion.save(update_fields=['activa'])
    return JsonResponse({
        'ok': True,
        'activa': promocion.activa,
    })
