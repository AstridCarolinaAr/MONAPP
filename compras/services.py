from django.db import transaction
from django.db.models import Sum
from django.utils import timezone

from Productos.models import Producto
from inventario.services import aplicar_movimiento_stock


class CompraServiceError(Exception):
    pass


def validar_compra_editable(compra):
    if compra.devoluciones.filter(anulada=False).exists():
        raise CompraServiceError("No se puede editar una compra con devoluciones activas.")

    if compra.anulada:
        raise CompraServiceError("No se puede editar una compra anulada.")


def registrar_compra(*, form, formset, usuario):
    with transaction.atomic():
        compra = form.save(commit=False)
        compra.usuario = usuario

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
                usuario=usuario,
                compra=compra,
                observacion=f"Registro de compra #{compra.id}"
            )

        formset.save_m2m()

    return compra


def editar_compra(*, compra, form, formset, usuario):
    validar_compra_editable(compra)

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

            producto_obj = compra.detalles.filter(producto_id=pid).select_related("producto").first()
            if producto_obj:
                producto_ref = producto_obj.producto
            else:
                producto_ref = Producto.objects.get(pk=pid)

            aplicar_movimiento_stock(
                producto=producto_ref,
                delta=delta,
                tipo_movimiento="COMPRA_EDICION",
                usuario=usuario,
                compra=compra,
                observacion=f"Edición de compra #{compra.id}"
            )

    return compra


def anular_compra(*, compra, usuario):
    if compra.anulada:
        raise CompraServiceError("La compra ya estaba anulada.")

    if compra.devoluciones.filter(anulada=False).exists():
        raise CompraServiceError("No se puede anular la compra porque tiene devoluciones activas.")

    with transaction.atomic():
        qtys = (
            compra.detalles.values("producto_id")
            .annotate(total=Sum("cantidad"))
            .values_list("producto_id", "total")
        )

        for pid, total in qtys:
            producto_ref = Producto.objects.get(pk=pid)

            aplicar_movimiento_stock(
                producto=producto_ref,
                delta=-(total or 0),
                tipo_movimiento="COMPRA_ANULACION",
                usuario=usuario,
                compra=compra,
                observacion=f"Anulación de compra #{compra.id}"
            )

        compra.fecha_anulada = timezone.now().date()
        compra.anulada_en = timezone.now()
        compra.anulada = True
        compra.save(update_fields=["anulada", "fecha_anulada", "anulada_en"])

    return compra


def registrar_devolucion_compra(*, form, formset, usuario):
    with transaction.atomic():
        devolucion = form.save(commit=False)
        devolucion.usuario = usuario
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
                usuario=usuario,
                devolucion=devolucion,
                observacion=f"Registro de devolución #{devolucion.id}"
            )

            total += detalle_dev.subtotal

        devolucion.total = total
        devolucion.save(update_fields=["total"])

    return devolucion


def anular_devolucion_compra(*, devolucion, usuario):
    if devolucion.anulada:
        raise CompraServiceError("La devolución ya estaba anulada.")

    with transaction.atomic():
        for d in devolucion.detalles.all():
            aplicar_movimiento_stock(
                producto=d.producto,
                delta=(d.cantidad or 0),
                tipo_movimiento="DEV_COMPRA_ANULACION",
                usuario=usuario,
                devolucion=devolucion,
                observacion=f"Anulación de devolución #{devolucion.id}"
            )

        devolucion.anulada = True
        devolucion.fecha_anulada = timezone.now().date()
        devolucion.anulada_en = timezone.now()
        devolucion.save(update_fields=["anulada", "fecha_anulada", "anulada_en"])

    return devolucion