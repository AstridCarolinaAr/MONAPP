# inventario/signals.py

from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.db import models as djmodels

from .models import Stock

UMBRAL_BAJO = 5


def _destinatarios():
    return User.objects.filter(
        is_active=True,
    ).filter(
        djmodels.Q(is_superuser=True) |
        djmodels.Q(groups__name__in=['Administrador', 'Auxiliar'])
    ).distinct().select_related('perfil')


def _emails_destinatarios():
    """Retorna lista de emails de admins/auxiliares que tengan email configurado."""
    return [
        u.email for u in _destinatarios()
        if u.email
    ]


def _crear_notif_stock_cero(nombre):
    """Stock en 0 → SIEMPRE recrea la notificación."""
    from notificaciones.models import Notificacion
    titulo = f'Sin stock: {nombre}'

    for usuario in _destinatarios():
        Notificacion.objects.filter(
            destinatario=usuario,
            titulo=titulo,
        ).delete()
        Notificacion.objects.create(
            destinatario=usuario,
            titulo=titulo,
            mensaje=(
                f'El producto "{nombre}" tiene 0 unidades disponibles. '
                f'Reabastece urgentemente para evitar quiebres de inventario.'
            ),
            tipo='danger',
            urgente=True,
        )


def _crear_notif_stock_bajo(nombre, cantidad):
    """Stock bajo (1-5) → solo crea si no existe ya una no leída."""
    from notificaciones.models import Notificacion
    titulo = f'Stock bajo: {nombre}'

    for usuario in _destinatarios():
        ya_existe = Notificacion.objects.filter(
            destinatario=usuario,
            titulo=titulo,
            leida=False,
        ).exists()
        if not ya_existe:
            Notificacion.objects.create(
                destinatario=usuario,
                titulo=titulo,
                mensaje=(
                    f'El producto "{nombre}" solo tiene {cantidad} '
                    f'unidad{"es" if cantidad != 1 else ""} disponible{"s" if cantidad != 1 else ""}. '
                    f'Considera reabastecer pronto.'
                ),
                tipo='warning',
                urgente=False,
            )


@receiver(post_save, sender=Stock)
def notificar_stock(sender, instance, **kwargs):
    cantidad = instance.cantidad_actual
    nombre   = instance.producto.nombre

    if cantidad <= 0:
        # 1. Notificación en el panel
        _crear_notif_stock_cero(nombre)
        # 2. Email urgente a todos los admins/auxiliares
        from notificaciones.email_alertas import enviar_alerta_stock_cero
        enviar_alerta_stock_cero(nombre, _emails_destinatarios())

    elif 1 <= cantidad <= UMBRAL_BAJO:
        from notificaciones.models import Notificacion
        Notificacion.objects.filter(
            titulo=f'Sin stock: {nombre}',
            leida=True,
        ).delete()
        # 1. Notificación en el panel
        _crear_notif_stock_bajo(nombre, cantidad)
        # 2. Email de aviso stock bajo
        from notificaciones.email_alertas import enviar_alerta_stock_bajo
        enviar_alerta_stock_bajo(nombre, cantidad, _emails_destinatarios())

    else:
        # Stock suficiente → limpiar todas las alertas
        from notificaciones.models import Notificacion
        Notificacion.objects.filter(
            djmodels.Q(titulo=f'Sin stock: {nombre}') |
            djmodels.Q(titulo=f'Stock bajo: {nombre}')
        ).delete()