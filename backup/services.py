"""
Servicio de backup para MONAPP.
Maneja la lógica de creación, restauración y gestión de backups.
"""

import os
import shutil
import sqlite3
import time
import zipfile
import json
from datetime import datetime

from django.conf import settings
from django.db import connection


def get_backup_dir():
    """Obtiene el directorio de backups, creándolo si no existe."""
    from .models import BackupConfig
    config = BackupConfig.get_config()
    if config.ruta_backups:
        backup_dir = config.ruta_backups
    else:
        backup_dir = os.path.join(settings.BASE_DIR, 'backups')
    os.makedirs(backup_dir, exist_ok=True)
    return backup_dir


def get_database_path():
    """Obtiene la ruta de la base de datos SQLite."""
    return settings.DATABASES['default']['NAME']


def get_all_tables():
    """Obtiene todas las tablas de la base de datos."""
    with connection.cursor() as cursor:
        cursor.execute(
            "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name;"
        )
        return [row[0] for row in cursor.fetchall()]


def get_table_info():
    """Obtiene información detallada de todas las tablas."""
    tables = get_all_tables()
    info = []
    with connection.cursor() as cursor:
        for table in tables:
            try:
                cursor.execute(f'SELECT COUNT(*) FROM "{table}"')
                count = cursor.fetchone()[0]
            except Exception:
                count = 0
            info.append({
                'nombre': table,
                'registros': count,
            })
    return info


def get_database_stats():
    """Obtiene estadísticas de la base de datos."""
    db_path = str(get_database_path())
    db_size = os.path.getsize(db_path) if os.path.exists(db_path) else 0
    tables = get_table_info()
    total_registros = sum(t['registros'] for t in tables)

    # Tamaño de media
    media_root = getattr(settings, 'MEDIA_ROOT', '')
    media_size = 0
    media_files = 0
    if media_root and os.path.exists(str(media_root)):
        for dirpath, dirnames, filenames in os.walk(str(media_root)):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                media_size += os.path.getsize(fp)
                media_files += 1

    return {
        'db_size': db_size,
        'db_size_legible': _format_size(db_size),
        'total_tablas': len(tables),
        'total_registros': total_registros,
        'tablas': tables,
        'media_size': media_size,
        'media_size_legible': _format_size(media_size),
        'media_files': media_files,
    }


def _format_size(size_bytes):
    """Formatea tamaño de bytes a formato legible."""
    for unit in ['B', 'KB', 'MB', 'GB']:
        if size_bytes < 1024:
            return f"{size_bytes:.1f} {unit}"
        size_bytes /= 1024
    return f"{size_bytes:.1f} TB"


def crear_backup_base_datos(nombre=None, usuario=None, notas=''):
    """Crea un backup de la base de datos SQLite."""
    from .models import BackupRecord

    start_time = time.time()
    backup_dir = get_backup_dir()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Validar backup_dir
    if not backup_dir or not os.path.exists(backup_dir):
        raise FileNotFoundError(f"Directorio de backups no accesible: {backup_dir}")

    if not nombre:
        nombre = f"backup_bd_{timestamp}"
    
    # Sanitizar nombre
    nombre = nombre.strip()
    if not nombre:
        nombre = f"backup_bd_{timestamp}"

    filename = f"{nombre}.zip"
    filepath = os.path.join(backup_dir, filename)

    # Validar que el archivo no exista ya
    if os.path.exists(filepath):
        filepath = os.path.join(backup_dir, f"{nombre}_{timestamp}.zip")

    record = BackupRecord.objects.create(
        nombre=nombre,
        tipo='base_datos',
        estado='en_progreso',
        usuario=usuario,
        notas=notas,
    )

    try:
        db_path = str(get_database_path())
        
        # Validar BD existe
        if not os.path.exists(db_path):
            raise FileNotFoundError(f"Base de datos no encontrada: {db_path}")

        # Crear copia temporal de la BD usando la API de backup de SQLite
        temp_db = os.path.join(backup_dir, f"temp_{timestamp}.sqlite3")
        source = sqlite3.connect(db_path)
        dest = sqlite3.connect(temp_db)
        source.backup(dest)
        source.close()
        dest.close()

        # Validar que la copia temporal se creó
        if not os.path.exists(temp_db):
            raise FileNotFoundError("No se pudo crear la copia temporal de la base de datos")

        # Comprimir
        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zf:
            zf.write(temp_db, 'db.sqlite3')

            # Agregar metadatos
            meta = {
                'nombre': nombre,
                'tipo': 'base_datos',
                'fecha': datetime.now().isoformat(),
                'tablas': get_all_tables(),
                'usuario': str(usuario) if usuario else 'Sistema',
                'notas': notas,
            }
            zf.writestr('backup_meta.json', json.dumps(meta, indent=2, ensure_ascii=False))

        # Limpiar temporal
        if os.path.exists(temp_db):
            os.remove(temp_db)

        # Validar que el ZIP se creó correctamente
        if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
            raise FileNotFoundError("El archivo de backup no se creó correctamente")

        duration = time.time() - start_time
        file_size = os.path.getsize(filepath)

        record.archivo = filepath
        record.tamano = file_size
        record.estado = 'exitoso'
        record.duracion_segundos = round(duration, 2)
        record.tablas_incluidas = ', '.join(get_all_tables())
        record.save()

        _limpiar_backups_antiguos()

        return record

    except Exception as e:
        record.estado = 'fallido'
        record.notas = f"{notas}\nError: {str(e)}" if notas else f"Error: {str(e)}"
        record.duracion_segundos = round(time.time() - start_time, 2)
        record.save()
        
        # Limpiar archivo corrupto si existe
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        
        raise


def crear_backup_completo(nombre=None, usuario=None, notas=''):
    """Crea un backup completo (BD + Media)."""
    from .models import BackupRecord

    start_time = time.time()
    backup_dir = get_backup_dir()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Validar backup_dir
    if not backup_dir or not os.path.exists(backup_dir):
        raise FileNotFoundError(f"Directorio de backups no accesible: {backup_dir}")

    if not nombre:
        nombre = f"backup_completo_{timestamp}"
    
    nombre = nombre.strip()
    if not nombre:
        nombre = f"backup_completo_{timestamp}"

    filename = f"{nombre}.zip"
    filepath = os.path.join(backup_dir, filename)

    if os.path.exists(filepath):
        filepath = os.path.join(backup_dir, f"{nombre}_{timestamp}.zip")

    record = BackupRecord.objects.create(
        nombre=nombre,
        tipo='completo',
        estado='en_progreso',
        usuario=usuario,
        notas=notas,
    )

    try:
        db_path = str(get_database_path())

        if not os.path.exists(db_path):
            raise FileNotFoundError(f"Base de datos no encontrada: {db_path}")

        # Backup de BD
        temp_db = os.path.join(backup_dir, f"temp_{timestamp}.sqlite3")
        source = sqlite3.connect(db_path)
        dest = sqlite3.connect(temp_db)
        source.backup(dest)
        source.close()
        dest.close()

        if not os.path.exists(temp_db):
            raise FileNotFoundError("No se pudo crear la copia temporal de la base de datos")

        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zf:
            # BD
            zf.write(temp_db, 'db.sqlite3')

            # Media
            media_root = str(getattr(settings, 'MEDIA_ROOT', ''))
            files_added = False
            if media_root and os.path.exists(media_root):
                for dirpath, dirnames, filenames in os.walk(media_root):
                    for f in filenames:
                        file_path = os.path.join(dirpath, f)
                        arc_name = os.path.join(
                            'media',
                            os.path.relpath(file_path, media_root)
                        )
                        zf.write(file_path, arc_name)
                        files_added = True

            # Metadatos
            meta = {
                'nombre': nombre,
                'tipo': 'completo',
                'fecha': datetime.now().isoformat(),
                'tablas': get_all_tables(),
                'usuario': str(usuario) if usuario else 'Sistema',
                'notas': notas,
                'incluye_media': True,
                'media_files_count': files_added,
            }
            zf.writestr('backup_meta.json', json.dumps(meta, indent=2, ensure_ascii=False))

        if os.path.exists(temp_db):
            os.remove(temp_db)

        if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
            raise FileNotFoundError("El archivo de backup no se creó correctamente")

        duration = time.time() - start_time
        file_size = os.path.getsize(filepath)

        record.archivo = filepath
        record.tamano = file_size
        record.estado = 'exitoso'
        record.duracion_segundos = round(duration, 2)
        record.tablas_incluidas = ', '.join(get_all_tables())
        record.save()

        _limpiar_backups_antiguos()

        return record

    except Exception as e:
        record.estado = 'fallido'
        record.notas = f"{notas}\nError: {str(e)}" if notas else f"Error: {str(e)}"
        record.duracion_segundos = round(time.time() - start_time, 2)
        record.save()
        
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        
        raise


def crear_backup_media(nombre=None, usuario=None, notas=''):
    """Crea un backup solo de archivos media."""
    from .models import BackupRecord

    start_time = time.time()
    backup_dir = get_backup_dir()
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')

    # Validar backup_dir
    if not backup_dir or not os.path.exists(backup_dir):
        raise FileNotFoundError(f"Directorio de backups no accesible: {backup_dir}")

    media_root = str(getattr(settings, 'MEDIA_ROOT', ''))
    if not media_root or not os.path.exists(media_root):
        raise FileNotFoundError(f"Directorio de media no encontrado: {media_root}")

    if not nombre:
        nombre = f"backup_media_{timestamp}"

    nombre = nombre.strip()
    if not nombre:
        nombre = f"backup_media_{timestamp}"

    filename = f"{nombre}.zip"
    filepath = os.path.join(backup_dir, filename)

    if os.path.exists(filepath):
        filepath = os.path.join(backup_dir, f"{nombre}_{timestamp}.zip")

    record = BackupRecord.objects.create(
        nombre=nombre,
        tipo='media',
        estado='en_progreso',
        usuario=usuario,
        notas=notas,
    )

    try:
        files_added = 0
        total_size = 0

        with zipfile.ZipFile(filepath, 'w', zipfile.ZIP_DEFLATED) as zf:
            for dirpath, dirnames, filenames in os.walk(media_root):
                for f in filenames:
                    file_path = os.path.join(dirpath, f)
                    arc_name = os.path.join(
                        'media',
                        os.path.relpath(file_path, media_root)
                    )
                    if os.path.exists(file_path):
                        zf.write(file_path, arc_name)
                        files_added += 1
                        total_size += os.path.getsize(file_path)

            # Metadatos
            meta = {
                'nombre': nombre,
                'tipo': 'media',
                'fecha': datetime.now().isoformat(),
                'usuario': str(usuario) if usuario else 'Sistema',
                'notas': notas,
                'files_count': files_added,
                'total_size_files': total_size,
            }
            zf.writestr('backup_meta.json', json.dumps(meta, indent=2, ensure_ascii=False))

        if not os.path.exists(filepath) or os.path.getsize(filepath) == 0:
            raise FileNotFoundError("El archivo de backup no se creó correctamente")

        duration = time.time() - start_time
        file_size = os.path.getsize(filepath)

        record.archivo = filepath
        record.tamano = file_size
        record.estado = 'exitoso'
        record.duracion_segundos = round(duration, 2)
        record.tablas_incluidas = f"{files_added} archivos de media"
        record.save()

        _limpiar_backups_antiguos()

        return record

    except Exception as e:
        record.estado = 'fallido'
        record.notas = f"{notas}\nError: {str(e)}" if notas else f"Error: {str(e)}"
        record.duracion_segundos = round(time.time() - start_time, 2)
        record.save()
        
        if os.path.exists(filepath):
            try:
                os.remove(filepath)
            except OSError:
                pass
        
        raise


def restaurar_backup(record):
    """Restaura un backup previamente creado."""
    if not record.archivo or not os.path.exists(record.archivo):
        raise FileNotFoundError("El archivo de backup no existe.")

    backup_dir = get_backup_dir()

    with zipfile.ZipFile(record.archivo, 'r') as zf:
        names = zf.namelist()

        # Restaurar BD
        if 'db.sqlite3' in names:
            db_path = str(get_database_path())

            # Cerrar conexiones activas
            connection.close()

            # Extraer BD temporal
            temp_db = os.path.join(backup_dir, 'restore_temp.sqlite3')
            with zf.open('db.sqlite3') as src, open(temp_db, 'wb') as dst:
                dst.write(src.read())

            # Reemplazar BD actual
            shutil.copy2(temp_db, db_path)
            os.remove(temp_db)

        # Restaurar Media
        media_files = [n for n in names if n.startswith('media/')]
        if media_files:
            media_root = str(getattr(settings, 'MEDIA_ROOT', ''))
            if media_root:
                for mf in media_files:
                    target = os.path.join(media_root, os.path.relpath(mf, 'media'))
                    os.makedirs(os.path.dirname(target), exist_ok=True)
                    with zf.open(mf) as src, open(target, 'wb') as dst:
                        dst.write(src.read())

    record.estado = 'restaurado'
    record.save()

    return True


def _limpiar_backups_antiguos():
    """Elimina backups antiguos si se excede el máximo configurado."""
    from .models import BackupRecord, BackupConfig
    config = BackupConfig.get_config()

    backups = BackupRecord.objects.filter(estado='exitoso').order_by('-fecha_creacion')
    if backups.count() > config.max_backups:
        to_delete = backups[config.max_backups:]
        for b in to_delete:
            if b.archivo and os.path.exists(b.archivo):
                try:
                    os.remove(b.archivo)
                except OSError:
                    pass
            b.delete()


def obtener_info_backup_zip(filepath):
    """Lee los metadatos de un archivo ZIP de backup."""
    try:
        with zipfile.ZipFile(filepath, 'r') as zf:
            if 'backup_meta.json' in zf.namelist():
                meta = json.loads(zf.read('backup_meta.json'))
                return meta
    except Exception:
        pass
    return None
