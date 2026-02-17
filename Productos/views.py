from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.db.models import Q, Count
from collections import Counter
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.db.models.deletion import ProtectedError
from django.urls import reverse
from django.template.loader import render_to_string

from .models import Producto
from .forms import ProductoForm
from compras.models import DetalleCompra



def is_ajax(request):
    return request.headers.get("x-requested-with") == "XMLHttpRequest"



def lista_productos(request):
    productos = Producto.objects.all()

    linea = request.GET.get("linea")
    if linea:
        productos = productos.filter(linea=linea)

    q = request.GET.get("q")
    if q:
        productos = productos.filter(
            Q(nombre__icontains=q)
            | Q(codigo__icontains=q)
            | Q(marca__icontains=q)
            | Q(presentacion__icontains=q)
            | Q(estado__icontains=q)
        )

    orden = request.GET.get("orden")
    if orden == "nombre":
        productos = productos.order_by("nombre")
    elif orden == "nombre_desc":
        productos = productos.order_by("-nombre")
    elif orden == "codigo":
        productos = productos.order_by("nombre")
    elif orden == "marca":
        productos = productos.order_by("marca")
    elif orden == "presentacion":
        productos = productos.order_by("presentacion")
    else:
        productos = productos.order_by("nombre")

    total_productos = productos.count()

    productos_por_linea = (
        Producto.objects.values("linea")
        .annotate(total=Count("codigo"))
        .order_by("linea")
    )

    return render(request, "productos/lista_productos.html", {
        "productos": productos,
        "total_productos": total_productos,
        "productos_por_linea": productos_por_linea,
        "linea_seleccionada": linea,
    })


def crear_producto(request):
    form = ProductoForm(request.POST or None, request.FILES or None)

    if request.method == "POST" and form.is_valid():
        producto = form.save()
        messages.success(request, f'Producto "{producto.nombre}" creado correctamente.')

        if is_ajax(request):
            return JsonResponse({"success": True})

        return redirect("productos:lista_productos")

    context = {
        "form": form,
        "action_url": reverse("productos:crear_producto"),
        "submit_label": "Crear",
        "title": "Crear producto",
    }

    if is_ajax(request):
        html = render_to_string("productos/formulario_producto.html", context, request=request)
        return JsonResponse({"success": False, "html": html, "title": context["title"]})

    return render(request, "productos/crear_producto.html", context)


def editar_producto(request, codigo):
    producto = get_object_or_404(Producto, codigo=codigo)
    form = ProductoForm(request.POST or None, request.FILES or None, instance=producto)

    if request.method == "POST" and form.is_valid():
        producto = form.save()
        messages.success(request, f'Producto "{producto.nombre}" actualizado.')

        if is_ajax(request):
            return JsonResponse({"success": True})

        return redirect("productos:lista_productos")

    context = {
        "form": form,
        "action_url": reverse("productos:editar_producto", args=[codigo]),
        "submit_label": "Guardar cambios",
        "title": f"Editar producto: {producto.nombre}",
        "producto": producto,
    }

    if is_ajax(request):
        html = render_to_string("productos/formulario_producto.html", context, request=request)
        return JsonResponse({"success": False, "html": html, "title": context["title"]})

    return render(request, "productos/editar_producto.html", context)

@require_POST
def eliminar_producto(request, codigo):
    producto = get_object_or_404(Producto, codigo=codigo)

    action = request.POST.get("action", "delete").lower()

    if action == "activate":
        producto.activo = True
        producto.save(update_fields=["activo"])
        return JsonResponse({"status": "activated"})

    if action == "deactivate":
        producto.activo = False
        producto.save(update_fields=["activo"])
        return JsonResponse({"status": "inactivated"})

    try:
        producto.delete()
        return JsonResponse({"status": "deleted"})
    except ProtectedError as e:
        labels = [obj._meta.verbose_name_plural for obj in e.protected_objects]
        counts = Counter(labels)

        detalles = [{"nombre": k, "cantidad": v} for k, v in counts.items()]

        return JsonResponse({
            "status": "protected",
            "detalles": detalles,
        })