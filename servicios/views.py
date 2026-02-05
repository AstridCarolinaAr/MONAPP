from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import JsonResponse
from .models import Servicio, GestionAlisado
from .forms import ServicioForm, GestionAlisadoForm
from clientes.models import Cliente
from clientes.validaciones import validar_datos_cliente

def es_staff(user):
    return user.is_staff

@login_required
def lista_servicios(request):
    servicios = Servicio.objects.all()
    context = {
        'servicios': servicios
    }
    return render(request, 'servicios/lista_servicios.html', context)

@login_required
def crear_servicio(request):
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES)
        if form.is_valid():
            servicio = form.save()
            messages.success(request, f'Servicio "{servicio.nombre}" creado exitosamente.')
            return redirect('servicios:lista_servicios')
    else:
        form = ServicioForm()
    
    context = {
        'form': form,
        'titulo': 'Crear Servicio'
    }
    return render(request, 'servicios/form_servicio.html', context)

@login_required
def editar_servicio(request, pk):
    servicio = get_object_or_404(Servicio, pk=pk)
    
    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES, instance=servicio)
        if form.is_valid():
            servicio = form.save()
            messages.success(request, f'Servicio "{servicio.nombre}" actualizado exitosamente.')
            return redirect('servicios:lista_servicios')
    else:
        form = ServicioForm(instance=servicio)
    
    context = {
        'form': form,
        'titulo': 'Editar Servicio',
        'servicio': servicio
    }
    return render(request, 'servicios/form_servicio.html', context)

@login_required
def eliminar_servicio(request, pk):
    servicio = get_object_or_404(Servicio, pk=pk)
    
    if request.method == 'POST':
        nombre = servicio.nombre
        servicio.delete()
        messages.success(request, f'Servicio "{nombre}" eliminado exitosamente.')
        return redirect('servicios:lista_servicios')
    
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


# Vistas para Gestión de Alisados
@login_required
def lista_gestion_alisados(request):
    """Lista todas las gestiones de alisados registradas"""
    gestiones = GestionAlisado.objects.all()
    context = {
        'gestiones': gestiones
    }
    return render(request, 'servicios/lista_gestion_alisados.html', context)


@login_required
def crear_gestion_alisado(request):
    """Crea un nuevo registro de gestión de alisado"""
    if request.method == 'POST':
        form = GestionAlisadoForm(request.POST)
        if form.is_valid():
            gestion = form.save()
            messages.success(request, 'Gestión de alisado registrada exitosamente.')
            return redirect('servicios:lista_gestion_alisados')
    else:
        form = GestionAlisadoForm()
    
    context = {
        'form': form,
        'titulo': 'Nueva Gestión de Alisado'
    }
    return render(request, 'servicios/form_gestion_alisado.html', context)


@login_required
@user_passes_test(es_staff)
def ver_gestion_alisado(request, pk):
    """Muestra los detalles de una gestión de alisado"""
    gestion = get_object_or_404(GestionAlisado, pk=pk)
    context = {
        'gestion': gestion
    }
    return render(request, 'servicios/detalle_gestion_alisado.html', context)


@login_required
def editar_gestion_alisado(request, pk):
    """Edita una gestión de alisado existente"""
    gestion = get_object_or_404(GestionAlisado, pk=pk)
    
    if request.method == 'POST':
        form = GestionAlisadoForm(request.POST, instance=gestion)
        if form.is_valid():
            gestion = form.save()
            messages.success(request, 'Gestión de alisado actualizada exitosamente.')
            return redirect('servicios:ver_gestion_alisado', pk=gestion.pk)
    else:
        form = GestionAlisadoForm(instance=gestion)
    
    context = {
        'form': form,
        'titulo': 'Editar Gestión de Alisado',
        'gestion': gestion
    }
    return render(request, 'servicios/form_gestion_alisado.html', context)


@login_required
def eliminar_gestion_alisado(request, pk):
    """Elimina una gestión de alisado"""
    gestion = get_object_or_404(GestionAlisado, pk=pk)
    
    if request.method == 'POST':
        gestion.delete()
        messages.success(request, 'Gestión de alisado eliminada exitosamente.')
        return redirect('servicios:lista_gestion_alisados')
    
    context = {
        'gestion': gestion
    }
    return render(request, 'servicios/eliminar_gestion_alisado.html', context)


@login_required
def crear_cliente_ajax(request):
    """Crea un cliente mediante AJAX desde el formulario de gestión de alisado"""
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

