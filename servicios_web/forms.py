from django import forms
from .models import ServicioWeb

class ServicioWebForm(forms.ModelForm):
    class Meta:
        model = ServicioWeb
        fields = ['nombre', 'descripcion', 'precio', 'imagen', 'video', 'activo']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del servicio web'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Descripción detallada del servicio web'
            }),
            'precio': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'min': '0',
                'placeholder': 'Precio al público'
            }),
            'imagen': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
            'video': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'video/*'
            }),
            'activo': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
        }
        labels = {
            'nombre': 'Nombre del Servicio Web',
            'descripcion': 'Descripción',
            'precio': 'Precio al público',
            'imagen': 'Imagen del Servicio (opcional)',
            'video': 'Video del Servicio (opcional)',
            'activo': 'Estado del Servicio',
        }
