from django.contrib.auth.decorators import login_required
from django.http import JsonResponse
from django.views.decorators.http import require_POST
from django.utils.timesince import timesince
from django.utils import timezone
from .models import Notificacion


def _es_admin_o_auxiliar(user):
    if user.is_superuser:
        return True
    return user.groups.filter(name__in=['Administrador', 'Auxiliar']).exists()


# ─── GET /notificaciones/listar/ ─────────────────────────────────────────────
@login_required
def listar_notificaciones(request):
    if not _es_admin_o_auxiliar(request.user):
        return JsonResponse({'permitido': False, 'notificaciones': [], 'total': 0, 'urgentes': 0})

    notifs = Notificacion.objects.filter(
        destinatario=request.user,
        leida=False,
    ).order_by('-urgente', '-fecha_creacion')[:20]

    data = []
    for n in notifs:
        data.append({
            'id':      n.id,
            'titulo':  n.titulo,
            'mensaje': n.mensaje,
            'tipo':    n.tipo,
            'urgente': n.urgente,
            'icono':   n.icono,
            'color':   n.color_icono,
            'hace':    timesince(n.fecha_creacion, timezone.now()),
        })

    urgentes = sum(1 for n in data if n['urgente'])

    return JsonResponse({
        'permitido':      True,
        'notificaciones': data,
        'total':          len(data),
        'urgentes':       urgentes,
    })


# ─── POST /notificaciones/<id>/leer/ ─────────────────────────────────────────
@login_required
@require_POST
def marcar_leida(request, notif_id):
    if not _es_admin_o_auxiliar(request.user):
        return JsonResponse({'success': False}, status=403)
    try:
        n = Notificacion.objects.get(id=notif_id, destinatario=request.user)
        n.leida = True
        n.save(update_fields=['leida'])
        return JsonResponse({'success': True})
    except Notificacion.DoesNotExist:
        return JsonResponse({'success': False}, status=404)


# ─── POST /notificaciones/leer-todas/ ────────────────────────────────────────
@login_required
@require_POST
def marcar_todas_leidas(request):
    if not _es_admin_o_auxiliar(request.user):
        return JsonResponse({'success': False}, status=403)

    Notificacion.objects.filter(
        destinatario=request.user,
        leida=False,
    ).update(leida=True)

    return JsonResponse({'success': True})