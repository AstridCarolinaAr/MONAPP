from django.contrib import messages
from django.shortcuts import redirect
from django.http import HttpResponseForbidden
from functools import wraps

def admin_o_aux_required(mensaje="No tienes permisos para acceder a esta sección."):
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # SUPERUSER
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            grupos = [g.lower() for g in request.user.groups.values_list('name', flat=True)]
            
            if 'administrador' in grupos or 'auxiliar' in grupos:
                return view_func(request, *args, **kwargs)
            
            messages.error(request, mensaje)
            return redirect("core:dashboard")
        return wrapper
    return decorator


def solo_admin_required(mensaje="Solo los administradores pueden realizar esta acción."):
    """
    Decorador que permite acceso solo a superusuarios y administradores.
    Los auxiliares NO tienen permiso.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # SUPERUSER siempre tiene acceso
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            # Verificar si es Administrador (no Auxiliar)
            grupos = [g.lower() for g in request.user.groups.values_list('name', flat=True)]
            
            if 'administrador' in grupos:
                return view_func(request, *args, **kwargs)
            
            # Si es auxiliar o cualquier otro rol, denegar acceso
            messages.error(request, mensaje)
            return redirect(request.META.get('HTTP_REFERER', 'core:dashboard'))
        
        return wrapper
    return decorator


def no_colaborador_required(mensaje="Los colaboradores solo tienen permisos de lectura."):
    """
    Decorador que bloquea el acceso a colaboradores.
    Solo Administradores y Auxiliares pueden acceder.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            # SUPERUSER siempre tiene acceso
            if request.user.is_superuser:
                return view_func(request, *args, **kwargs)
            
            # Verificar si es Administrador o Auxiliar
            grupos = [g.lower() for g in request.user.groups.values_list('name', flat=True)]
            
            if 'administrador' in grupos or 'auxiliar' in grupos:
                return view_func(request, *args, **kwargs)
            
            # Si es colaborador, denegar acceso
            messages.error(request, mensaje)
            return redirect(request.META.get('HTTP_REFERER', 'core:dashboard'))
        
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
