from django.urls import path
from . import views

app_name = 'servicios'

urlpatterns = [
    # URLs para Servicios
    path('', views.lista_servicios, name='lista_servicios'),
    path('crear/', views.crear_servicio, name='crear_servicio'),
    path('editar/<uuid:pk>/', views.editar_servicio, name='editar_servicio'),
    path('eliminar/<uuid:pk>/', views.eliminar_servicio, name='eliminar_servicio'),
    path('publicos/', views.servicios_publicos, name='servicios_publicos'),
    
    # URLs para Gestión de Alisados
    path('gestion-alisados/', views.lista_gestion_alisados, name='lista_gestion_alisados'),
    path('gestion-alisados/crear/', views.crear_gestion_alisado, name='crear_gestion_alisado'),
    path('gestion-alisados/<uuid:pk>/', views.ver_gestion_alisado, name='ver_gestion_alisado'),
    path('gestion-alisados/<uuid:pk>/editar/', views.editar_gestion_alisado, name='editar_gestion_alisado'),
    path('gestion-alisados/<uuid:pk>/eliminar/', views.eliminar_gestion_alisado, name='eliminar_gestion_alisado'),
    path('ajax/crear-cliente/', views.crear_cliente_ajax, name='crear_cliente_ajax'),
]
