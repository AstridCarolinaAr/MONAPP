from django.contrib import messages
from django.shortcuts import redirect
from django.contrib import messages
from django.shortcuts import redirect
from functools import wraps
from django.contrib import messages
from django.shortcuts import redirect

def solo_admin(mensaje=None):
    def decorator(view_func):
        def wrapper(request, *args, **kwargs):
            if not request.user.is_staff:
                messages.error(
                    request,
                    mensaje or "No tienes permisos para realizar esta acción."
                )

                #  Volver a la página anterior
                return redirect(request.META.get("HTTP_REFERER", "core:dashboard"))

            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator



def bloquear_eliminar(mensaje="No tienes permiso para eliminar."):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            if not request.user.is_staff:
                messages.error(request, mensaje)
                return redirect("core:dashboard")  # o donde quieras
            return view_func(request, *args, **kwargs)
        return wrapper
    return decorator
