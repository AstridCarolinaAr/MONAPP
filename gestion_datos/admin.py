from django.contrib import admin
from .models import GestionDatos


@admin.register(GestionDatos)
class GestionDatosAdmin(admin.ModelAdmin):
    list_display = ('cliente', 'fecha_hora', 'procedimiento_realizado_por', 'precio_servicio')
    list_filter = ('fecha_hora', 'medio_pago', 'porosidad', 'textura')
    search_fields = ('cliente__nombre', 'cliente__apellido', 'cliente__numero_documento', 'procedimiento_realizado_por')
    date_hierarchy = 'fecha_hora'
    
    fieldsets = (
        ('Información del Cliente', {
            'fields': ('cliente',)
        }),
        ('Información del Servicio y Pago', {
            'fields': ('precio_servicio', 'es_oferta_especial', 'descripcion_oferta', 'anticipo_cliente', 'medio_pago', 'saldo_pendiente')
        }),
        ('Información del Procedimiento', {
            'fields': ('procedimiento_realizado_por', 'tipo_tratamiento', 'requiere_resellado', 'porcentaje_tratamiento')
        }),
        ('Características del Cabello', {
            'fields': ('porosidad', 'textura', 'forma_natural', 'elasticidad', 'longitud', 'densidad')
        }),
        ('Condición del Cuero Cabelludo y Cabello', {
            'fields': ('piel_cabelludo', 'nivel_alopecia', 'nivel_caida', 'nivel_caspa', 'tratamiento_actual')
        }),
        ('Historial de Tratamientos', {
            'fields': (
                'tratamiento_quimico', 'tipo_tratamiento_quimico', 'tiempo_tratamiento_quimico',
                'plancha_cabello', 'uso_plancha', 'tiempo_uso_plancha',
                'tinte_cabello', 'tipo_tinte', 'tiempo_tinte'
            )
        }),
        ('Imágenes', {
            'fields': ('foto_antes', 'foto_despues')
        }),
        ('Observaciones', {
            'fields': ('observaciones',)
        }),
    )
