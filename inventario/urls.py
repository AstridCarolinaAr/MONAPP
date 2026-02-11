from django.urls import path
from . import views
app_name = 'inventario'
urlpatterns = [
    path('', views.inventario_lista, name='inventario_vista'),
    # path('exportar/', views.exportar_txt, name='exportar_txt'),
    path('editar/<int:id_movimiento>/', views.editar_movimiento, name='editar_inventario'),
    path('crear/', views.crear_movimiento_inventario, name='crear_inventario'),
    path('eliminar/<int:id_movimiento>/', views.eliminar_movimiento, name='eliminar_inventario'),
]
