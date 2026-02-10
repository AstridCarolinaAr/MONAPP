import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'MONAPP.settings')
django.setup()

from django.contrib.auth.models import User
from usuarios.models import PerfilUsuario
from django.conf import settings

print(f"MEDIA_URL: {settings.MEDIA_URL}")
print(f"MEDIA_ROOT: {settings.MEDIA_ROOT}")
print(f"\nDirectorio MEDIA_ROOT existe: {os.path.exists(settings.MEDIA_ROOT)}")

print("\n" + "="*50)
print("USUARIOS Y SUS FOTOS:")
print("="*50)

usuarios = User.objects.all()
for u in usuarios:
    if hasattr(u, 'perfil'):
        foto = u.perfil.foto_perfil
        if foto:
            print(f"\n{u.username}:")
            print(f"  - Foto en DB: {foto}")
            print(f"  - URL: {foto.url}")
            ruta_completa = os.path.join(settings.MEDIA_ROOT, str(foto))
            print(f"  - Ruta completa: {ruta_completa}")
            print(f"  - Archivo existe: {os.path.exists(ruta_completa)}")
        else:
            print(f"\n{u.username}: Sin foto")
    else:
        print(f"\n{u.username}: Sin perfil creado")
