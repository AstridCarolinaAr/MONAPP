from django.urls import path
from . import views

app_name = 'caja'

urlpatterns = [
    path('', views.caja_vista, name='caja_vista'),
    path('exportar/', views.exportar_txt, name='exportar_txt'),
]
