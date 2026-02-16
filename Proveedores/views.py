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
from django.template.loader import render_to_string
from django.urls import reverse

def is_ajax(request):
    return request.headers.get("x-requested-with") == "XMLHttpRequest"


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
        "proveedor/lista_proveedor.html",
        {
            "proveedores": proveedores,
            "estado_actual": estado
        }
    )


def crear_proveedor(request):
    form = ProveedorcrearForm(request.POST or None, request.FILES or None)

    if request.method == "POST" and form.is_valid():
        proveedor = form.save()
        messages.success(request, f'Proveedor "{proveedor.nombre_proveedor}" creado correctamente.')

        if is_ajax(request):
            return JsonResponse({
                "success": True,
                "redirect_url": reverse("proveedores:lista_proveedor")
            })

        return redirect("proveedores:lista_proveedor")

    context = {
        "form": form,
        "action_url": reverse("proveedores:crear_proveedor"),
        "submit_label": "Crear",
        "titulo": "Crear proveedor"
    }

    if is_ajax(request):
        html = render_to_string(
            "proveedor/formulario_crear_proveedor.html",
            context,
            request=request
        )
        return JsonResponse({
            "success": False,
            "html": html,
            "title": context["titulo"],
            "redirect_url": reverse("proveedores:lista_proveedor")
        })

    return render(request, "proveedor/crear_proveedor.html", context)
def editar_proveedor(request, pk):
    proveedor = get_object_or_404(Proveedor, pk=pk)
    form = ProveedorcrearForm(request.POST or None, instance=proveedor)

    if request.method == "POST":
        if form.is_valid():
            form.save()

            if request.headers.get("x-requested-with") == "XMLHttpRequest":
                return JsonResponse({"success": True})

            return redirect("proveedores:lista_proveedor")

        if request.headers.get("x-requested-with") == "XMLHttpRequest":
            html = render_to_string(
                "proveedor/_form_proveedor.html",
                {
                    "form": form,
                    "action_url": reverse("proveedores:editar_proveedor", args=[pk]),
                    "titulo": "Editar proveedor",
                    "submit_label": "Actualizar"
                },
                request=request
            )
            return JsonResponse({
                "success": False,
                "html": html,
                "title": "Editar proveedor"
            })

    context = {
        "form": form,
        "action_url": reverse("proveedores:editar_proveedor", args=[pk]),
        "titulo": "Editar proveedor",
        "submit_label": "Actualizar"
    }

    if request.headers.get("x-requested-with") == "XMLHttpRequest":
        html = render_to_string("proveedor/formulario_editar_proveedor.html", context, request=request)
        return JsonResponse({
            "success": False,
            "html": html,
            "title": context["titulo"]
        })

    return render(request, "proveedor/editar_proveedor.html", context)

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