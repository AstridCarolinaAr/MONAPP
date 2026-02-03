from django.contrib import admin
from .models import Transaccion

@admin.register(Transaccion)
class TransaccionAdmin(admin.ModelAdmin):
    list_display = ['id_transaccion', 'tipo', 'monto', 'motivo', 'fecha_creacion', 'usuario']
    list_filter = ['tipo', 'fecha_creacion']
    search_fields = ['motivo', 'id_transaccion']
    readonly_fields = ['id_transaccion', 'fecha_creacion']
    ordering = ['-fecha_creacion']
