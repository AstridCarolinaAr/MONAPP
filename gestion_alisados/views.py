from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.db.models import Q

from .models import GestionAlisado
from .forms import GestionAlisadoForm
from clientes.models import Cliente


def es_staff(user):
    return user.is_staff


@login_required
def form_gestion_alisado_modal_content(request):
    """
    Retorna SOLO el contenido del formulario para ser cargado dentro de un modal por fetch().
    Recibe cliente por querystring: ?cliente=<id>
    """
    cliente_id = (request.GET.get("cliente") or "").strip()
    cliente_obj = None

    if cliente_id:
        try:
            cliente_obj = Cliente.objects.get(id=int(cliente_id))
        except (ValueError, Cliente.DoesNotExist):
            cliente_obj = None

    # Si encontramos cliente, precargarlo
    if cliente_obj:
        form = GestionAlisadoForm(initial={"cliente": cliente_obj})
    else:
        form = GestionAlisadoForm()

    context = {
        "form": form,
        "is_modal": True,
        "cliente_preseleccionado": cliente_obj,
    }
    return render(request, "gestion_alisados/form_gestion_alisado_modal_content.html", context)


@login_required
def lista_gestion_alisados(request):
    """Lista todas las gestiones de alisados registradas con filtros de búsqueda"""
    gestiones = GestionAlisado.objects.all()

    # Filtro de búsqueda general
    buscar = request.GET.get('buscar', '')
    if buscar:
        gestiones = gestiones.filter(
            Q(cliente__nombre__icontains=buscar) |
            Q(cliente__apellido__icontains=buscar) |
            Q(procedimiento_realizado_por__icontains=buscar) |
            Q(tipo_alisado__icontains=buscar)
        )

    # Filtro por forma natural del cabello
    forma_natural = request.GET.get('forma_natural', '')
    if forma_natural:
        gestiones = gestiones.filter(forma_natural=forma_natural)

    # Filtro por porosidad
    porosidad = request.GET.get('porosidad', '')
    if porosidad:
        gestiones = gestiones.filter(porosidad=porosidad)

    # Filtro por textura
    textura = request.GET.get('textura', '')
    if textura:
        gestiones = gestiones.filter(textura=textura)

    # Filtro por estado de pago
    estado_pago = request.GET.get('estado_pago', '')
    if estado_pago == 'pagado':
        gestiones = gestiones.filter(saldo_pendiente=0)
    elif estado_pago == 'pendiente':
        gestiones = gestiones.filter(saldo_pendiente__gt=0)

    context = {
        'gestiones': gestiones
    }
    return render(request, 'gestion_alisados/lista_gestion_alisados.html', context)


@login_required
def crear_gestion_alisado(request):
    """
    Crea un nuevo registro de gestión de alisado
    - modal=1 o AJAX: devuelve JSON
    - normal: render/redirect normal
    """
    is_modal = request.GET.get('modal') == '1'
    es_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    if request.method == 'POST':
        form = GestionAlisadoForm(request.POST, request.FILES)

        if form.is_valid():
            form.save()

            if is_modal or es_ajax:
                return JsonResponse({
                    'success': True,
                    'message': 'Gestión de alisado registrada exitosamente.'
                }, status=201)

            messages.success(request, 'Gestión de alisado registrada exitosamente.')
            return redirect('gestion_alisados:lista_gestion_alisados')

        # inválido
        if is_modal or es_ajax:
            return JsonResponse({
                'success': False,
                'message': 'Por favor corrija los errores en el formulario.',
                'errors': form.errors
            }, status=400)

    else:
        # GET
        # Si vienen por link normal ?cliente=ID podemos precargar también
        cliente_id = (request.GET.get("cliente") or "").strip()
        if cliente_id:
            try:
                cliente_obj = Cliente.objects.get(id=int(cliente_id))
                form = GestionAlisadoForm(initial={"cliente": cliente_obj})
            except (ValueError, Cliente.DoesNotExist):
                form = GestionAlisadoForm()
        else:
            form = GestionAlisadoForm()

    context = {
        'form': form,
        'titulo': 'Gestión de Alisado',
        'is_modal': is_modal
    }

    # Si es modal, usar template simplificado
    if is_modal:
        return render(request, 'gestion_alisados/form_gestion_alisado_modal_content.html', context)

    return render(request, 'gestion_alisados/form_gestion_alisado.html', context)


@login_required
@user_passes_test(es_staff)
def ver_gestion_alisado(request, pk):
    """Muestra los detalles de una gestión de alisado"""
    gestion = get_object_or_404(GestionAlisado, pk=pk)
    context = {
        'gestion': gestion
    }
    return render(request, 'gestion_alisados/detalle_gestion_alisado.html', context)


@login_required
def editar_gestion_alisado(request, pk):
    """Edita una gestión de alisado existente"""
    gestion = get_object_or_404(GestionAlisado, pk=pk)

    if request.method == 'POST':
        form = GestionAlisadoForm(request.POST, request.FILES, instance=gestion)
        if form.is_valid():
            form.save()
            messages.success(request, 'Gestión de alisado actualizada exitosamente.')
            return redirect('gestion_alisados:ver_gestion_alisado', pk=gestion.pk)
    else:
        form = GestionAlisadoForm(instance=gestion)

    context = {
        'form': form,
        'titulo': 'Editar Gestión de Alisado',
        'gestion': gestion
    }
    return render(request, 'gestion_alisados/form_gestion_alisado.html', context)


@login_required
def eliminar_gestion_alisado(request, pk):
    """Elimina una gestión de alisado"""
    gestion = get_object_or_404(GestionAlisado, pk=pk)

    if request.method == 'POST':
        gestion.delete()
        messages.success(request, 'Gestión de alisado eliminada exitosamente.')
        return redirect('gestion_alisados:lista_gestion_alisados')

    context = {
        'gestion': gestion
    }
    return render(request, 'gestion_alisados/eliminar_gestion_alisado.html', context)