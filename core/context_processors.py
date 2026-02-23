"""Context processors para la app core.

Incluye permisos que usan las plantillas (es_administrador, es_admin_o_auxiliar).
"""

from Gestion.views import es_administrador, es_admin_o_auxiliar


def gestion_permissions(request):
    """Devuelve un diccionario con flags de permisos para usar en plantillas."""
    user = getattr(request, 'user', None)
    if not user or not user.is_authenticated:
        return {
            'es_administrador': False,
            'es_admin_o_auxiliar': False,
        }

    return {
        'es_administrador': es_administrador(user),
        'es_admin_o_auxiliar': es_admin_o_auxiliar(user),
    }
