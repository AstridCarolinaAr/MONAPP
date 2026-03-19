from django.urls import path
from . import views

app_name = 'clientes'
urlpatterns = [
    path('', views.lista_clientes, name='lista'),
    path('crear/', views.crear_cliente, name='crear'),
    path('validar-documento/', views.validar_documento, name='validar_documento'),
    path('buscar-ajax/', views.buscar_clientes_ajax, name='buscar_ajax'),
    path('editar/<int:cliente_id>/', views.editar_cliente, name='editar'),
    path('eliminar/<int:cliente_id>/', views.eliminar_cliente, name='eliminar'),
]
