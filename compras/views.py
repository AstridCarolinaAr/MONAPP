from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from django.template.loader import render_to_string
from django.views.decorators.http import require_http_methods, require_POST
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Sum,F,Q
from .models import Compra, DevolucionCompra
from .forms import (
    CompraForm,
    DetalleCompraFormSet,
    DevolucionCompraForm,
    DetalleDevolucionCompraFormSet,
)
from inventario.models import Stock
from Productos.models import Producto

from inventario.services import aplicar_movimiento_stock
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.db import transaction
import io
from django.http import JsonResponse, HttpResponse
from django.template.loader import render_to_string
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from openpyxl import Workbook
from .comprobante import(build_comprobante_pdf_response,build_comprobante_excel_response)
from django.templatetags.static import static
from django.utils.text import slugify
from django.http import HttpResponse, JsonResponse
from django.template.loader import render_to_string


def is_ajax(request):
    return request.headers.get("x-requested-with") == "XMLHttpRequest"

@login_required
def comprobante_compra(request, pk):
    compra = get_object_or_404(
        Compra.objects.select_related("proveedor", "usuario")
        .prefetch_related("detalles__producto"),
        pk=pk
    )

    return render(request, "compras/comprobante_compra.html", {
        "compra": compra
    })
    
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
            Compra.objects.select_related("proveedor", "usuario")
            .prefetch_related("detalles__producto")
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
            with transaction.atomic():
                compra = form.save(commit=False)
                compra.usuario = request.user

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

                    aplicar_movimiento_stock(
                        producto=d.producto,
                        delta=(d.cantidad or 0),
                        tipo_movimiento="COMPRA_ENTRADA",
                        usuario=request.user,
                        compra=compra,
                        observacion=f"Registro de compra #{compra.id}"
                    )
                formset.save_m2m()

            messages.success(request, "Compra registrada correctamente.")
            if is_ajax(request):
                return JsonResponse({"success": True})
            return redirect("compras:lista_compras")

        context = {
            "form": form,
            "formset": formset,
            "action_url": reverse("compras:crear_compra"),
            "compra": None,
        }
        context ["modo"]="crear"
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

    if compra.anulada:
        if is_ajax(request):
            return JsonResponse(
                {"success": False, "message": "No se puede editar una compra anulada."},
                status=400
            )
        # no-ajax
        return render(request, "compras/formulario_editar.html", {
            "compra": compra,
            "form": CompraForm(instance=compra),
            "formset": DetalleCompraFormSet(instance=compra),
            "modo": "editar",
            "action_url": reverse("compras:editar_compra", args=[compra.pk]),
            "error": "No se puede editar una compra anulada."
        })

    PREFIX = "detalles"  

    if request.method == "POST":
        form = CompraForm(request.POST, instance=compra)
        formset = DetalleCompraFormSet(request.POST, instance=compra, prefix=PREFIX)

        if form.is_valid() and formset.is_valid():
            with transaction.atomic():
                old_map = dict(
                    compra.detalles.values("producto_id")
                    .annotate(total=Sum("cantidad"))
                    .values_list("producto_id", "total")
                )

                compra = form.save()
                formset.save()

                total = 0
                for d in compra.detalles.all():
                    total += d.cantidad * d.precio_unitario
                compra.precio_total = total
                compra.save(update_fields=["precio_total"])

                new_map = dict(
                    compra.detalles.values("producto_id")
                    .annotate(total=Sum("cantidad"))
                    .values_list("producto_id", "total")
                )

                producto_ids = set(old_map.keys()) | set(new_map.keys())
            producto_obj = compra.detalles.filter(producto_id=pid).select_related("producto").first()
            if producto_obj:
                producto_ref = producto_obj.producto
            else:
                from Productos.models import Producto
                producto_ref = Producto.objects.get(pk=pid)

            aplicar_movimiento_stock(
                producto=producto_ref,
                delta=delta,
                tipo_movimiento="COMPRA_EDICION",
                usuario=request.user,
                compra=compra,
                observacion=f"Edición de compra #{compra.id}"
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
    formset = DetalleCompraFormSet(instance=compra, prefix=PREFIX)

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
    compra = get_object_or_404(Compra, pk=pk)

    if compra.anulada:
        return JsonResponse({"status": "already", "message": "La compra ya estaba anulada."})

    with transaction.atomic():

        qtys = (
            compra.detalles.values("producto_id")
            .annotate(total=Sum("cantidad"))
            .values_list("producto_id", "total")
        )

        producto_ref = Producto.objects.get(pk=pid)

        aplicar_movimiento_stock(
            producto=producto_ref,
            delta=-(total or 0),
            tipo_movimiento="COMPRA_ANULACION",
            usuario=request.user,
            compra=compra,
            observacion=f"Anulación de compra #{compra.id}"
        )
        compra.fecha_anulada=timezone.now()    
        compra.anulada = True
        compra.save(update_fields=["anulada","fecha_anulada"])

    return JsonResponse({
        "success": True,
        "message": "Compra anulada y stock revertido."
    })
    

# =========================
# Vista previa HTML del comprobante de compra
# =========================
# =========================
# Vista previa HTML del comprobante de compra
# =========================
@login_required
def comprobante_compra_preview(request, pk):
    compra = get_object_or_404(
        Compra.objects.select_related("proveedor", "usuario").prefetch_related("detalles__producto"),
        pk=pk
    )

    html = render_to_string(
        "compras/comprobante_vista_previa.html",
        {"compra": compra},
        request=request
    )
    return JsonResponse({"success": True, "html": html})


# ========================= compra comprobante pdf ========================
# =========================
@login_required
def comprobante_compra_pdf(request, pk):
    compra = get_object_or_404(
        Compra.objects.select_related("proveedor", "usuario").prefetch_related("detalles__producto"),
        pk=pk
    )

    return render(
        request,
        "compras/comprobante_compra_pdf.html",
        {"compra": compra},
    )


# =========================
# Descarga Excel del comprobante de compra
# =========================
@login_required
def comprobante_compra_excel(request, pk):
    compra = get_object_or_404(
        Compra.objects.select_related("proveedor", "usuario").prefetch_related("detalles__producto"),
        pk=pk
    )
    return build_comprobante_excel_response(compra)

# =========================
#devolucion de compra
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
            with transaction.atomic():
                devolucion = form.save(commit=False)
                devolucion.usuario = request.user
                devolucion.proveedor = devolucion.compra.proveedor
                devolucion.total = 0
                devolucion.save()

                total = 0
        for f in formset:
            if not f.cleaned_data or f.cleaned_data.get("DELETE") or not f.has_changed():
                continue

            detalle_compra = f.cleaned_data.get("detalle_compra")
            cantidad = f.cleaned_data.get("cantidad") or 0

            if not detalle_compra or not cantidad:
                continue

            detalle_dev = f.save(commit=False)
            detalle_dev.devolucion = devolucion
            detalle_dev.producto = detalle_compra.producto
            detalle_dev.precio_unitario = detalle_compra.precio_unitario
            detalle_dev.save()

            aplicar_movimiento_stock(
                producto=detalle_dev.producto,
                delta=-(cantidad or 0),
                tipo_movimiento="DEV_COMPRA_SALIDA",
                usuario=request.user,
                devolucion=devolucion,
                observacion=f"Registro de devolución #{devolucion.id}"
            )

            total += detalle_dev.subtotal
            devolucion.total = total
            devolucion.save(update_fields=["total"])

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
        detalles.append({
            "id": d.id,
            "texto": f"{d.producto.nombre} - Cantidad comprada: {d.cantidad} - Precio: ${d.precio_unitario}",
            "precio_unitario": int(d.precio_unitario or 0),
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

    if devolucion.anulada:
        return JsonResponse({
            "success": False,
            "message": "La devolución ya estaba anulada."
        })

    with transaction.atomic():
        for d in devolucion.detalles.all():
            aplicar_movimiento_stock(
                producto=d.producto,
                delta=(d.cantidad or 0),
                tipo_movimiento="DEV_COMPRA_ANULACION",
                usuario=request.user,
                devolucion=devolucion,
                observacion=f"Anulación de devolución #{devolucion.id}"
        )
        devolucion.anulada = True
        devolucion.fecha_anulada = timezone.now().date()
        devolucion.anulada_en = timezone.now()
        devolucion.save(update_fields=["anulada", "fecha_anulada", "anulada_en"])

    return JsonResponse({
        "success": True,
        "message": "Devolución anulada y stock restaurado."
    })
    
@login_required
@require_http_methods(["GET"])
def lista_devoluciones_compra(request):
    estado = request.GET.get("estado", "activas").strip()
    fecha = request.GET.get("fecha", "").strip()
    fecha_desde = request.GET.get("fecha_desde", "").strip()
    fecha_hasta = request.GET.get("fecha_hasta", "").strip()
    busqueda = request.GET.get("q", "").strip()

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

    if fecha_desde and fecha_hasta and fecha_desde > fecha_hasta:
        fecha_desde, fecha_hasta = fecha_hasta, fecha_desde

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

    context = {
        "devoluciones": devoluciones_qs,
        "total_devoluciones": total_devoluciones,
        "estado_actual": estado,
        "fecha_actual": fecha,
        "fecha_desde_actual": fecha_desde,
        "fecha_hasta_actual": fecha_hasta,
        "q_actual": busqueda,
    }

    return render(request, "compras/devoluciones_compra.html", context)