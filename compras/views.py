from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from django.template.loader import render_to_string
from django.views.decorators.http import require_http_methods, require_POST
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Sum

from .models import Compra
from .forms import CompraForm, DetalleCompraFormSet


def is_ajax(request):
    return request.headers.get("x-requested-with") == "XMLHttpRequest"


@login_required
@require_http_methods(["GET"])
def lista_compras(request):
    compras = (
        Compra.objects.select_related("proveedor", "usuario")
        .prefetch_related("detalles__producto")
        .order_by("-id")
    )
    total_compras = compras.aggregate(total=Sum("precio_total"))["total"] or 0

    context = {"compras": compras, "total_compras": total_compras}
    return render(request, "compras/compra.html", context)

@login_required
@require_http_methods(["GET"])
def detalle_compra(request, compra_id):
    compra = get_object_or_404(
        Compra.objects.select_related("proveedor", "usuario")
        .prefetch_related("detalles__producto"),
        id=compra_id
    )

    detalles_calc = []
    total_calc = 0

    for d in compra.detalles.all():
        subtotal = float(d.cantidad) * float(d.precio_unitario)
        total_calc += subtotal
        detalles_calc.append({
            "producto": d.producto.nombre,  
            "cantidad": d.cantidad,
            "precio_unitario": float(d.precio_unitario),
            "subtotal": subtotal,
        })

    html = render_to_string(
        "compras/detalle_compra.html",
        {"c": compra, "detalles_calc": detalles_calc, "total_calc": total_calc},
        request=request
    )
    return JsonResponse({"success": True, "html": html})
@login_required
@require_http_methods(["GET", "POST"])
def crear_compra(request):
    if request.method == "POST":
        form = CompraForm(request.POST)
        formset = DetalleCompraFormSet(request.POST)

        if form.is_valid() and formset.is_valid():
            with transaction.atomic():
                compra = form.save(commit=False)
                compra.usuario = request.user

                total = 0
                for f in formset:
                    if not f.cleaned_data:
                        continue
                    if f.cleaned_data.get("DELETE"):
                        continue
                    cant = f.cleaned_data.get("cantidad") or 0
                    pu = f.cleaned_data.get("precio_unitario") or 0
                    total += cant * pu

                compra.precio_total = total
                compra.save()

                formset.instance = compra
                formset.save()

            messages.success(request, "Compra registrada correctamente.")

            if is_ajax(request):
                return JsonResponse({"success": True})

            return redirect("compras:lista_compras")

        context = {
            "form": form,
            "formset": formset,
            "action_url": reverse("compras:crear_compra"),
        }

        if is_ajax(request):
            html = render_to_string(
                "compras/formulario_crear_compra.html",
                context,
                request=request
            )
            return JsonResponse({"success": False, "html": html})

        return render(request, "compras/crear_compra.html", context)

    form = CompraForm()
    formset = DetalleCompraFormSet()
    context = {
        "form": form,
        "formset": formset,
        "action_url": reverse("compras:crear_compra"),
    }

    if is_ajax(request):
        html = render_to_string("compras/formulario_crear_compra.html", context, request=request)
        return JsonResponse({"success": True, "html": html})

    return render(request, "compras/crear_compra.html", context)


@login_required
@require_POST
def eliminar_compra(request, compra_id):
    compra = get_object_or_404(Compra, id=compra_id)
    compra.delete()
    messages.success(request, "Compra eliminada correctamente.")

    if is_ajax(request):
        return JsonResponse({"success": True})

    return redirect("compras:lista_compras")