from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Proveedor
from .forms import ProveedorForm
from django.shortcuts import render
from django.db.models import Q, Count
from .models import Proveedor

def lista_proveedores(request):
    q = request.GET.get("q", "").strip()
    orden = request.GET.get("orden")

    proveedores = Proveedor.objects.all()

    #  BUSCADOR
    if q:
        proveedores = proveedores.filter(
            Q(nombre_proveedor__icontains=q) |
            Q(nit__icontains=q) |
            Q(correo_proveedor__icontains=q)
        )

    #  ANOTAR ENTREGAS (ajusta cuando tengas relación real)
    proveedores = proveedores.annotate(
        total_entregas=Count("id")  # placeholder
    )

    #  ORDENAMIENTO
    if orden == "nombre":
        proveedores = proveedores.order_by("nombre_proveedor")

    elif orden == "nombre_desc":
        proveedores = proveedores.order_by("-nombre_proveedor")

    elif orden == "entregas":
        proveedores = proveedores.order_by("-total_entregas")

    else:
        proveedores = proveedores.order_by("nombre_proveedor")

    return render(
        request,
        "colaborador/lista_proveedor.html",
        {
            "proveedores": proveedores,
        }
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

    if request.method == "POST":
        proveedor.delete()
        messages.success(request, "Proveedor eliminado correctamente.")
        return redirect("proveedores:lista_proveedor")

    return render(
        request,
        "colaborador/eliminar_proveedor.html",
        {"proveedor": proveedor}
    )
