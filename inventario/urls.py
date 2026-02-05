from django.urls import path
from . import views

app_name = 'inventario'

urlpatterns = [
    path('', views.inventario_vista, name='mo'),
    path('exportar/', views.exportar_txt, name='exportar_txt'),
]
