from django.urls import path
from . import views

app_name = 'core'

urlpatterns = [
    path('', views.index, name='index'),
    path('dashboard/', views.dashboard_view, name='dashboard'),
    path('gestion-datos/', views.gestion_datos_view, name='gestion_datos'),
]