from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import HttpResponseForbidden

from .models import Proveedor
from .forms import ProveedorForm

def es_gerente(user):
    return user.groups.filter(name='Gerente').exists()


def lista_proveedores(request):
    proveedores = Proveedor.objects.all().order_by('nombre_proveedor')
    return render(request, 'Proveedores/lista_proveedores.html', {
        'proveedores': proveedores
    })
# funcion crear proveedor
def crear_proveedor(request):
    if request.method == 'POST':
        form = ProveedorForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, 'Proveedor registrado correctamente')
            return redirect('proveedores:lista')
    else:
        form = ProveedorForm()

    return render(request, 'Proveedores/crear_proveedor.html', {'form': form})
#funcion editar proveedor
def editar_proveedor(request, id):
    proveedor = get_object_or_404(Proveedor, id=id)

    if not es_gerente(request.user):
        return HttpResponseForbidden("No tienes permisos para editar proveedores")

    if request.method == 'POST':
        form = ProveedorForm(request.POST, instance=proveedor)
        if form.is_valid():
            form.save()
            messages.success(request, 'Proveedor actualizado')
            return redirect('proveedores:lista')
    else:
        form = ProveedorForm(instance=proveedor)

    return render(request, 'Proveedores/editar_proveedor.html', {
        'form': form,
        'proveedor': proveedor
    })

#funcion eliminar proveedor
def eliminar_proveedor(request, id):
    proveedor = get_object_or_404(Proveedor, id=id)

    if not es_gerente(request.user):
        return HttpResponseForbidden("No tienes permisos para eliminar proveedores")

    if request.method == 'POST':
        proveedor.delete()
        messages.success(request, 'Proveedor eliminado')
        return redirect('proveedores:lista')

    return render(request, 'Proveedores/eliminar_proveedor.html', {
        'proveedor': proveedor
    })
