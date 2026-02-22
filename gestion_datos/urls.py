from django.urls import path
from . import views

app_name = 'gestion_datos'

urlpatterns = [
    # Lista de gestiones
    path('', views.lista_gestion_datos, name='lista_gestion_datos'),
    
    # CRUD de gestiones de datos
    path('crear/', views.crear_gestion_datos, name='crear_gestion_datos'),
    path('<uuid:pk>/', views.ver_gestion_datos, name='ver_gestion_datos'),
    path('<uuid:pk>/editar/', views.editar_gestion_datos, name='editar_gestion_datos'),
    path('<uuid:pk>/eliminar/', views.eliminar_gestion_datos, name='eliminar_gestion_datos'),
    
    # AJAX
    path('ajax/crear-cliente/', views.crear_cliente_ajax, name='crear_cliente_ajax'),
]
