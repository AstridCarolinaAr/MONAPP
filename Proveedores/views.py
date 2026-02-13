from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Q, Count
from .models import Proveedor
from .forms import ProveedorcrearForm
from .forms import ProveedoreditarForm
from django.db.models.deletion import ProtectedError
from inventario.models import MovimientoInventario
from django.http import JsonResponse
from django.views.decorators.http import require_POST


def lista_proveedores(request):
    q = request.GET.get("q", "").strip()
    orden = request.GET.get("orden")

    # estado activo por defecto
    estado = request.GET.get("estado", "activo")

    if estado not in ["activo", "inactivo"]:
        estado = "activo"

    proveedores = Proveedor.objects.filter(estado=estado)

    # BUSCADOR
    if q:
        proveedores = proveedores.filter(
            Q(nombre_proveedor__icontains=q) |
            Q(nit__icontains=q) |
            Q(correo_proveedor__icontains=q)
        )

    # CONTADOR (si luego lo usas)
    proveedores = proveedores.annotate(
        total_entregas=Count("id")
    )

    # ORDENAMIENTO
    ordenamientos = {
        "nombre": "nombre_proveedor",
        "nombre_desc": "-nombre_proveedor",
        "entregas": "-total_entregas",
    }

    proveedores = proveedores.order_by(
        ordenamientos.get(orden, "nombre_proveedor")
    )

    return render(
        request,
        "colaborador/lista_proveedor.html",
        {
            "proveedores": proveedores,
            "estado_actual": estado
        }
    )


def crear_proveedor(request):
    print("METODO:", request.method)
    print("POST:", request.POST)

    if request.method == 'POST':
        form = ProveedorcrearForm(request.POST)

        print("VALIDO:", form.is_valid())
        print("ERRORES:", form.errors)

    if request.method == "POST":
        form = ProveedorcrearForm(request.POST)
        if form.is_valid():
            form.save()
            messages.success(request, "Proveedor creado correctamente.")
            return redirect("proveedores:lista_proveedor")
    else:
        form = ProveedorcrearForm()

    return render(
        request,
        "colaborador/crear_proveedor.html",
        {
            "form": form,
            "titulo": "Nuevo proveedor"
        }
    )


def editar_proveedor(request, pk):
    proveedor = get_object_or_404(Proveedor, pk=pk)

    if request.method == "POST":
        form = ProveedoreditarForm(request.POST, instance=proveedor)
        if form.is_valid():
            form.save()
            messages.success(request, "Proveedor actualizado correctamente.")
            return redirect("proveedores:lista_proveedor")
    else:
        form = ProveedoreditarForm(instance=proveedor)

    return render(
        request,
        "colaborador/editar_proveedor.html",
        {
            "form": form,
            "proveedor": proveedor,
            "titulo": "Editar proveedor"
        }
    )



def eliminar_proveedor(request, pk):
    proveedor = get_object_or_404(Proveedor, pk=pk)

    if request.method == "POST":
        try:
            proveedor.delete()
            return JsonResponse({
                "status": "deleted"
            })

        except ProtectedError:

                movimientos = MovimientoInventario.objects.filter(proveedor=proveedor)

        return JsonResponse({
            "status": "protected",
            "cantidad": movimientos.count(),
            "detalle": "movimientos de inventario"
        })


@require_POST
def reactivar_proveedor(request, pk):
    proveedor = get_object_or_404(Proveedor, pk=pk)
    proveedor.estado = "activo"
    proveedor.save()
    return JsonResponse({"status": "activated"})


@require_POST
def desactivar_proveedor(request, pk):
    proveedor = get_object_or_404(Proveedor, pk=pk)
    proveedor.estado = "inactivo"
    proveedor.save()
    return JsonResponse({"status": "inactivated"})