from django.urls import path
from . import views

app_name = "compras"

urlpatterns = [
    path("", views.lista_compras, name="lista_compras"),
    path("crear/", views.crear_compra, name="crear_compra"),
    path("detalle/<int:compra_id>/", views.detalle_compra, name="detalle_compra"),
    path("eliminar/<int:compra_id>/", views.eliminar_compra, name="eliminar_compra"),
]