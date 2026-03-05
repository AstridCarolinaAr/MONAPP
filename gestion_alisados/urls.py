from django.urls import path
from . import views

app_name = 'gestion_alisados'

urlpatterns = [
    path('', views.lista_gestion_alisados, name='lista_gestion_alisados'),
    path('crear/', views.crear_gestion_alisado, name='crear_gestion_alisado'),
    path('<uuid:pk>/', views.ver_gestion_alisado, name='ver_gestion_alisado'),
    path('<uuid:pk>/editar/', views.editar_gestion_alisado, name='editar_gestion_alisado'),
    path('<uuid:pk>/eliminar/', views.eliminar_gestion_alisado, name='eliminar_gestion_alisado'),
    path('form_gestion_alisado_modal_content/', views.form_gestion_alisado_modal_content, name='form_gestion_alisado_modal_content'),
]
