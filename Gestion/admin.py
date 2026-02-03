from django.contrib import admin
from .models import Producto, Promocion, Servicio


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio', 'stock', 'actualizado_en')
    search_fields = ('nombre', 'descripcion')
    list_filter = ('actualizado_en',)


@admin.register(Promocion)
class PromocionAdmin(admin.ModelAdmin):
    list_display = ('titulo', 'descuento', 'fecha_inicio', 'fecha_fin')
    search_fields = ('titulo', 'descripcion')
    list_filter = ('fecha_inicio', 'fecha_fin')


@admin.register(Servicio)
class ServicioAdmin(admin.ModelAdmin):
    list_display = ('nombre', 'precio_base', 'duracion_estimada', 'actualizado_en')
    search_fields = ('nombre', 'descripcion')
    list_filter = ('actualizado_en',) 
