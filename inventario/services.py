from .models import Stock, MovimientoStock


def aplicar_movimiento_stock(
    *,
    producto,
    delta,
    tipo_movimiento,
    usuario=None,
    compra=None,
    devolucion=None,
    observacion=""
):
    stock_obj = (
        Stock.objects.select_for_update()
        .filter(producto=producto)
        .first()
    )

    if not stock_obj:
        stock_obj = Stock.objects.create(producto=producto, cantidad_actual=0)

    stock_anterior = stock_obj.cantidad_actual or 0
    stock_posterior = stock_anterior + delta

    stock_obj.cantidad_actual = stock_posterior
    stock_obj.save(update_fields=["cantidad_actual", "actualizado_en"])

    MovimientoStock.objects.create(
        producto=producto,
        stock=stock_obj,
        tipo_movimiento=tipo_movimiento,
        cantidad=delta,
        stock_anterior=stock_anterior,
        stock_posterior=stock_posterior,
        usuario=usuario,
        compra=compra,
        devolucion=devolucion,
        observacion=observacion,
    )

    return stock_obj