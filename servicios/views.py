from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from .models import Servicio
from .forms import ServicioForm

def es_staff(user):
    return user.is_staff

@login_required
@user_passes_test(es_staff)
def lista_servicios(request):
    servicios = Servicio.objects.all()
    context = {
        'servicios': servicios
    }
    return render(request, 'servicios/lista_servicios.html', context)


@login_required
@user_passes_test(es_staff)
def crear_servicio(request):

    if request.method == 'POST':
        form = ServicioForm(request.POST, request.FILES)

        if form.is_valid():
            servicio = form.save()
            messages.success(
                request,
                f'Servicio "{servicio.nombre}" creado exitosamente.'
            )
            return redirect('servicios:lista_servicios')

    else:
        form = ServicioForm()

    context = {
        'form': form,
        'titulo': 'Crear Servicio'
    }

    return render(request, 'servicios/form_servicio.html', context)

@login_required
@user_passes_test(es_staff)
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
@user_passes_test(es_staff)
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
