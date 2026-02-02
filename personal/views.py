from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.db.models import Q
from .models import Personal
from .forms import PersonalForm, PersonalBusquedaForm


@login_required
def lista_personal(request):
    """Lista todo el personal con búsqueda y filtrado"""
    personal_list = Personal.objects.all()
    form = PersonalBusquedaForm(request.GET)
    
    if form.is_valid():
        busqueda = form.cleaned_data.get('busqueda')
        rol = form.cleaned_data.get('rol')
        
        if busqueda:
            personal_list = personal_list.filter(
                Q(numero_documento__icontains=busqueda) |
                Q(nombres__icontains=busqueda) |
                Q(telefono__icontains=busqueda) |
                Q(correo__icontains=busqueda) |
                Q(id__icontains=busqueda)
            )
        
        if rol:
            personal_list = personal_list.filter(rol=rol)
    
    context = {
        'personal_list': personal_list,
        'form': form
    }
    return render(request, 'personal/lista_personal.html', context)


@login_required
def crear_personal(request):
    """Crear nuevo personal"""
    if request.method == 'POST':
        form = PersonalForm(request.POST)
        if form.is_valid():
            personal = form.save()
            messages.success(request, f'Personal {personal.nombres} creado exitosamente.')
            return redirect('personal:lista_personal')
    else:
        form = PersonalForm()
    
    context = {'form': form, 'titulo': 'Crear Personal'}
    return render(request, 'personal/formulario_personal.html', context)


@login_required
def editar_personal(request, pk):
    """Editar información del personal"""
    personal = get_object_or_404(Personal, pk=pk)
    
    if request.method == 'POST':
        form = PersonalForm(request.POST, instance=personal)
        if form.is_valid():
            form.save()
            messages.success(request, f'Personal {personal.nombres} actualizado exitosamente.')
            return redirect('personal:lista_personal')
    else:
        form = PersonalForm(instance=personal)
    
    context = {
        'form': form,
        'personal': personal,
        'titulo': f'Editar - {personal.nombres}'
    }
    return render(request, 'personal/formulario_personal.html', context)


@login_required
def eliminar_personal(request, pk):
    """Eliminar personal"""
    personal = get_object_or_404(Personal, pk=pk)
    
    if request.method == 'POST':
        nombre = personal.nombres
        personal.delete()
        messages.success(request, f'Personal {nombre} eliminado exitosamente.')
        return redirect('personal:lista_personal')
    
    context = {'personal': personal}
    return render(request, 'personal/confirmar_eliminar_personal.html', context)


@login_required
def detalle_personal(request, pk):
    """Ver detalles del personal"""
    personal = get_object_or_404(Personal, pk=pk)
    context = {'personal': personal}
    return render(request, 'personal/detalle_personal.html', context)
