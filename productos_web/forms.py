from django import forms
from .models import ProductoWeb


class ProductoWebForm(forms.ModelForm):
    class Meta:
        model = ProductoWeb
        fields = ['nombre', 'precio', 'descripcion', 'imagen', 'visible']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del producto',
            }),
            'precio': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'min': '0',
                'placeholder': '0.00',
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Descripción breve del producto…',
            }),
            'imagen': forms.ClearableFileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*',
            }),
            'visible': forms.CheckboxInput(attrs={
                'class': 'form-check-input',
            }),
        }
        labels = {
            'nombre': 'Nombre',
            'precio': 'Precio Público ($)',
            'descripcion': 'Descripción',
            'imagen': 'Imagen del Producto',
            'visible': 'Visible en la Web',
        }
