from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.http import JsonResponse
from django.urls import reverse
from django.template.loader import render_to_string
from django.views.decorators.http import require_http_methods, require_POST
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import Sum,F
from .models import Compra
from .forms import CompraForm, DetalleCompraFormSet
from inventario.models import Stock
from django.views.decorators.csrf import ensure_csrf_cookie
from django.utils import timezone
import io
from django.http import HttpResponse, JsonResponse
from django.contrib.auth.decorators import login_required
from django.db import transaction
from django.db.models import F
from django.utils import timezone
from openpyxl import Workbook
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import letter
from core.global_ordenamiento import apply_smart_sorting,sorting_context

def is_ajax(request):
    return request.headers.get("x-requested-with") == "XMLHttpRequest"


@ensure_csrf_cookie
@login_required
@require_http_methods(["GET"])
def lista_compras(request):
    qs = (
        Compra.objects.select_related("proveedor", "usuario")
        .prefetch_related("detalles__producto")
        .order_by("-id")
    )
    qs, sort_key, direction = apply_smart_sorting(request, qs, default_sort="id", default_dir="desc",aliases={"proveedor":"proveedor__nombre_proveedor","usuario":"usuario__username","fecha":"fecha"})
    compras_activas = qs.filter(anulada=False)
    compras_anuladas = qs.filter(anulada=True).order_by("-fecha_anulada", "-id")

    total_compras = compras_activas.aggregate(total=Sum("precio_total"))["total"] or 0

    context = {
        "compras": compras_activas,               
        "compras_anuladas": compras_anuladas,     
        "total_compras": total_compras,
        **sorting_context(sort_key, direction),
    }
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
                    stock_obj, _ = Stock.objects.get_or_create(producto=d.producto)
                    Stock.objects.filter(pk=stock_obj.pk).update(
                        cantidad_actual=F("cantidad_actual") + (d.cantidad or 0)
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

        for pid, total in qtys:
            stock_obj, _ = Stock.objects.get_or_create(producto_id=pid)
            Stock.objects.filter(pk=stock_obj.pk).update(
                cantidad_actual=F("cantidad_actual") - total
            )
        compra.fecha_anulada=timezone.now()    
        compra.anulada = True
        compra.save(update_fields=["anulada","fecha_anulada"])

    return JsonResponse({
        "success": True,
        "message": "Compra anulada y stock revertido."
    })
    
def _filtrar_anuladas(request):
    qs = Compra.objects.filter(anulada=True)

    desde = request.GET.get("desde") or ""
    hasta = request.GET.get("hasta") or ""
    orden = request.GET.get("orden") or "new"
    q = (request.GET.get("q") or "").strip().lower()

    if desde:
        qs = qs.filter(fecha_anulada__gte=desde)
    if hasta:
        qs = qs.filter(fecha_anulada__lte=hasta)

    if q:
        # búsqueda simple (id, proveedor, usuario)
        # Si proveedor es FK: proveedor__nombre__icontains
        qs = qs.filter(
            # id exacto si es número
            # fallback a icontains
        )
        if q.isdigit():
            qs = qs.filter(id=int(q))
        else:
            qs = qs.filter(
                proveedor__nombre_proveedor__icontains=q
            ) | qs.filter(usuario__username__icontains=q)

    order_by = "fecha_anulada" if orden == "old" else "-fecha_anulada"
    qs = qs.order_by(order_by)
    return qs


@login_required
def export_anuladas_excel(request):
    compras = _filtrar_anuladas(request)

    wb = Workbook()
    ws = wb.active
    ws.title = "Anuladas"

    ws.append(["ID", "Proveedor", "Fecha creación", "Fecha anulación", "Usuario", "Total"])

    for c in compras:
        ws.append([
            c.id,
            str(c.proveedor),
            getattr(c, "fecha", ""),
            getattr(c, "fecha_anulada", ""),
            getattr(c.usuario, "username", ""),
            float(c.precio_total or 0),
        ])

    bio = io.BytesIO()
    wb.save(bio)
    bio.seek(0)

    resp = HttpResponse(
        bio.getvalue(),
        content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    )
    resp["Content-Disposition"] = 'attachment; filename="compras_anuladas.xlsx"'
    return resp


@login_required
def export_anuladas_pdf(request):
    compras = _filtrar_anuladas(request)

    buffer = io.BytesIO()
    p = canvas.Canvas(buffer, pagesize=letter)
    width, height = letter

    y = height - 50
    p.setFont("Helvetica-Bold", 14)
    p.drawString(40, y, "Compras anuladas")
    y -= 25

    p.setFont("Helvetica", 9)
    p.drawString(40, y, f"Generado: {timezone.now().strftime('%Y-%m-%d %H:%M')}")
    y -= 20

    p.setFont("Helvetica-Bold", 9)
    p.drawString(40, y, "ID")
    p.drawString(80, y, "Proveedor")
    p.drawString(260, y, "Creación")
    p.drawString(330, y, "Anulación")
    p.drawString(400, y, "Usuario")
    p.drawRightString(560, y, "Total")
    y -= 15
    p.setFont("Helvetica", 9)

    for c in compras:
      if y < 60:
          p.showPage()
          y = height - 50
          p.setFont("Helvetica", 9)

      p.drawString(40, y, str(c.id))
      p.drawString(80, y, str(c.proveedor)[:28])
      p.drawString(260, y, str(getattr(c, "fecha", ""))[:10])
      p.drawString(330, y, str(getattr(c, "fecha_anulada", ""))[:10])
      p.drawString(400, y, str(getattr(c.usuario, "username", ""))[:14])
      p.drawRightString(560, y, f"${int(c.precio_total or 0):,}".replace(",", "."))
      y -= 14

    p.save()
    buffer.seek(0)

    resp = HttpResponse(buffer.getvalue(), content_type="application/pdf")
    resp["Content-Disposition"] = 'attachment; filename="compras_anuladas.pdf"'
    return resp


@login_required
def restaurar_compra(request, pk):
    if request.method != "POST":
        return JsonResponse({"success": False, "message": "Método no permitido"}, status=405)

    compra = Compra.objects.select_related("usuario", "proveedor").prefetch_related("detalles").filter(pk=pk).first()
    if not compra:
        return JsonResponse({"success": False, "message": "Compra no encontrada"}, status=404)

    if not compra.anulada:
        return JsonResponse({"success": False, "message": "Esta compra no está anulada."}, status=400)

    with transaction.atomic():
        compra.anulada = False
        if hasattr(compra, "fecha_anulada"):
            compra.fecha_anulada = None
        compra.save(update_fields=["anulada"] + (["fecha_anulada"] if hasattr(compra, "fecha_anulada") else []))

        for d in compra.detalles.all():
            stock_obj, _ = Stock.objects.get_or_create(producto=d.producto)
            Stock.objects.filter(pk=stock_obj.pk).update(
                cantidad_actual=F("cantidad_actual") + (d.cantidad or 0)
            )

    return JsonResponse({"success": True, "message": "Compra restaurada"})