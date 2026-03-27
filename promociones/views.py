from django.shortcuts import render, get_object_or_404, redirect
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from django.views.decorators.http import require_POST

from .models import Promocion
from .forms import PromocionForm


@login_required
def lista_promociones(request):
    promociones = Promocion.objects.all()

    q = request.GET.get('q', '').strip()
    activa_filter = request.GET.get('activa', '').strip()
    orden = request.GET.get('orden', '').strip()

    if q:
        promociones = promociones.filter(nombre__icontains=q)

    if activa_filter == 'si':
        promociones = promociones.filter(activa=True)
    elif activa_filter == 'no':
        promociones = promociones.filter(activa=False)

    orden_map = {
        'nombre_asc': 'nombre',
        'nombre_desc': '-nombre',
        'desc_asc': 'porcentaje_descuento',
        'desc_desc': '-porcentaje_descuento',
        'fecha_asc': 'fecha_inicio',
        'fecha_desc': '-fecha_inicio',
    }
    if orden in orden_map:
        promociones = promociones.order_by(orden_map[orden])

    form = PromocionForm()
    context = {
        'promociones': promociones,
        'form': form,
        'q': q,
        'activa_filter': activa_filter,
        'orden': orden,
    }

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return render(request, 'promociones/_lista_partial.html', context)

    return render(request, 'promociones/lista.html', context)


@login_required
def validar_nombre_promocion(request):
    nombre = (request.GET.get('nombre') or '').strip()
    promocion_id = (request.GET.get('promocion_id') or '').strip()

    if not nombre:
        return JsonResponse({
            'valid': False,
            'message': 'El nombre de la promocion es obligatorio.',
        })

    qs = Promocion.objects.filter(nombre__iexact=nombre)
    if promocion_id:
        qs = qs.exclude(pk=promocion_id)

    if qs.exists():
        return JsonResponse({
            'valid': False,
            'message': 'Ya existe una promocion con este nombre.',
        })

    return JsonResponse({
        'valid': True,
        'message': '',
    })


@login_required
def crear_promocion(request):
    if request.method == 'POST':
        form = PromocionForm(request.POST, request.FILES)
        if form.is_valid():
            promocion = form.save()
            messages.success(request, f'Promoción "{promocion.nombre}" creada exitosamente.')
            return redirect('promociones:lista')
        messages.error(request, 'Corrige los errores del formulario.')
    else:
        form = PromocionForm()

    return render(request, 'promociones/form.html', {
        'form': form,
        'titulo': 'Agregar Promoción',
        'promocion': None,
    })


@login_required
def editar_promocion(request, pk):
    promocion = get_object_or_404(Promocion, pk=pk)

    if request.method == 'POST':
        form = PromocionForm(request.POST, request.FILES, instance=promocion)
        if form.is_valid():
            form.save()
            messages.success(request, f'Promoción "{promocion.nombre}" actualizada.')
            return redirect('promociones:lista')
        messages.error(request, 'Corrige los errores del formulario.')
    else:
        form = PromocionForm(instance=promocion)

    return render(request, 'promociones/form.html', {
        'form': form,
        'titulo': f'Editar Promoción: {promocion.nombre}',
        'promocion': promocion,
    })


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
