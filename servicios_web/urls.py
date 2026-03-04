from django.urls import path
from . import views

app_name = 'servicios_web'

urlpatterns = [
    path('crear/', views.crear_servicio_web, name='crear_servicio_web'),
    path('lista/', views.lista_servicios_web, name='lista_servicios_web'),
    path('editar/<uuid:pk>/', views.editar_servicio_web, name='editar_servicio_web'),

]