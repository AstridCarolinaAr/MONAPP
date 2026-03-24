from django.urls import path
from . import views

app_name = 'gestion_alisados'

urlpatterns = [
    path('', views.lista_gestion_alisados, name='lista_gestion_alisados'),
    path('crear/', views.crear_gestion_alisado, name='crear_gestion_alisado'),
    path('exportar/excel/', views.exportar_excel, name='exportar_excel'),
    path('exportar/pdf/', views.exportar_pdf, name='exportar_pdf'),
    path('imprimir/terminos-firmados/', views.imprimir_terminos_firmados, name='imprimir_terminos_firmados'),
    path('imprimir/consentimiento/<uuid:pk>/', views.imprimir_consentimiento_individual, name='imprimir_consentimiento_individual'),
    path('<uuid:pk>/', views.ver_gestion_alisado, name='ver_gestion_alisado'),
    path('<uuid:pk>/editar/', views.editar_gestion_alisado, name='editar_gestion_alisado'),
    path('<uuid:pk>/eliminar/', views.eliminar_gestion_alisado, name='eliminar_gestion_alisado'),
]
