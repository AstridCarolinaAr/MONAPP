from django.contrib import messages
from django.shortcuts import redirect
from functools import wraps

def admin_o_aux_required(mensaje=None):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):

            # SUPERUSER
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            grupos=[g.lower() for g in request.user.groups.values_list('name', flat=True)
                    
            ]
            if 'administrador' in grupos or 'auxiliar' in grupos:
                return view_func(request, *args, **kwargs)
            messages.error(request, mensaje)
            return redirect("core:dashboard")
        return wrapper
    return decorator



def bloquear_eliminar(mensaje="No tienes permiso para eliminar."):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):

            if not request.user.is_staff:
                # 🔥 limpiar mensajes anteriores
                list(messages.get_messages(request))

                # 🔴 SOLO mensaje global
                messages.error(request, mensaje)

                return redirect(
                    request.META.get('HTTP_REFERER', 'core:dashboard')
                )

            return view_func(request, *args, **kwargs)

        return wrapper
    return decorator
