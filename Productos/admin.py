from django.contrib import admin
from .models import Marca, Producto


@admin.register(Marca)
class MarcaAdmin(admin.ModelAdmin):
    """
    Administración de Marcas en el panel admin
    """
    list_display = ['id', 'nombre', 'activo', 'fecha_creacion']
    list_filter = ['activo', 'fecha_creacion']
    search_fields = ['nombre', 'descripcion']
    list_editable = ['activo']
    ordering = ['nombre']
    
    fieldsets = (
        ('Información Básica', {
            'fields': ('nombre', 'descripcion', 'activo')
        }),
    )


@admin.register(Producto)
class ProductoAdmin(admin.ModelAdmin):
    """
    Administración de Productos en el panel admin
    """
    list_display = [
        'codigo', 
        'nombre', 
        'id_marca', 
        'precio',
        'precio_formateado',
        'linea',
        'presentacion',
        'unidad_medida',
        'estado',
        'fecha_creacion'
    ]
    
    list_filter = [
        'estado', 
        'linea', 
        'unidad_medida', 
        'id_marca',
        'fecha_creacion'
    ]
    
    search_fields = [
        'codigo',
        'nombre', 
        'descripcion', 
        'linea',
        'id_marca__nombre'
    ]
    
    list_editable = ['estado', 'precio']
    
    readonly_fields = ['codigo', 'fecha_creacion', 'fecha_actualizacion']
    
    ordering = ['-fecha_creacion']
    
    list_per_page = 25
    
    fieldsets = (
        ('Información Básica', {
            'fields': (
                'codigo',
                'nombre',
                'id_marca',
                'descripcion'
            )
        }),
        ('Detalles del Producto', {
            'fields': (
                'linea',
                'presentacion',
                'unidad_medida',
                'precio'
            )
        }),
        ('Códigos Asociados', {
            'fields': (
                'codigo_compra',
                'codigo_cliente'
            ),
            'classes': ('collapse',)
        }),
        ('Estado y Fechas', {
            'fields': (
                'estado',
                'fecha_creacion',
                'fecha_actualizacion'
            )
        }),
    )
    
    def precio_formateado(self, obj):
        """Muestra el precio formateado"""
        return obj.get_precio_formateado()
    precio_formateado.short_description = 'Precio'
    precio_formateado.admin_order_field = 'precio'
    
    actions = ['marcar_disponible', 'marcar_agotado', 'marcar_descontinuado']
    
    def marcar_disponible(self, request, queryset):
        """Acción para marcar productos como disponibles"""
        count = queryset.update(estado='disponible')
        self.message_user(request, f'{count} producto(s) marcado(s) como disponible.')
    marcar_disponible.short_description = "Marcar como Disponible"
    
    def marcar_agotado(self, request, queryset):
        """Acción para marcar productos como agotados"""
        count = queryset.update(estado='agotado')
        self.message_user(request, f'{count} producto(s) marcado(s) como agotado.')
    marcar_agotado.short_description = "Marcar como Agotado"
    
    def marcar_descontinuado(self, request, queryset):
        """Acción para marcar productos como descontinuados"""
        count = queryset.update(estado='descontinuado')
        self.message_user(request, f'{count} producto(s) marcado(s) como descontinuado.')
    marcar_descontinuado.short_description = "Marcar como Descontinuado"