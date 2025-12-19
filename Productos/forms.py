from django import forms
from .models import Producto, Marca



class ProductoForm(forms.ModelForm):
    """
    Formulario para crear/editar productos
    """

    class Meta:
        model = Producto
        fields = [
            'id_marca',
            'codigo_compra',
            'codigo_cliente',
            'nombre',
            'precio',
            'descripcion',
            'linea',
            'presentacion',
            'unidad_medida',
            'estado',
        ]

        widgets = {
            'id_marca': forms.Select(attrs={
                'class': 'form-select'
            }),
            'codigo_compra': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Código de compra (opcional)'
            }),
            'codigo_cliente': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Código de cliente (opcional)'
            }),
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del producto'
            }),
            'precio': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': 0,
                'placeholder': 'Precio en pesos colombianos'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Descripción del producto'
            }),
            'linea': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Línea del producto'
            }),
            'presentacion': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: 500ml, caja x12'
            }),
            'unidad_medida': forms.Select(attrs={
                'class': 'form-select'
            }),
            'estado': forms.Select(attrs={
                'class': 'form-select'
            }),
        }

        labels = {
            'id_marca': 'Marca',
            'codigo_compra': 'Código de Compra',
            'codigo_cliente': 'Código de Cliente',
            'nombre': 'Nombre del Producto',
            'precio': 'Precio',
            'descripcion': 'Descripción',
            'linea': 'Línea',
            'presentacion': 'Presentación',
            'unidad_medida': 'Unidad de Medida',
            'estado': 'Estado',
        }

    def clean_precio(self):
        precio = self.cleaned_data.get('precio')
        if precio is not None and precio < 0:
            raise forms.ValidationError('El precio no puede ser negativo.')
        return precio
class MarcaForm(forms.ModelForm):
    class Meta:
        model = Marca
        fields = ['nombre', 'descripcion', 'activo']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre de la marca'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Descripción (opcional)'
            }),
            'activo': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            }),
        }
