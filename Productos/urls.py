from django.urls import path
from . import views

app_name = 'productos'

urlpatterns = [
    path('', views.lista_productos, name='lista_productos'),
    path('crear/', views.crear_producto, name='crear_producto'),
    path('<int:codigo>/editar/', views.editar_producto, name='editar_producto'),
    path('<int:codigo>/eliminar/', views.eliminar_producto, name='eliminar_producto'),
    path('<int:codigo>/toggle-estado/', views.toggle_estado_producto, name='toggle_estado_producto'),
]