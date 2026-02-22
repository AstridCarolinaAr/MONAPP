from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from .models import GestionDatos
from .forms import GestionDatosForm
from clientes.models import Cliente
from clientes.validaciones import validar_datos_cliente


def es_staff(user):
    return user.is_staff


@login_required
def lista_gestion_datos(request):
    """Lista todas las gestiones de datos registradas"""
    gestiones = GestionDatos.objects.all()
    context = {
        'gestiones': gestiones
    }
    return render(request, 'gestion_datos/lista_gestion_datos.html', context)


@login_required
def crear_gestion_datos(request):
    """Crea un nuevo registro de gestión de datos del cliente"""
    is_modal = request.GET.get('modal') == '1'
    
    if request.method == 'POST':
        print(f"=== CREAR GESTION DATOS - POST recibido ===")
        print(f"is_modal: {is_modal}")
        print(f"X-Requested-With: {request.headers.get('X-Requested-With')}")
        print(f"POST data keys: {list(request.POST.keys())}")
        print(f"FILES: {list(request.FILES.keys())}")
        
        form = GestionDatosForm(request.POST, request.FILES)
        if form.is_valid():
            print("=== FORMULARIO VÁLIDO ===")
            gestion = form.save()
            print(f"=== GESTIÓN GUARDADA con ID: {gestion.pk} ===")
            
            if is_modal or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                # Retornar respuesta JSON para AJAX
                return JsonResponse({
                    'success': True,
                    'message': 'Gestión de datos registrada exitosamente.'
                })
            
            messages.success(request, 'Gestión de datos registrada exitosamente.')
            return redirect('gestion_datos:lista_gestion_datos')
        else:
            print("=== FORMULARIO INVÁLIDO ===")
            print(f"Errores: {form.errors}")
            if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
                # Si hay errores y es AJAX, devolver JSON con los errores
                return JsonResponse({
                    'success': False,
                    'message': 'Por favor corrija los errores en el formulario.',
                    'errors': form.errors
                }, status=400)
    else:
        form = GestionDatosForm()
    
    context = {
        'form': form,
        'titulo': 'Nueva Gestión de Datos del Cliente',
        'is_modal': is_modal
    }
    
    # Si es modal, usar template simplificado
    if is_modal:
        return render(request, 'gestion_datos/form_gestion_datos_modal_content.html', context)
    
    return render(request, 'gestion_datos/form_gestion_datos.html', context)


@login_required
@user_passes_test(es_staff)
def ver_gestion_datos(request, pk):
    """Muestra los detalles de una gestión de datos"""
    gestion = get_object_or_404(GestionDatos, pk=pk)
    context = {
        'gestion': gestion
    }
    return render(request, 'gestion_datos/detalle_gestion_datos.html', context)


@login_required
def editar_gestion_datos(request, pk):
    """Edita una gestión de datos existente"""
    gestion = get_object_or_404(GestionDatos, pk=pk)
    
    if request.method == 'POST':
        form = GestionDatosForm(request.POST, request.FILES, instance=gestion)
        if form.is_valid():
            gestion = form.save()
            messages.success(request, 'Gestión de datos actualizada exitosamente.')
            return redirect('gestion_datos:ver_gestion_datos', pk=gestion.pk)
    else:
        form = GestionDatosForm(instance=gestion)
    
    context = {
        'form': form,
        'titulo': 'Editar Gestión de Datos del Cliente',
        'gestion': gestion
    }
    return render(request, 'gestion_datos/form_gestion_datos.html', context)


@login_required
def eliminar_gestion_datos(request, pk):
    """Elimina una gestión de datos"""
    gestion = get_object_or_404(GestionDatos, pk=pk)
    
    if request.method == 'POST':
        gestion.delete()
        messages.success(request, 'Gestión de datos eliminada exitosamente.')
        return redirect('gestion_datos:lista_gestion_datos')
    
    context = {
        'gestion': gestion
    }
    return render(request, 'gestion_datos/eliminar_gestion_datos.html', context)


@login_required
def crear_cliente_ajax(request):
    """Crea un cliente mediante AJAX desde el formulario de gestión de datos"""
    if request.method == 'POST':
        datos = request.POST
        print("Datos recibidos:", dict(datos))  # Debug
        errores = validar_datos_cliente(datos)
        
        if errores:
            print("Errores de validación:", errores)  # Debug
            return JsonResponse({
                'success': False,
                'errores': errores
            })
        
        try:
            cliente = Cliente.objects.create(
                tipo_documento=datos['tipo_documento'],
                numero_documento=datos['numero_documento'],
                nombre=datos['nombre'],
                apellido=datos['apellido'],
                fecha_nacimiento=datos['fecha_nacimiento'],
                telefono=datos.get('telefono', ''),
                correo=datos.get('correo', ''),
                estado='activo'
            )
            print("Cliente creado exitosamente:", cliente.id)  # Debug
            
            return JsonResponse({
                'success': True,
                'cliente': {
                    'id': cliente.id,
                    'nombre_completo': f"{cliente.nombre} {cliente.apellido}",
                    'numero_documento': cliente.numero_documento
                }
            })
        except Exception as e:
            print("Error al crear cliente:", str(e))  # Debug
            return JsonResponse({
                'success': False,
                'errores': {'general': [str(e)]}
            })
    
    return JsonResponse({'success': False, 'error': 'Método no permitido'})
