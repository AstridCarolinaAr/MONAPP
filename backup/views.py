import os
import json
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.http import FileResponse, JsonResponse, Http404
from django.views.decorators.http import require_POST
from django.utils import timezone

from .models import BackupRecord, BackupConfig
from .services import (
    crear_backup_base_datos,
    crear_backup_completo,
    crear_backup_media,
    restaurar_backup,
    get_database_stats,
    get_all_tables,
    obtener_info_backup_zip,
)


def es_administrador(user):
    return user.is_superuser or user.is_staff


# ======================== DASHBOARD DE BACKUP ========================

@login_required
@user_passes_test(es_administrador)
def backup_dashboard(request):
    """Vista principal del módulo de backup."""
    backups = BackupRecord.objects.all()[:20]
    config = BackupConfig.get_config()
    stats = get_database_stats()

    # Estadísticas de backups
    total_backups = BackupRecord.objects.count()
    exitosos = BackupRecord.objects.filter(estado='exitoso').count()
    fallidos = BackupRecord.objects.filter(estado='fallido').count()
    ultimo = BackupRecord.objects.filter(estado='exitoso').first()

    context = {
        'backups': backups,
        'config': config,
        'stats': stats,
        'total_backups': total_backups,
        'exitosos': exitosos,
        'fallidos': fallidos,
        'ultimo_backup': ultimo,
    }
    return render(request, 'backup/dashboard.html', context)


# ======================== CREAR BACKUP ========================

@login_required
@user_passes_test(es_administrador)
@require_POST
def crear_backup(request):
    """Crea un nuevo backup según el tipo seleccionado."""
    tipo = request.POST.get('tipo', 'completo').strip()
    nombre = request.POST.get('nombre', '').strip()
    notas = request.POST.get('notas', '').strip()

    # ==================== VALIDACIONES ====================
    # Validar tipo
    tipos_validos = ['completo', 'base_datos', 'media']
    if tipo not in tipos_validos:
        messages.error(request, 'Tipo de backup inválido.')
        return redirect('backup:dashboard')

    # Validar nombre si no está vacío
    if nombre:
        if len(nombre) < 3:
            messages.error(request, 'El nombre debe tener al menos 3 caracteres.')
            return redirect('backup:dashboard')
        if len(nombre) > 255:
            messages.error(request, 'El nombre no puede exceder 255 caracteres.')
            return redirect('backup:dashboard')
        # Validar caracteres permitidos
        import re
        if not re.match(r'^[a-zA-Z0-9_\-áéíóúñ\s\.]+$', nombre):
            messages.error(request, 'El nombre contiene caracteres no permitidos.')
            return redirect('backup:dashboard')

    # Validar notas
    if len(notas) > 500:
        messages.error(request, 'Las notas no pueden exceder 500 caracteres.')
        return redirect('backup:dashboard')

    # No permitir solo espacios
    if nombre == '' and notas != '':
        # OK, puede tener notas sin nombre
        pass

    try:
        if tipo == 'base_datos':
            record = crear_backup_base_datos(
                nombre=nombre or None,
                usuario=request.user,
                notas=notas,
            )
        elif tipo == 'media':
            record = crear_backup_media(
                nombre=nombre or None,
                usuario=request.user,
                notas=notas,
            )
        else:  # completo
            record = crear_backup_completo(
                nombre=nombre or None,
                usuario=request.user,
                notas=notas,
            )

        # Actualizar último backup en config
        config = BackupConfig.get_config()
        config.ultimo_backup = timezone.now()
        config.save()

        messages.success(
            request,
            f'Backup "{record.nombre}" creado exitosamente. '
            f'Tamaño: {record.tamano_legible} | Duración: {record.duracion_segundos}s'
        )

    except FileNotFoundError as e:
        messages.error(request, f'Error de archivo: {str(e)}')
    except PermissionError as e:
        messages.error(request, f'Error de permisos: {str(e)}')
    except Exception as e:
        messages.error(request, f'Error al crear el backup: {str(e)}')

    return redirect('backup:dashboard')


# ======================== DESCARGAR BACKUP ========================

@login_required
@user_passes_test(es_administrador)
def descargar_backup(request, pk):
    """Descarga un archivo de backup."""
    record = get_object_or_404(BackupRecord, pk=pk)

    if not record.archivo or not os.path.exists(record.archivo):
        messages.error(request, 'El archivo de backup no existe en el servidor.')
        return redirect('backup:dashboard')

    response = FileResponse(
        open(record.archivo, 'rb'),
        content_type='application/zip'
    )
    response['Content-Disposition'] = f'attachment; filename="{os.path.basename(record.archivo)}"'
    return response


# ======================== RESTAURAR BACKUP ========================

@login_required
@user_passes_test(es_administrador)
@require_POST
def restaurar_backup_view(request, pk):
    """Restaura un backup previamente creado."""
    record = get_object_or_404(BackupRecord, pk=pk)

    try:
        restaurar_backup(record)
        messages.success(
            request,
            f'Backup "{record.nombre}" restaurado exitosamente. '
            f'Por favor, reinicie el servidor para aplicar todos los cambios.'
        )
    except FileNotFoundError:
        messages.error(request, 'El archivo de backup no existe en el servidor.')
    except Exception as e:
        messages.error(request, f'Error al restaurar: {str(e)}')

    return redirect('backup:dashboard')


# ======================== ELIMINAR BACKUP ========================

@login_required
@user_passes_test(es_administrador)
@require_POST
def eliminar_backup(request, pk):
    """Elimina un registro de backup y su archivo."""
    record = get_object_or_404(BackupRecord, pk=pk)

    if record.archivo and os.path.exists(record.archivo):
        try:
            os.remove(record.archivo)
        except OSError:
            pass

    nombre = record.nombre
    record.delete()
    messages.success(request, f'Backup "{nombre}" eliminado correctamente.')

    return redirect('backup:dashboard')


# ======================== DETALLE BACKUP ========================

@login_required
@user_passes_test(es_administrador)
def detalle_backup(request, pk):
    """Muestra los detalles de un backup específico."""
    record = get_object_or_404(BackupRecord, pk=pk)

    meta = None
    if record.archivo and os.path.exists(record.archivo):
        meta = obtener_info_backup_zip(record.archivo)

    context = {
        'backup': record,
        'meta': meta,
    }
    return render(request, 'backup/detalle.html', context)


# ======================== CONFIGURACIÓN ========================

@login_required
@user_passes_test(es_administrador)
def configuracion_backup(request):
    """Vista de configuración del módulo de backup."""
    config = BackupConfig.get_config()

    if request.method == 'POST':
        config.backup_automatico = request.POST.get('backup_automatico') == 'on'
        config.frecuencia_horas = int(request.POST.get('frecuencia_horas', 24))
        config.max_backups = int(request.POST.get('max_backups', 10))
        config.incluir_media = request.POST.get('incluir_media') == 'on'
        config.ruta_backups = request.POST.get('ruta_backups', '').strip()
        config.save()
        messages.success(request, 'Configuración guardada correctamente.')
        return redirect('backup:configuracion')

    context = {
        'config': config,
    }
    return render(request, 'backup/configuracion.html', context)


# ======================== INFO BD (AJAX) ========================

@login_required
@user_passes_test(es_administrador)
def info_base_datos(request):
    """Devuelve información de la base de datos en formato JSON."""
    stats = get_database_stats()
    return JsonResponse(stats)

