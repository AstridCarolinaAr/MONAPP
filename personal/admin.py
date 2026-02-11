from django.contrib import admin
from .models import Personal


@admin.register(Personal)
class PersonalAdmin(admin.ModelAdmin):
    list_display = ('id', 'numero_documento', 'nombres', 'rol', 'telefono', 'correo', 'activo', 'fecha_creacion')
    list_filter = ('rol', 'activo', 'fecha_creacion')
    search_fields = ('numero_documento', 'nombres', 'correo', 'telefono')
    readonly_fields = ('fecha_creacion', 'fecha_actualizacion')
    
    fieldsets = (
        ('Información Personal', {
            'fields': ('numero_documento', 'nombres', 'telefono', 'correo')
        }),
        ('Información del Sistema', {
            'fields': ('rol', 'usuario', 'activo')
        }),
        ('Auditoría', {
            'fields': ('fecha_creacion', 'fecha_actualizacion'),
            'classes': ('collapse',)
        }),
    )
    
    def save_model(self, request, obj, form, change):
        super().save_model(request, obj, form, change)

