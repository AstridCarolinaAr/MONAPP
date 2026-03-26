from django.urls import path
from . import views

app_name = 'notificaciones'

urlpatterns = [
    # Listar notificaciones no leídas (GET → JSON)
    path('listar/',               views.listar_notificaciones, name='listar'),

    # Marcar una como leída (POST → JSON)
    path('<int:notif_id>/leer/',  views.marcar_leida,          name='marcar_leida'),

    # Marcar todas como leídas (POST → JSON)
    path('leer-todas/',           views.marcar_todas_leidas,   name='marcar_todas_leidas'),
]

