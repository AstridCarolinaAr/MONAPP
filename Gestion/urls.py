from django.urls import path
from . import views

urlpatterns = [
    # Índice del módulo Gestión
    path('', views.index, name='gestion_index'),

    # Productos
    path('productos/', views.listar_productos, name='listar_productos'),
    path('productos/nuevo/', views.crear_producto, name='crear_producto'),
    path('productos/editar/<int:id>/', views.editar_producto, name='editar_producto'),
    path('productos/eliminar/<int:id>/', views.eliminar_producto, name='eliminar_producto'),

    # Promociones
    path('promociones/', views.listar_promociones, name='listar_promociones'),
    path('promociones/nuevo/', views.crear_promocion, name='crear_promocion'),
    path('promociones/editar/<int:id>/', views.editar_promocion, name='editar_promocion'),
    path('promociones/eliminar/<int:id>/', views.eliminar_promocion, name='eliminar_promocion'),

    # Servicios
    path('servicios/', views.listar_servicios, name='listar_servicios'),
    path('servicios/nuevo/', views.crear_servicio, name='crear_servicio'),
    path('servicios/editar/<int:id>/', views.editar_servicio, name='editar_servicio'),
    path('servicios/eliminar/<int:id>/', views.eliminar_servicio, name='eliminar_servicio'),

    # Backup (Cristina y Olga)
    path('backup/restaurar/', views.restaurar_bd, name='restaurar_bd'),

    # Debug / diagnóstico (temporal)
    path('debug/', views.debug_session, name='gestion_debug'),
]