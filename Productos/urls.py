from django.urls import path
from . import views

app_name = 'productos'

urlpatterns = [
    # ==================== VISTAS PÚBLICAS ====================
    path('', views.lista_productos_publica, name='lista_productos'),

    path(
        'detalle/<int:codigo>/',
        views.detalle_producto_publico,
        name='detalle_producto'
    ),

    # ==================== PANEL ADMIN ====================
    path(
        'admin/productos/',
        views.lista_productos_admin,
        name='lista_productos_admin'
    ),

    path(
        'admin/productos/crear/',
        views.crear_producto,
        name='crear_producto'
    ),

    path(
        'admin/productos/<int:codigo>/editar/',
        views.editar_producto,
        name='editar_producto'
    ),

    path(
        'admin/productos/<int:codigo>/eliminar/',
        views.eliminar_producto,
        name='eliminar_producto'
    ),
]
