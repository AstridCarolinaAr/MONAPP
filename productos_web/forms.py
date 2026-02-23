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
                'min': '0.01',
                'max': '9999999.99',
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

    def clean_precio(self):
        precio = self.cleaned_data.get('precio')
        if precio is None:
            raise forms.ValidationError('El precio es obligatorio.')
        if precio <= 0:
            raise forms.ValidationError('El precio debe ser mayor a $0.')
        if precio > 9_999_999.99:
            raise forms.ValidationError('El precio no puede superar $9,999,999.99.')
        # Verificar que no tenga más de 2 decimales
        from decimal import Decimal
        if precio != precio.quantize(Decimal('0.01')):
            raise forms.ValidationError('El precio no puede tener más de 2 decimales.')
        return precio
