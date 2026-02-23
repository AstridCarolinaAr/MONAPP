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

<<<<<<< HEAD
=======

# Vistas para Gestion de datos
@login_required
def lista_gestion_alisados(request):
    """Lista todas las gestiones de datos registradas"""
    gestiones = GestionAlisado.objects.all()
    context = {
        'gestiones': gestiones
    }
    return render(request, 'servicios/lista_gestion_alisados.html', context)


@login_required
def crear_gestion_alisado(request):
    """Crea un nuevo registro de gestion de datos"""
    is_modal = request.GET.get('modal') == '1'
    cliente_id = request.GET.get('cliente_id')  # ✅ ahora existe

    if request.method == 'POST':
        form = GestionAlisadoForm(request.POST, request.FILES)
        if form.is_valid():
            gestion = form.save()

            # ✅ Respuesta AJAX
            if is_modal or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                return JsonResponse({
                    'success': True,
                    'message': 'Gestión de datos registrada exitosamente.',
                    'id': gestion.pk,
                })

            messages.success(request, 'Gestión de datos registrada exitosamente.')
            return redirect('servicios:lista_gestion_alisados')
    else:
        if cliente_id:
            form = GestionAlisadoForm(initial={'cliente': cliente_id})
        else:
            form = GestionAlisadoForm()

    # ✅ Contexto definido una sola vez
    context = {
        'form': form,
        'titulo': 'Gestión de datos',
        'is_modal': is_modal
    }

    # ✅ Si es modal, renderiza template modal
    if is_modal:
        return render(request, 'servicios/form_gestion_alisado_modal_content.html', context)

    # ✅ Si no es modal, render normal
    return render(request, 'servicios/form_gestion_alisado.html', context)


@login_required
@user_passes_test(es_staff)
def ver_gestion_alisado(request, pk):
    """Muestra los detalles de una gestion de datos"""
    gestion = get_object_or_404(GestionAlisado, pk=pk)
    context = {
        'gestion': gestion
    }
    return render(request, 'servicios/detalle_gestion_alisado.html', context)


@login_required
def editar_gestion_alisado(request, pk):
    """Edita una gestion de datos existente"""
    gestion = get_object_or_404(GestionAlisado, pk=pk)
    
    if request.method == 'POST':
        form = GestionAlisadoForm(request.POST, request.FILES, instance=gestion)
        if form.is_valid():
            gestion = form.save()
            messages.success(request, 'Gestion de datos actualizada exitosamente.')
            return redirect('servicios:ver_gestion_alisado', pk=gestion.pk)
    else:
        form = GestionAlisadoForm(instance=gestion)
    
    context = {
        'form': form,
        'titulo': 'Gestion de datos',
        'gestion': gestion
    }
    return render(request, 'servicios/form_gestion_alisado.html', context)


@login_required
def eliminar_gestion_alisado(request, pk):
    """Elimina una gestion de datos"""
    gestion = get_object_or_404(GestionAlisado, pk=pk)
    
    if request.method == 'POST':
        gestion.delete()
        messages.success(request, 'Gestion de datos eliminada exitosamente.')
        return redirect('servicios:lista_gestion_alisados')
    
    context = {
        'gestion': gestion
    }
    return render(request, 'servicios/eliminar_gestion_alisado.html', context)


# FUNCIÓN DESHABILITADA: El botón de crear cliente desde el modal fue eliminado
# Si necesitas crear clientes, dirígete a Clientes → Crear Cliente
# @login_required
# def crear_cliente_ajax(request):
#     """Crea un cliente mediante AJAX desde el formulario de gestion de datos"""
#     if request.method == 'POST':
#         datos = request.POST
#         print("Datos recibidos:", dict(datos))  # Debug
#         errores = validar_datos_cliente(datos)
#         
#         if errores:
#             print("Errores de validación:", errores)  # Debug
#             return JsonResponse({
#                 'success': False,
#                 'errores': errores
#             })
#         
#         try:
#             cliente = Cliente.objects.create(
#                 tipo_documento=datos['tipo_documento'],
#                 numero_documento=datos['numero_documento'],
#                 nombre=datos['nombre'],
#                 apellido=datos['apellido'],
#                 fecha_nacimiento=datos['fecha_nacimiento'],
#                 telefono=datos.get('telefono', ''),
#                 correo=datos.get('correo', ''),
#                 estado='activo'
#             )
#             print("Cliente creado exitosamente:", cliente.id)  # Debug
#             
#             return JsonResponse({
#                 'success': True,
#                 'cliente': {
#                     'id': cliente.id,
#                     'nombre_completo': f"{cliente.nombre} {cliente.apellido}",
#                     'numero_documento': cliente.numero_documento
#                 }
#             })
#         except Exception as e:
#             print("Error al crear cliente:", str(e))  # Debug
#             return JsonResponse({
#                 'success': False,
#                 'errores': {'general': [str(e)]}
#             })
#     
#     return JsonResponse({'success': False, 'error': 'Método no permitido'})

>>>>>>> 4f7c7795ccdd2020aa9e23075436fe9dcc829002
