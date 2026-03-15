from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Count, Q, Sum
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.template.loader import render_to_string
from django.templatetags.static import static
from django.urls import reverse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_POST, require_http_methods

from . import services
from .comprobante import build_comprobante_excel_response
from .forms import (
    CompraForm,
    DetalleCompraFormSet,
    DevolucionCompraForm,
    DetalleDevolucionCompraFormSet,
)
from .models import Compra, DevolucionCompra

# =========================
# Helpers
# =========================
def is_ajax(request):
    return request.headers.get("x-requested-with") == "XMLHttpRequest"


# =========================
# Listado principal
# =========================
@ensure_csrf_cookie
@login_required
@require_http_methods(["GET"])
def lista_compras(request):
    tipo = request.GET.get("tipo", "compras").strip()
    estado = request.GET.get("estado", "activas").strip()
    fecha = request.GET.get("fecha", "").strip()
    fecha_desde = request.GET.get("fecha_desde", "").strip()
    fecha_hasta = request.GET.get("fecha_hasta", "").strip()
    busqueda = request.GET.get("q", "").strip()

    if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
        fecha_desde, fecha_hasta = fecha_hasta, fecha_desde

    context = {
        "tipo_actual": tipo,
        "estado_actual": estado,
        "fecha_actual": fecha,
        "fecha_desde_actual": fecha_desde,
        "fecha_hasta_actual": fecha_hasta,
        "q_actual": busqueda,
    }

    if tipo == "devoluciones":
        devoluciones_qs = (
            DevolucionCompra.objects
            .select_related("compra", "proveedor", "usuario")
            .prefetch_related("detalles__producto")
            .order_by("-id")
        )

        if estado == "anuladas":
            devoluciones_qs = devoluciones_qs.filter(anulada=True)
        elif estado == "todas":
            pass
        else:
            devoluciones_qs = devoluciones_qs.filter(anulada=False)
            estado = "activas"

        if estado == "anuladas":
            if fecha:
                devoluciones_qs = devoluciones_qs.filter(fecha_anulada=fecha)
            if fecha_desde:
                devoluciones_qs = devoluciones_qs.filter(fecha_anulada__gte=fecha_desde)
            if fecha_hasta:
                devoluciones_qs = devoluciones_qs.filter(fecha_anulada__lte=fecha_hasta)
        else:
            if fecha:
                devoluciones_qs = devoluciones_qs.filter(fecha=fecha)
            if fecha_desde:
                devoluciones_qs = devoluciones_qs.filter(fecha__gte=fecha_desde)
            if fecha_hasta:
                devoluciones_qs = devoluciones_qs.filter(fecha__lte=fecha_hasta)

        if busqueda:
            filtros = (
                Q(id__icontains=busqueda) |
                Q(compra__id__icontains=busqueda) |
                Q(proveedor__nombre_proveedor__icontains=busqueda) |
                Q(usuario__username__icontains=busqueda)
            )
            devoluciones_qs = devoluciones_qs.filter(filtros)

        total_devoluciones = devoluciones_qs.aggregate(total=Sum("total"))["total"] or 0

        context.update({
            "devoluciones": devoluciones_qs,
            "total_general": total_devoluciones,
            "titulo_modulo": "Gestión de Devoluciones",
            "label_total": "Total devoluciones registradas",
            "placeholder_busqueda": "ID devolución, ID compra, proveedor o usuario",
        })

    else:
        tipo = "compras"

        compras_qs = (
            Compra.objects
            .select_related("proveedor", "usuario")
            .prefetch_related("detalles__producto")
            .annotate(
                devoluciones_activas_count=Count(
                    "devoluciones",
                    filter=Q(devoluciones__anulada=False),
                    distinct=True
                )
            )
            .order_by("-id")
        )

        if estado == "anuladas":
            compras_qs = compras_qs.filter(anulada=True)
        elif estado == "todas":
            pass
        else:
            compras_qs = compras_qs.filter(anulada=False)
            estado = "activas"

        if estado == "anuladas":
            if fecha:
                compras_qs = compras_qs.filter(fecha_anulada=fecha)
            if fecha_desde:
                compras_qs = compras_qs.filter(fecha_anulada__gte=fecha_desde)
            if fecha_hasta:
                compras_qs = compras_qs.filter(fecha_anulada__lte=fecha_hasta)
        else:
            if fecha:
                compras_qs = compras_qs.filter(fecha=fecha)
            if fecha_desde:
                compras_qs = compras_qs.filter(fecha__gte=fecha_desde)
            if fecha_hasta:
                compras_qs = compras_qs.filter(fecha__lte=fecha_hasta)

        if busqueda:
            filtros = (
                Q(id__icontains=busqueda) |
                Q(proveedor__id__icontains=busqueda) |
                Q(proveedor__nombre_proveedor__icontains=busqueda) |
                Q(usuario__username__icontains=busqueda) |
                Q(usuario__id__icontains=busqueda)
            )
            compras_qs = compras_qs.filter(filtros)

        total_compras = compras_qs.aggregate(total=Sum("precio_total"))["total"] or 0

        context.update({
            "compras": compras_qs,
            "total_general": total_compras,
            "titulo_modulo": "Gestión de Compras",
            "label_total": "Total compras registradas",
            "placeholder_busqueda": "ID compra, ID proveedor, proveedor o usuario",
        })

    context["tipo_actual"] = tipo
    context["estado_actual"] = estado

    return render(request, "compras/compra.html", context)


# =========================
# Detalle de compra
# =========================
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
        formset = DetalleCompraFormSet(request.POST, prefix="detalles")

        if form.is_valid() and formset.is_valid():
            services.registrar_compra(
                form=form,
                formset=formset,
                usuario=request.user,
            )

            messages.success(request, "Compra registrada correctamente.")
            if is_ajax(request):
                return JsonResponse({"success": True})
            return redirect("compras:lista_compras")

        context = {
            "form": form,
            "formset": formset,
            "action_url": reverse("compras:crear_compra"),
            "compra": None,
            "modo": "crear",
        }

        if is_ajax(request):
            html = render_to_string("compras/formulario_crear_compra.html", context, request=request)
            return JsonResponse({"success": False, "html": html})
        return render(request, "compras/crear_compra.html", context)

    form = CompraForm()
    formset = DetalleCompraFormSet(prefix="detalles")
    context = {
        "form": form,
        "formset": formset,
        "action_url": reverse("compras:crear_compra"),
        "compra": None,
    }

    if is_ajax(request):
        html = render_to_string("compras/formulario_crear_compra.html", context, request=request)
        return JsonResponse({"success": True, "html": html})

    return render(request, "compras/crear_compra.html", context)
@login_required
@require_http_methods(["GET", "POST"])
def editar_compra(request, pk):
    compra = get_object_or_404(Compra, pk=pk)

    try:
        services.validar_compra_editable(compra)
    except services.CompraServiceError as exc:
        if is_ajax(request):
            return JsonResponse(
                {"success": False, "message": str(exc)},
                status=400
            )

        return render(request, "compras/formulario_editar.html", {
            "compra": compra,
            "form": CompraForm(instance=compra),
            "formset": DetalleCompraFormSet(instance=compra),
            "modo": "editar",
            "action_url": reverse("compras:editar_compra", args=[compra.pk]),
            "error": str(exc)
        })

    prefix = "detalles"

    if request.method == "POST":
        form = CompraForm(request.POST, instance=compra)
        formset = DetalleCompraFormSet(request.POST, instance=compra, prefix=prefix)

        if form.is_valid() and formset.is_valid():
            services.editar_compra(
                compra=compra,
                form=form,
                formset=formset,
                usuario=request.user,
            )
            return JsonResponse({"success": True, "message": "Se editó correctamente"})

        print("=== EDITAR INVALIDA ===")
        print("FORM ERRORS:", form.errors)
        print("FORMSET NON_FORM:", formset.non_form_errors())
        print("FORMSET ERRORS:", formset.errors)

        html = render_to_string(
            "compras/formulario_editar.html",
            {
                "form": form,
                "formset": formset,
                "compra": compra,
                "modo": "editar",
                "action_url": reverse("compras:editar_compra", args=[compra.pk]),
            },
            request=request
        )
        return JsonResponse({"success": False, "html": html}, status=400)

    form = CompraForm(instance=compra)
    formset = DetalleCompraFormSet(instance=compra, prefix=prefix)

    context = {
        "form": form,
        "formset": formset,
        "compra": compra,
        "modo": "editar",
        "action_url": reverse("compras:editar_compra", args=[compra.pk]),
    }

    if is_ajax(request):
        html = render_to_string("compras/formulario_editar.html", context, request=request)
        return JsonResponse({"success": True, "html": html})

    return render(request, "compras/formulario_editar.html", context)

@login_required
@require_POST
def anular_compra(request, pk):
    compra = get_object_or_404(
        Compra.objects.prefetch_related("detalles__producto"),
        pk=pk
    )

    try:
        services.anular_compra(
            compra=compra,
            usuario=request.user,
        )
    except services.CompraServiceError as exc:
        if str(exc) == "La compra ya estaba anulada.":
            return JsonResponse({
                "status": "already",
                "message": str(exc)
            })

        return JsonResponse({
            "success": False,
            "message": str(exc)
        }, status=400)

    return JsonResponse({
        "success": True,
        "message": "Compra anulada y stock revertido."
    })


# =========================
# Comprobantes de compra
# =========================

@login_required
def comprobante_compra_preview(request, pk):
    compra = get_object_or_404(
        Compra.objects.select_related("proveedor", "usuario")
        .prefetch_related("detalles__producto"),
        pk=pk
    )

    html = render_to_string(
        "compras/comprobante_vista_previa.html",
        {"compra": compra},
        request=request
    )
    return JsonResponse({"success": True, "html": html})



@login_required
def comprobante_compra_excel(request, pk):
    compra = get_object_or_404(
        Compra.objects.select_related("proveedor", "usuario")
        .prefetch_related("detalles__producto"),
        pk=pk
    )
    return build_comprobante_excel_response(compra)


# =========================
# Devoluciones de compra
# =========================
@login_required
@require_http_methods(["GET", "POST"])
def crear_devolucion_compra(request):
    compra_ref = None

    if request.method == "POST":
        form = DevolucionCompraForm(request.POST)

        compra_id = request.POST.get("compra")
        if compra_id:
            compra_ref = Compra.objects.filter(pk=compra_id, anulada=False).first()

        formset = DetalleDevolucionCompraFormSet(
            request.POST,
            prefix="detalles",
            form_kwargs={"compra": compra_ref}
        )

        if form.is_valid() and formset.is_valid():
            services.registrar_devolucion_compra(
                form=form,
                formset=formset,
                usuario=request.user,
            )

            messages.success(request, "Devolución registrada correctamente.")
            if is_ajax(request):
                return JsonResponse({"success": True})
            return redirect("compras:lista_compras")

        context = {
            "form": form,
            "formset": formset,
            "action_url": reverse("compras:crear_devolucion_compra"),
            "modo": "crear",
        }

        if is_ajax(request):
            html = render_to_string(
                "compras/form_devolucion.html",
                context,
                request=request
            )
            return JsonResponse({"success": False, "html": html}, status=400)

        return render(request, "compras/crear_devolucion.html", context)

    form = DevolucionCompraForm()
    formset = DetalleDevolucionCompraFormSet(
        prefix="detalles",
        form_kwargs={"compra": compra_ref}
    )

    context = {
        "form": form,
        "formset": formset,
        "action_url": reverse("compras:crear_devolucion_compra"),
        "modo": "crear",
    }

    if is_ajax(request):
        html = render_to_string(
            "compras/form_devolucion.html",
            context,
            request=request
        )
        return JsonResponse({"success": True, "html": html})

    return render(request, "compras/crear_devolucion.html", context)


@login_required
@require_http_methods(["GET"])
def cargar_detalles_compra(request):
    compra_id = request.GET.get("compra_id")

    if not compra_id:
        return JsonResponse({"success": False, "detalles": []}, status=400)

    compra = get_object_or_404(Compra, pk=compra_id, anulada=False)

    detalles = []
    for d in compra.detalles.select_related("producto").all().order_by("producto__nombre"):
        cantidad_ya_devuelta = (
            d.detalles_devolucion
            .filter(devolucion__anulada=False)
            .aggregate(total=Sum("cantidad"))["total"] or 0
        )

        disponible = max((d.cantidad or 0) - cantidad_ya_devuelta, 0)

        if disponible <= 0:
            continue

        detalles.append({
            "id": d.id,
            "texto": (
                f"{d.producto.nombre} | "
                f"Comprado: {d.cantidad} | "
                f"Devuelto: {cantidad_ya_devuelta} | "
                f"Disponible: {disponible} | "
                f"Precio: ${d.precio_unitario}"
            ),
            "precio_unitario": int(d.precio_unitario or 0),
            "disponible": disponible,
        })

    return JsonResponse({
        "success": True,
        "detalles": detalles,
    })

@login_required
@require_POST
def anular_devolucion_compra(request, pk):
    devolucion = get_object_or_404(
        DevolucionCompra.objects.prefetch_related("detalles__producto"),
        pk=pk
    )

    try:
        services.anular_devolucion_compra(
            devolucion=devolucion,
            usuario=request.user,
        )
    except services.CompraServiceError as exc:
        return JsonResponse({
            "success": False,
            "message": str(exc)
        })

    return JsonResponse({
        "success": True,
        "message": "Devolución anulada y stock restaurado."
    })

# =========================
# Comprobante de devolución
# =========================
@login_required
@require_http_methods(["GET"])
def comprobante_devolucion_compra_preview(request, pk):
    devolucion = get_object_or_404(
        DevolucionCompra.objects
        .select_related("compra", "proveedor", "usuario")
        .prefetch_related("detalles__producto"),
        pk=pk
    )

    html = render_to_string(
        "compras/detalle_devolucion_compra.html",
        {
            "d": devolucion,
            "titulo_documento": "Comprobante de devolución de compra",
            "logo_src": static("compras/img/logo_monakeratina.png"),
            "watermark_src": static("compras/img/logo_monakeratina_watermark.png"),
        },
        request=request
    )
    return JsonResponse({"success": True, "html": html})