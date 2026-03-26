from django.urls import path
from . import views

app_name = 'productos_web'

urlpatterns = [
    path('', views.lista_productos_web, name='lista'),
    path('crear/', views.crear_producto_web, name='crear'),
    path('editar/<uuid:pk>/', views.editar_producto_web, name='editar'),
    path('eliminar/<uuid:pk>/', views.eliminar_producto_web, name='eliminar'),
    path('toggle/<uuid:pk>/', views.toggle_visible, name='toggle_visible'),
]
