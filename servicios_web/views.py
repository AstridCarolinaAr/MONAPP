from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from .forms import ServicioWebForm
from .models import ServicioWeb

def crear_servicio_web(request):
    is_modal = request.GET.get('modal') == '1'

    if request.method == 'POST':
        form = ServicioWebForm(request.POST, request.FILES)
        if form.is_valid():
            servicio_web = form.save()
            messages.success(request, f'Servicio Web "{servicio_web.nombre}" creado exitosamente.')
            
            if is_modal or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'message': f'Servicio Web "{servicio_web.nombre}" creado exitosamente.'})
            
            return redirect('servicios_web:lista_servicios_web')
        else:
            if is_modal or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': form.errors})

    else:
        form = ServicioWebForm()
    
    context = {
        'form': form,
        'titulo': 'Crear Servicio Web',
        'is_modal': is_modal
    }

    if is_modal:
        return render(request, 'servicios_web/form_servicio_web_modal_content.html', context)
    
    return render(request, 'servicios_web/form_servicio_web.html', context)

def lista_servicios_web(request):
    servicios_web = ServicioWeb.objects.all()
    context = {
        'servicios_web': servicios_web,
        'titulo': 'Lista de Servicios Web'
    }
    return render(request, 'servicios_web/lista_servicios_web.html', context)

def editar_servicio_web(request, pk):
    servicio_web = get_object_or_404(ServicioWeb, pk=pk)
    is_modal = request.GET.get('modal') == '1'

    if request.method == 'POST':
        form = ServicioWebForm(request.POST, request.FILES, instance=servicio_web)
        if form.is_valid():
            servicio_web = form.save()
            messages.success(request, f'Servicio Web "{servicio_web.nombre}" actualizado exitosamente.')
            
            if is_modal or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': True, 'message': f'Servicio Web "{servicio_web.nombre}" actualizado exitosamente.'})

            return redirect('servicios_web:lista_servicios_web')
        else:
            if is_modal or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({'success': False, 'errors': form.errors})

    else:
        form = ServicioWebForm(instance=servicio_web)
    
    context = {
        'form': form,
        'titulo': f'Editar Servicio Web: {servicio_web.nombre}',
        'servicio_web': servicio_web,
        'is_modal': is_modal
    }

    if is_modal:
        return render(request, 'servicios_web/form_servicio_web_modal_content.html', context)
    
    return render(request, 'servicios_web/form_servicio_web.html', context)

def cambiar_estado_servicio_web(request, pk):
    if request.method == "POST":
        servicio = get_object_or_404(ServicioWeb, pk=pk)

        servicio.activo = not servicio.activo
        servicio.save()

        return JsonResponse({
            "success": True,
            "activo": servicio.activo
        })

    return JsonResponse({
        "success": False,
        "message": "Método no permitido"
    }, status=400)
def eliminar_servicio_web(request, pk):
    servicio_web = get_object_or_404(ServicioWeb, pk=pk)

    if request.method == 'POST':
        nombre = servicio_web.nombre
        servicio_web.delete()
        messages.success(request, f'Servicio Web "{nombre}" eliminado exitosamente.')
        return redirect('servicios_web:lista_servicios_web')

    return render(request, 'servicios_web/eliminar_servcio.html', {
        'servicio_web': servicio_web,
    })
  

