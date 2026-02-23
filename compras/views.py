from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from django.template.loader import render_to_string
from django.views.decorators.http import require_http_methods, require_POST
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Sum,F
from django.db.models.deletion import ProtectedError
from collections import Counter
from .models import Compra
from .forms import CompraForm, DetalleCompraFormSet
from inventario.models import Stock
from django.views.decorators.csrf import ensure_csrf_cookie

def is_ajax(request):
    return request.headers.get("x-requested-with") == "XMLHttpRequest"

@ensure_csrf_cookie
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
        formset = DetalleCompraFormSet(request.POST or None)

        if form.is_valid() and formset.is_valid():
            with transaction.atomic():
                compra = form.save(commit=False)
                compra.usuario = request.user

                # Total
                total = 0
                for f in formset:
                    if not f.cleaned_data or f.cleaned_data.get("DELETE") or not f.has_changed():
                        continue
                    cant = f.cleaned_data.get("cantidad") or 0
                    pu = f.cleaned_data.get("precio_unitario") or 0
                    total += cant * pu

                compra.precio_total = total
                compra.save()

                formset.instance = compra
                detalles = formset.save(commit=False)

                for d in detalles:
                    d.compra = compra
                    d.save()
                    stock_obj, _ = Stock.objects.get_or_create(producto=d.producto)
                    Stock.objects.filter(pk=stock_obj.pk).update(
                        cantidad_actual=F("cantidad_actual") + (d.cantidad or 0)
                    )
                formset.save_m2m()

            messages.success(request, "Compra registrada correctamente.")
            if is_ajax(request):
                return JsonResponse({"success": True})
            return redirect("compras:lista_compras")

        context = {"form": form, "formset": formset, "action_url": reverse("compras:crear_compra")}
        if is_ajax(request):
            html = render_to_string("compras/formulario_crear_compra.html", context, request=request)
            return JsonResponse({"success": False, "html": html})
        return render(request, "compras/crear_compra.html", context)

    form = CompraForm()
    formset = DetalleCompraFormSet()
    context = {"form": form, "formset": formset, "action_url": reverse("compras:crear_compra")}

    if is_ajax(request):
        html = render_to_string("compras/formulario_crear_compra.html", context, request=request)
        return JsonResponse({"success": True, "html": html})

    return render(request, "compras/crear_compra.html", context)


@login_required
@require_http_methods(["GET", "POST"])
def editar_compra(request, pk):
    compra = get_object_or_404(Compra, pk=pk)

    if request.method == "POST":
        form = CompraForm(request.POST, instance=compra)
        formset = DetalleCompraFormSet(request.POST or None, instance=compra)

        if form.is_valid() and formset.is_valid():
            with transaction.atomic():

                old_map = dict(
                    compra.detalles.values("producto_id")
                    .annotate(total=Sum("cantidad"))
                    .values_list("producto_id", "total")
                )

                compra = form.save()
                formset.save()
                total=0
                for d in compra.detalles.all():
                    total += d.cantidad*d.precio_unitario
                compra.precio_total = total
                compra.save(update_fields=["precio_total"])

                new_map = dict(
                    compra.detalles.values("producto_id")
                    .annotate(total=Sum("cantidad"))
                    .values_list("producto_id", "total")
                )

                producto_ids = set(old_map.keys()) | set(new_map.keys())

                for pid in producto_ids:
                    old_qty = old_map.get(pid) or 0
                    new_qty = new_map.get(pid) or 0
                    delta = new_qty - old_qty

                    if delta == 0:
                        continue

                    stock_obj, _ = Stock.objects.get_or_create(producto_id=pid)
                    Stock.objects.filter(pk=stock_obj.pk).update(
                        cantidad_actual=F("cantidad_actual") + delta
                    )
                    
                    if compra.anulada:
                        return JsonResponse({"success": False, "message": "no se puede editar una compra anulada."})
            return JsonResponse({
                "success": True,
                "message": "Se editó correctamente"
            })

        
        html = render_to_string(
            "compras/formulario_editar_compra.html",
            {"form": form, "formset": formset, "compra": compra},
            request=request
        )

        return JsonResponse({
            "success": False,
            "html": html
        }, status=400)

    form = CompraForm(instance=compra)
    formset = DetalleCompraFormSet(instance=compra)

    return render(
        request,
        "compras/formulario_editar_compra.html",
        {"form": form, "formset": formset, "compra": compra},
    )
    
@login_required
@require_POST
def anular_compra(request, pk):
    compra = get_object_or_404(Compra, pk=pk)


    if compra.anulada:
        return JsonResponse({"status": "already", "message": "La compra ya estaba anulada."})

    with transaction.atomic():

        qtys = (
            compra.detalles.values("producto_id")
            .annotate(total=Sum("cantidad"))
            .values_list("producto_id", "total")
        )

        for pid, total in qtys:
            stock_obj, _ = Stock.objects.get_or_create(producto_id=pid)
            Stock.objects.filter(pk=stock_obj.pk).update(
                cantidad_actual=F("cantidad_actual") - total
            )

        compra.anulada = True
        compra.save(update_fields=["anulada"])

    return JsonResponse({"status": "ok", "message": "Compra anulada y stock revertido."})