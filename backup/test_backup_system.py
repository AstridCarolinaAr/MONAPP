#!/usr/bin/env python
"""
Script de prueba para validar el sistema de backups
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MONAPP.settings')
django.setup()

from backup.services import get_database_stats
from backup.models import BackupRecord, BackupConfig

print("=" * 60)
print("🔍 PRUEBA DEL SISTEMA DE BACKUPS")
print("=" * 60)

# Estadísticas de BD
stats = get_database_stats()
print('\n📊 Estadísticas de Base de Datos:')
print(f'   - BD Size: {stats["db_size_legible"]}')
print(f'   - Total Tablas: {stats["total_tablas"]}')
print(f'   - Total Registros: {stats["total_registros"]}')
print(f'   - Media Size: {stats["media_size_legible"]}')
print(f'   - Media Files: {stats["media_files"]}')

# Configuración de backups
config = BackupConfig.get_config()
print(f'\n⚙️  Configuración de Backups:')
print(f'   - Backup Automático: {"✓" if config.backup_automatico else "✗"}')
print(f'   - Frecuencia: {config.frecuencia_horas} horas')
print(f'   - Máx Backups: {config.max_backups}')
print(f'   - Incluir Media: {"✓" if config.incluir_media else "✗"}')
ruta = config.ruta_backups if config.ruta_backups else "predeterminada"
print(f'   - Ruta: {ruta}')

# Backups existentes
backups = BackupRecord.objects.all().order_by('-fecha_creacion')[:10]
print(f'\n📦 Últimos {backups.count()} Backups:')
if backups:
    for i, b in enumerate(backups, 1):
        archivo_str = "✓" if b.archivo_existe else "✗"
        print(f'   {i}. {b.nombre}')
        print(f'      - Tipo: {b.tipo} | Estado: {b.estado}')
        print(f'      - Tamaño: {b.tamano_legible} | Archivo: {archivo_str}')
        print(f'      - Usuario: {b.usuario.username if b.usuario else "Sistema"}')
        print()
else:
    print("   ℹ️  No hay backups creados aún")

print("=" * 60)
