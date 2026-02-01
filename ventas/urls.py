from django.urls import path
from . import views

app_name = 'ventas'

urlpatterns = [
    path('', views.lista_ventas, name='lista'),
    path('crear/', views.crear_venta, name='crear'),
    path('editar/<int:pk>/', views.editar_venta, name='editar'),
    path('detalle/<int:pk>/', views.detalle_venta, name='detalle'),
]
