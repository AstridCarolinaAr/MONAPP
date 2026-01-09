from django import forms
from .models import Producto, Marca


class ProductoForm(forms.ModelForm):
    """
    Formulario para crear/editar productos
    """

    # 🔹 CAMPO EXTRA SOLO PARA ESCRIBIR LA MARCA
    marca_texto = forms.CharField(
        label='Marca',
        max_length=100,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Escribe la marca (Ej: Mona Keratina)'
        })
    )

    class Meta:
        model = Producto
        fields = [
            'marca_texto',        # ← SOLO se cambia esto
            'codigo_compra',
            'nombre',
            'precio',
            'descripcion',
            'linea',
            'presentacion',
            'unidad_medida',
            'estado',
        ]

        widgets = {
            'codigo_compra': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Código de compra (opcional)'
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
            'marca_texto': 'Marca',
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

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        # 🔹 CUANDO EDITAS, CARGA LA MARCA EN EL INPUT
        if self.instance.pk and self.instance.id_marca:
            self.fields['marca_texto'].initial = self.instance.id_marca.nombre

    def clean_precio(self):
        precio = self.cleaned_data.get('precio')
        if precio is not None and precio < 0:
            raise forms.ValidationError('El precio no puede ser negativo.')
        return precio

    def save(self, commit=True):
        producto = super().save(commit=False)

        # 🔹 CREA O REUTILIZA LA MARCA ESCRITA
        nombre_marca = self.cleaned_data['marca_texto'].strip()

        marca, created = Marca.objects.get_or_create(
            nombre__iexact=nombre_marca,
            defaults={'nombre': nombre_marca}
        )

        producto.id_marca = marca

        if commit:
            producto.save()

        return producto
