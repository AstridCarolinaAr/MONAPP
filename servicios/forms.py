from django import forms
from .models import Servicio

class ServicioForm(forms.ModelForm):
    class Meta:
        model = Servicio
        fields = ['nombre', 'precio', 'descripcion', 'imagen','video', 'activo']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del servicio'
            }),
            'precio': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'min': '0',
                'placeholder': 'Precio'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Descripción del servicio'
            }),
            'imagen': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
             'video': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'video/*'
            }),
            'activo': forms.Select(attrs={
                'class': 'form-select'
            }, choices=[
                (True, 'Activo'),
                (False, 'Inactivo')
            ]),
        }
        labels = {
            'nombre': 'Nombre del Servicio',
            'precio': 'Precio ($)',
            'descripcion': 'Descripción',
            'imagen': 'Imagen del Servicio',
            'video': 'Video del Servicio',      
            'activo': 'Estado del Servicio',
        }
        