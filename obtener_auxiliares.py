#!/usr/bin/env python
"""
Script para obtener/listar usuarios registrados como "Auxiliares"
Ejecutar: python obtener_auxiliares.py
"""

import os
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MONAPP.settings')
django.setup()

from django.contrib.auth.models import User, Group
from usuarios.models import PerfilUsuario

def crear_grupos_si_no_existen():
    """Crea los grupos estándar si no existen"""
    roles = ['Administrador', 'Auxiliar', 'Colaborador']
    grupos_creados = []
    
    for rol in roles:
        grupo, created = Group.objects.get_or_create(name=rol)
        if created:
            grupos_creados.append(rol)
    
    return grupos_creados

# Crear grupos si no existen
print("\n" + "="*100)
print("OBTENER USUARIOS AUXILIARES DEL MÓDULO DE USUARIOS")
print("="*100 + "\n")

grupos_creados = crear_grupos_si_no_existen()
if grupos_creados:
    print(f"✓ Grupos creados: {', '.join(grupos_creados)}\n")

# Mostrar estadísticas
print("="*100)
print("ESTADÍSTICAS DEL SISTEMA")
print("="*100 + "\n")

total_usuarios = User.objects.count()
print(f"Total de usuarios registrados: {total_usuarios}\n")

# Mostrar grupos con sus usuarios
print("Distribución por roles:\n")
roles = ['Administrador', 'Auxiliar', 'Colaborador']
for rol in roles:
    grupo = Group.objects.filter(name=rol).first()
    if grupo:
        count = grupo.user_set.count()
        print(f"  - {rol}: {count} usuario(s)")
        if count > 0:
            usuarios_rol = grupo.user_set.all()
            for user in usuarios_rol:
                print(f"      • {user.get_full_name() or user.username}")
print()

# Mostrar usuarios sin grupo asignado
usuarios_sin_grupo = User.objects.exclude(groups__isnull=False).distinct()
if usuarios_sin_grupo.exists():
    print(f"  - Sin grupo asignado: {usuarios_sin_grupo.count()} usuario(s)")
    for user in usuarios_sin_grupo:
        print(f"      • {user.get_full_name() or user.username} ({user.username})")
print()

# Obtener el grupo "Auxiliar"
grupo_auxiliar = Group.objects.filter(name='Auxiliar').first()

print("="*100)
print("AUXILIARES REGISTRADOS")
print("="*100 + "\n")

if grupo_auxiliar:
    auxiliares = User.objects.filter(groups=grupo_auxiliar).select_related('perfil').order_by('last_name', 'first_name')
    
    if auxiliares.exists():
        print(f"├─ Se encontraron {auxiliares.count()} auxiliar(es):\n")
        for idx, user in enumerate(auxiliares, 1):
            perfil = user.perfil
            print(f"│")
            print(f"├─ [{idx}] {user.get_full_name()}")
            print(f"│   ├─ Username: {user.username}")
            print(f"│   ├─ Email: {user.email if user.email else 'No registrado'}")
            print(f"│   ├─ Documento: {perfil.documento if perfil and perfil.documento else 'No registrado'}")
            print(f"│   ├─ Teléfono: {perfil.telefono if perfil and perfil.telefono else 'No registrado'}")
            print(f"│   ├─ Tipo Documento: {perfil.get_tipo_documento_display() if perfil else 'N/A'}")
            print(f"│   ├─ Dirección: {perfil.direccion if perfil and perfil.direccion else 'No registrada'}")
            print(f"│   ├─ Activo: {'✓ Sí' if user.is_active else '✗ No'}")
            print(f"│   └─ Registrado: {user.date_joined.strftime('%d/%m/%Y %H:%M')}")
        
        print(f"│")
        print("="*100)
        print(f"TOTAL: {auxiliares.count()} auxiliar(es) registrado(s)")
        print("="*100 + "\n")
    else:
        print("⚠ No hay usuarios registrados como auxiliares.\n")
        print("Para agregar auxiliares, puedes:\n")
        print("  1. Usar el panel de administración: /admin/")
        print("  2. Acceder a la vista de gestión de usuarios")
        print("  3. Crear un nuevo usuario con rol 'Auxiliar'\n")
else:
    print("✗ El grupo 'Auxiliar' no existe.\n")

print("\n")

