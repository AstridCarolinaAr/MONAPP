from django import forms
from django.core.exceptions import ValidationError
from .models import Producto, Promocion, Servicio
from datetime import date


class ProductoForm(forms.ModelForm):
    """Formulario para crear y editar productos"""
    
    class Meta:
        model = Producto
        fields = ['nombre', 'descripcion', 'precio', 'stock', 'imagen']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Café Colombiano Premium',
                'required': True
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Describa las características principales del producto...',
                'required': True
            }),
            'precio': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01',
                'min': '0.01',
                'required': True
            }),
            'stock': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0',
                'min': '0',
                'required': True
            }),
            'imagen': forms.ClearableFileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
        }
        labels = {
            'nombre': '📦 Nombre del Producto',
            'descripcion': '📝 Descripción',
            'precio': '💰 Precio (COP)',
            'stock': '📊 Cantidad en Stock',
            'imagen': '🖼️ Imagen del Producto',
        }
    
    def clean_precio(self):
        precio = self.cleaned_data.get('precio')
        if precio and precio <= 0:
            raise ValidationError("El precio debe ser mayor a $0")
        return precio


class PromocionForm(forms.ModelForm):
    """Formulario para crear y editar promociones"""
    
    class Meta:
        model = Promocion
        fields = ['titulo', 'descripcion', 'descuento', 'fecha_inicio', 'fecha_fin']
        widgets = {
            'titulo': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Descuento de Verano',
                'required': True
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Describe los términos de la promoción...',
                'required': True
            }),
            'descuento': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '20',
                'min': '1',
                'max': '100',
                'required': True
            }),
            'fecha_inicio': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date',
                'required': True
            }),
            'fecha_fin': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date',
                'required': True
            }),
        }
        labels = {
            'titulo': '🎯 Título de la Promoción',
            'descripcion': '📝 Descripción',
            'descuento': '🏷️ Porcentaje de Descuento (%)',
            'fecha_inicio': '📅 Fecha de Inicio',
            'fecha_fin': '📅 Fecha de Finalización',
        }
    
    def clean(self):
        cleaned_data = super().clean()
        fecha_inicio = cleaned_data.get('fecha_inicio')
        fecha_fin = cleaned_data.get('fecha_fin')
        
        if fecha_inicio and fecha_fin:
            if fecha_fin <= fecha_inicio:
                raise ValidationError("La fecha de finalización debe ser posterior a la de inicio")
        
        return cleaned_data


class ServicioForm(forms.ModelForm):
    """Formulario para crear y editar servicios"""
    
    class Meta:
        model = Servicio
        fields = ['nombre', 'descripcion', 'precio_base', 'duracion_estimada']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: Servicio de Limpieza Profunda',
                'required': True
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Describa qué incluye el servicio...',
                'required': True
            }),
            'precio_base': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': '0.00',
                'step': '0.01',
                'min': '0.01',
                'required': True
            }),
            'duracion_estimada': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: 3 horas, 1 día, 2 semanas',
                'required': True
            }),
        }
        labels = {
            'nombre': '🔧 Nombre del Servicio',
            'descripcion': '📝 Descripción',
            'precio_base': '💰 Precio Base (COP)',
            'duracion_estimada': '⏱️ Duración Estimada',
        }


class RestoreDBForm(forms.Form):
    """Formulario para restaurar base de datos desde backup"""
    archivo_backup = forms.FileField(
        label='📁 Seleccionar archivo de respaldo',
        required=True,
        widget=forms.ClearableFileInput(attrs={
            'class': 'form-control',
            'accept': '.json,.sql',
            'required': True
        }),
        help_text="Solo archivos .json o .sql (tamaño máximo: 10MB)"
    )
    
    def clean_archivo_backup(self):
        archivo = self.cleaned_data.get('archivo_backup')
        if archivo:
            # Validar tamaño
            if archivo.size > 10 * 1024 * 1024:  # 10MB
                raise ValidationError("El archivo no puede exceder 10MB")
            # Validar extensión
            if not archivo.name.endswith(('.json', '.sql')):
                raise ValidationError("Solo se permiten archivos .json o .sql")
        return archivo