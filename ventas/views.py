from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Q
from .models import Venta, DetalleVenta
from compras.models import DetalleCompra
from django.contrib import messages
from .forms import VentaForm
from Productos.models import Producto  
from django.core.exceptions import ValidationError
import json
from django.db import transaction
from servicios.models import Servicio  
from django.db.models import Sum
from django.http import JsonResponse
from decimal import Decimal
from django.views.decorators.http import require_POST
from django.template.loader import render_to_string
from django.apps import apps
Personal = apps.get_model("personal", "Personal")




def lista_ventas(request):
    q = request.GET.get("q", "").strip()
    estado = request.GET.get("estado", "activa").strip()

    ventas = (
        Venta.objects
        .select_related("cliente")
        .prefetch_related("detalles__producto", "detalles__servicio")
        .all()
    )

    if q:
        ventas = ventas.filter(
            Q(codigo_venta__icontains=q)
            | Q(cliente__nombre__icontains=q)
            | Q(cliente__apellido__icontains=q)
        )

    if estado:
        ventas = ventas.filter(estado=estado)
        
    ventas = ventas.order_by("-fecha")

    return render(
        request,
        "ventas/lista_ventas.html",
        {
            "ventas": ventas,
            "q": q,
            "estado": estado,
        },
    )
    
@require_POST
def toggle_estado_venta(request, venta_id):
    venta = get_object_or_404(Venta, id=venta_id)
    venta.estado = "anulada" if venta.estado == "activa" else "activa"
    venta.save()
    messages.success(
        request,
        f"Estado actualizado correctamente: {venta.estado.upper()}"
    )

    return redirect("ventas:lista")
def es_ajax(request):
    return request.headers.get("x-requested-with") == "XMLHttpRequest"

def render_crear_venta(request, form, productos_stock, servicios, personal, status=200):
    """
    - Si es AJAX: retorna HTML parcial para meterlo dentro del modal.
    - Si no es AJAX: retorna la página completa normal.
    """
    if es_ajax(request):
        html = render_to_string(
            "ventas/partials/crear_venta_form.html",
            {
                "form": form,
                "productos_stock": productos_stock,
                "servicios": servicios,
                "personal": personal,
            },
            request=request
        )
        return JsonResponse({"success": False, "html": html}, status=status)

    return render(request, "ventas/crear_venta.html", {
        "form": form,
        "productos_stock": productos_stock,
        "servicios": servicios,
        "personal": personal,
    }, status=status)

@transaction.atomic
def crear_venta(request):
    print(">>> ENTRÓ A crear_venta (views.py correcto)")
    productos = Producto.objects.all()
    productos_stock = []

    for p in productos:
        entradas = DetalleCompra.objects.filter(
            producto=p
        ).aggregate(total=Sum("cantidad"))["total"] or 0

        salidas = DetalleVenta.objects.filter(
            producto=p,
            venta__estado='activa'
        ).aggregate(total=Sum("cantidad"))["total"] or 0

        stock_real = entradas - salidas

        productos_stock.append({"producto": p, "stock": stock_real})

    servicios = Servicio.objects.all()
    personal = Personal.objects.filter(rol='COL', activo=True).order_by('nombres', 'apellidos')

    if request.method == "POST":
        print(">>> POST LLEGÓ")
        form = VentaForm(request.POST)
        items_json = request.POST.get("items")

        print(">>> items_json RAW:", items_json)
        print(">>> form.is_valid:", form.is_valid())
        print(">>> form.errors:", form.errors)

        # 1) Validar items_json
        if not items_json:
            messages.error(request, "No se recibieron items. Agrega al menos 1 producto o servicio.")
            return render(request, "ventas/crear_venta.html", {
                "form": form,
                "productos_stock": productos_stock,
                "servicios": servicios,
                "personal": personal,
            })

        # 2) Convertir JSON a lista
        try:
            items = json.loads(items_json)
        except json.JSONDecodeError:
            messages.error(request, "El JSON de items llegó dañado. Revisa ventas.js.")
            return render(request, "ventas/crear_venta.html", {
                "form": form,
                "productos_stock": productos_stock,
                "servicios": servicios,
                "personal": personal,
            })

        print(">>> items PARSEADOS:", items)

        # 3) Debe haber items
        if not items:
            messages.error(request, "Agrega al menos 1 producto o servicio antes de guardar.")
            return render(request, "ventas/crear_venta.html", {
                "form": form,
                "productos_stock": productos_stock,
                "servicios": servicios,
                "personal": personal,
            })

        # 4) Validar formulario
        if not form.is_valid():
            messages.error(request, "Formulario inválido. Revisa los campos.")
            return render(request, "ventas/crear_venta.html", {
                "form": form,
                "productos_stock": productos_stock,
                "servicios": servicios,
                "personal": personal,
            })

        # ===============================
        # CREAR VENTA
        # ===============================
        venta = form.save(commit=False)
        venta.codigo_colaborador = "PENDIENTE"
        venta.nombre_colaborador = "Pendiente"

        # ✅ codigo_producto es obligatorio en tu modelo Venta
        # lo llenamos con un resumen simple
        it0 = items[0]
        if it0.get("tipo") == "producto":
            base = it0.get("id", "")
        else:
            base = it0.get("id_servicio", "")
        venta.codigo_producto = str(base) if len(items) == 1 else f"{base} (+{len(items)-1})"

        venta.save()

        # ===============================
        # GUARDAR DETALLES
        # ===============================
        for item in items:
            if item.get("tipo") == "producto":
                codigo = item.get("id")
                if not codigo:
                    continue
                    entradas = DetalleCompra.objects.filter(
                        producto=producto
                    ).aggregate(total=Sum("cantidad"))["total"] or 0

                producto = Producto.objects.select_for_update().get(codigo=codigo)

                entradas = DetalleMovimiento.objects.filter(producto=producto).aggregate(total=Sum("cantidad"))["total"] or 0
                salidas = DetalleVenta.objects.filter(producto=producto, venta__estado="activa").aggregate(total=Sum("cantidad"))["total"] or 0
                stock_real = entradas - salidas

                if int(item["cantidad"]) > stock_real:
                    raise ValidationError(f"Stock insuficiente para {producto.nombre}")

                DetalleVenta.objects.create(
                    venta=venta,
                    producto=producto,
                    precio_unitario=Decimal(str(item["precio"])),
                    cantidad=int(item["cantidad"]),
                    subtotal=Decimal(str(item["subtotal"])),
                )

            elif item.get("tipo") == "servicio":
                servicio = Servicio.objects.get(id_servicio=item["id_servicio"])
                colaborador = Personal.objects.get(id=item["id_personal"])

                DetalleVenta.objects.create(
                    venta=venta,
                    servicio=servicio,
                    colaborador_servicio=colaborador,
                    precio_unitario=Decimal(str(item["precio"])),
                    cantidad=int(item.get("cantidad", 1)),
                    subtotal=Decimal(str(item.get("subtotal", item["precio"]))),
                )

        messages.success(request, "Venta registrada correctamente.")
        if es_ajax(request):
            return JsonResponse({"success": True})

        return redirect("ventas:lista")

    # GET
    form = VentaForm()
    if es_ajax(request):
        html = render_to_string(
            "ventas/partials/crear_venta_form.html",
            {
                "form": form,
                "productos_stock": productos_stock,
                "servicios": servicios,
                "personal": personal,
            },
            request=request
        )
        return JsonResponse({"success": True, "html": html})

    return render(request, "ventas/crear_venta.html", {
        "form": form,
        "productos_stock": productos_stock,
        "servicios": servicios,
        "personal": personal,
    })



def editar_venta_modal(request, pk):
    venta = get_object_or_404(Venta, pk=pk)

    # separamos detalles
    detalles_productos = venta.detalles.filter(producto__isnull=False)
    detalles_servicios = venta.detalles.filter(servicio__isnull=False)

    servicios = Servicio.objects.all()
    personal = Personal.objects.filter(rol='COL', activo=True).order_by('nombres', 'apellidos')

    if request.method == "POST":
        # --- PRODUCTOS ---
        for det in detalles_productos:
            cantidad = request.POST.get(f"prod_cant_{det.id}")
            precio = request.POST.get(f"prod_precio_{det.id}")

            if cantidad is not None and precio is not None:
                det.cantidad = int(cantidad)
                det.precio_unitario = Decimal(precio)
                det.subtotal = det.cantidad * det.precio_unitario
                det.save()

        # --- SERVICIOS ---
        for det in detalles_servicios:
            cantidad = request.POST.get(f"serv_cant_{det.id}")
            servicio_id = request.POST.get(f"serv_servicio_{det.id}")
            personal_id = request.POST.get(f"serv_personal_{det.id}")

            if cantidad is not None:
                det.cantidad = int(cantidad)

            if servicio_id:
                det.servicio = Servicio.objects.get(pk=servicio_id)

            if personal_id:
                det.colaborador_servicio = Personal.objects.get(pk=personal_id)

            # precio NO editable: lo tomamos del servicio
            det.precio_unitario = det.servicio.precio
            det.subtotal = det.cantidad * det.precio_unitario
            det.save()

        return JsonResponse({"ok": True})

    # GET: render del modal
    return render(request, "ventas/form_editar_venta.html", {
        "venta": venta,
        "detalles_productos": detalles_productos,
        "detalles_servicios": detalles_servicios,
        "servicios": servicios,
        "personal": personal,
    })

def detalle_venta_json(request, pk):
    venta = get_object_or_404(Venta, pk=pk)

    data = {
        "id": venta.id,
        "codigo_venta": getattr(venta, "codigo_venta", ""),
        "cliente": str(getattr(venta, "cliente", "")),
        "codigo_producto": getattr(venta, "codigo_producto", ""),
        "fecha": venta.fecha.strftime("%d/%m/%Y %H:%M") if getattr(venta, "fecha", None) else "",
        "precio_unitario": str(getattr(venta, "precio_unitario", "")),
        "cantidad": str(getattr(venta, "cantidad", "")),
        "subtotal": str(getattr(venta, "subtotal", "")),
        "estado": getattr(venta, "estado", ""),
        "observaciones": getattr(venta, "observaciones", ""),
    }

    return JsonResponse(data)

@transaction.atomic
def anular_venta(request, venta_id):
    venta = get_object_or_404(Venta, id=venta_id)

    if venta.estado == 'anulada':
        return redirect('ventas:lista')

    if request.method == "POST":
        venta.estado = 'anulada'
        venta.save()

    return redirect('ventas:lista')



def clean(self):
    if self.cantidad <= 0:
        raise ValidationError("La cantidad debe ser mayor a 0")

    if self.precio_unitario <= 0:
        raise ValidationError("El precio debe ser mayor a 0")
