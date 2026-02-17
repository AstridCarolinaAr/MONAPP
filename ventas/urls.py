from django.urls import path
from . import views

app_name = 'ventas'

urlpatterns = [
    path('', views.lista_ventas, name='lista'),
    path('crear/', views.crear_venta, name='crear'),
    path("editar-modal/<int:pk>/", views.editar_venta_modal, name="editar_modal"),
    path("<int:pk>/detalle-json/", views.detalle_venta_json, name="detalle_json"),
    path('anular/<int:venta_id>/', views.anular_venta, name='anular'),
]
