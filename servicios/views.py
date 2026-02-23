from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.http import JsonResponse
from .models import Servicio
from .forms import ServicioForm

@login_required
def lista_servicios(request):
    servicios = Servicio.objects.all()
    context = {
        'servicios': servicios
    }
    return render(request, 'servicios/lista_servicios.html', context)

@login_required
def crear_servicio(request):
    is_modal = request.GET.get('modal') == '1'
    
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES)
        if form.is_valid():
            servicio = form.save()
            messages.success(request, f'Servicio "{servicio.nombre}" creado exitosamente.')
            
            # Si es una petición AJAX, devolver JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': f'Servicio "{servicio.nombre}" creado exitosamente.'
                })
            return redirect('servicios:lista_servicios')
        else:
            # Si es una petición AJAX, devolver errores
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'errors': form.errors
                })
    else:
        form = ServicioForm()
    
    # Si es modal, cargar solo el contenido del formulario
    if is_modal:
        context = {
            'form': form,
            'titulo': 'Crear Servicio'
        }
        return render(request, 'servicios/form_servicio_modal_content.html', context)
    
    context = {
        'form': form,
        'titulo': 'Crear Servicio'
    }
    return render(request, 'servicios/form_servicio.html', context)

@login_required
def editar_servicio(request, pk):
    servicio = get_object_or_404(Servicio, pk=pk)
    is_modal = request.GET.get('modal') == '1'
    
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES, instance=servicio)
        if form.is_valid():
            servicio = form.save()
            messages.success(request, f'Servicio "{servicio.nombre}" actualizado exitosamente.')
            
            # Si es una petición AJAX, devolver JSON
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': f'Servicio "{servicio.nombre}" actualizado exitosamente.'
                })
            return redirect('servicios:lista_servicios')
        else:
            # Si es una petición AJAX, devolver errores
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': False,
                    'errors': form.errors
                })
    else:
        form = ServicioForm(instance=servicio)
    
    # Si es modal, cargar solo el contenido del formulario
    if is_modal:
        context = {
            'form': form,
            'titulo': 'Editar Servicio',
            'servicio': servicio
        }
        return render(request, 'servicios/form_editar_servicio_modal_content.html', context)
    
    context = {
        'form': form,
        'titulo': 'Editar Servicio',
        'servicio': servicio
    }
    return render(request, 'servicios/form_servicio.html', context)

@login_required
def eliminar_servicio(request, pk):
    servicio = get_object_or_404(Servicio, pk=pk)
    is_modal = request.GET.get('modal') == '1'
    
    if request.method == 'POST':
        nombre = servicio.nombre
        servicio.delete()
        messages.success(request, f'Servicio "{nombre}" eliminado exitosamente.')
        
        # Si es una petición AJAX, devolver JSON
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': f'Servicio "{nombre}" eliminado exitosamente.'
            })
        return redirect('servicios:lista_servicios')
    
    # Si es modal, cargar solo el contenido del formulario
    if is_modal:
        context = {
            'servicio': servicio
        }
        return render(request, 'servicios/form_eliminar_servicio_modal_content.html', context)
    
    context = {
        'servicio': servicio
    }
    return render(request, 'servicios/eliminar_servicio.html', context)

def servicios_publicos(request):
    """Vista pública para mostrar servicios en la página principal"""
    servicios = Servicio.objects.filter(activo=True)
    context = {
        'servicios': servicios
    }
    return render(request, 'servicios/servicios_publicos.html', context)

