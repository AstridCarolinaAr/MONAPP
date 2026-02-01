from django.contrib import admin
from .models import Venta


@admin.register(Venta)
class VentaAdmin(admin.ModelAdmin):
    list_display = (
        'codigo_venta',
        'cliente',
        'codigo_producto',
        'precio_unitario',
        'cantidad',
        'subtotal',
        'fecha',
    )

    search_fields = (
        'codigo_venta',
        'cliente__nombre',
        'cliente__apellido',
        'codigo_producto',
        'nombre_colaborador',
    )

    list_filter = ('fecha',)
