from django.conf import settings
from django.http import HttpResponseForbidden
from django.shortcuts import redirect, resolve_url

from .permisos import (
    PUBLIC_USER_URLS,
    USER_PROFILE_URLS,
    accion_desde_url,
    permisos_para_modulo,
    tiene_rol,
)


RUTAS_ADMIN_PUBLICAS = {
    "admin",
}

MODULOS_PROTEGIDOS = {
    "productos",
    "proveedores",
    "clientes",
    "ventas",
    "personal",
    "inventario",
    "compras",
    "servicios",
    "productos_web",
    "promociones",
    "servicios_web",
    "usuarios",
    "notificaciones",
    "backup",
    "gestion_alisados",
}


class RolePermissionMiddleware:
    """Aplica la matriz de permisos por rol definida para el proyecto."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        return self.get_response(request)

    def process_view(self, request, view_func, view_args, view_kwargs):
        path = (request.path_info or "").lower()
        resolver = getattr(request, "resolver_match", None)
        namespace = getattr(resolver, "namespace", "") or ""
        url_name = getattr(resolver, "url_name", "") or ""

        if path.startswith((settings.STATIC_URL.lower(), settings.MEDIA_URL.lower())):
            return None

        if namespace in RUTAS_ADMIN_PUBLICAS or path.startswith("/admin/"):
            return None

        if namespace == "usuarios" and url_name in PUBLIC_USER_URLS:
            return None

        if not getattr(request.user, "is_authenticated", False):
            if namespace in MODULOS_PROTEGIDOS or (namespace == "usuarios" and url_name not in PUBLIC_USER_URLS):
                login_url = resolve_url(settings.LOGIN_URL)
                return redirect(f"{login_url}?next={request.get_full_path()}")
            return None

        if namespace == "usuarios" and url_name in USER_PROFILE_URLS:
            return None

        modulo = namespace
        if modulo not in MODULOS_PROTEGIDOS:
            return None

        accion = accion_desde_url(url_name)
        roles_permitidos = permisos_para_modulo(modulo, accion)

        if roles_permitidos is None:
            return None

        if tiene_rol(request.user, *roles_permitidos):
            return None

        return HttpResponseForbidden("No tienes permisos para realizar esta acción.")
