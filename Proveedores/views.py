from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Proveedor
from .forms import ProveedorForm


def lista_proveedores(request):
    proveedores = Proveedor.objects.all().order_by('nombre_proveedor')
    return render(
        request,
        'colaborador/lista_proveedor.html',
        {'proveedores': proveedores}
    )


def crear_proveedor(request):
    if request.method == 'POST':
        form = ProveedorForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Proveedor creado correctamente.')
            return redirect('proveedores:lista_proveedor')
    else:
        form = ProveedorForm()

    return render(
        request,
        'colaborador/crear_proveedor.html',
        {
            'form': form,
            'titulo': 'Nuevo proveedor'
        }
    )


def editar_proveedor(request, pk):
    proveedor = get_object_or_404(Proveedor, pk=pk)

    if request.method == 'POST':
        form = ProveedorForm(request.POST, instance=proveedor)
        if form.is_valid():
            form.save()
            messages.success(request, 'Proveedor actualizado correctamente.')
            return redirect('proveedores:lista_proveedor')
    else:
        form = ProveedorForm(instance=proveedor)

    return render(
        request,
        'colaborador/editar_proveedor.html',  
        {
            'form': form,
            'proveedor': proveedor,
            'titulo': 'Editar proveedor'
        }
    )


def eliminar_proveedor(request, pk):
    proveedor = get_object_or_404(Proveedor, pk=pk)
    proveedor.delete()
    messages.success(request, 'Proveedor eliminado correctamente.')
    return redirect('proveedores:lista_proveedor')
