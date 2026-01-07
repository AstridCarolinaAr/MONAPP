from django.urls import path
from . import views

app_name = 'productos'

urlpatterns = [
    path('', views.lista_productos_publica, name='lista_productos_publica'),
    path('detalle/<str:codigo>/', views.detalle_producto_publico, name='detalle_producto_publico'),
    path('admin/productos/', views.lista_productos_admin, name='lista_productos_admin'),
    path('admin/productos/crear/', views.crear_producto, name='crear_producto'),
    path('admin/productos/<str:codigo>/editar/', views.editar_producto, name='editar_producto'),
    path('admin/productos/<str:codigo>/eliminar/', views.eliminar_producto, name='eliminar_producto'),
]
