from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from .models import Servicio
from .forms import ServicioForm
from datetime import datetime
from openpyxl import Workbook
from openpyxl.styles import PatternFill, Font, Alignment, Border, Side
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from io import BytesIO

def es_staff(user):
    return user.is_staff


def es_administrador(user):
    return user.is_authenticated and (user.is_superuser or user.groups.filter(name='Administrador').exists())

@login_required
def lista_servicios(request):
    servicios = Servicio.objects.all()
    context = {
        'servicios': servicios,
        'es_administrador': es_administrador(request.user),
    }
    return render(request, 'servicios/lista_servicios.html', context)


@login_required
@user_passes_test(es_administrador)
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
            # Si no es AJAX, continuar para mostrar el formulario con errores
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
@user_passes_test(es_administrador)
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
            # Si no es AJAX, continuar para mostrar el formulario con errores
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
@user_passes_test(es_administrador)
def eliminar_servicio(request, pk):
    servicio = get_object_or_404(Servicio, pk=pk)
    is_modal = request.GET.get('modal') == '1'
    
    if request.method == 'POST':
        nombre = servicio.nombre
        servicio.activo = False
        servicio.save(update_fields=['activo', 'fecha_modificacion'])
        messages.success(request, f'Servicio "{nombre}" desactivado exitosamente.')
        
        # Si es una petición AJAX, devolver JSON
        if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
            return JsonResponse({
                'success': True,
                'message': f'Servicio "{nombre}" desactivado exitosamente.'
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

@login_required
def toggle_activo_servicio(request, pk):
    if not es_administrador(request.user):
        return JsonResponse({'success': False, 'error': 'No autorizado'}, status=403)

    if request.method == 'POST':
        servicio = get_object_or_404(Servicio, pk=pk)
        servicio.activo = not servicio.activo
        servicio.save()
        return JsonResponse({
            'success': True,
            'activo': servicio.activo
        })
    return JsonResponse({'success': False}, status=400)


