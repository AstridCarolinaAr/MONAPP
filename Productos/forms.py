from django import forms
from .models import Producto, Marca


class ProductoForm(forms.ModelForm):
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
                'placeholder': 'Código de compra (opcional)',
                'required': 'true'
            }),
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del producto',
                'required': 'true'
            }),
            'precio': forms.TextInput(attrs={
                'class': 'form-control precio-formateado',
                'min': 0,
                'placeholder': 'Precio en pesos colombianos',
                'inputmode': 'numeric',
                'required': 'true'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Descripción del producto',
                'required': 'true'
            }),
            'linea': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Línea del producto',
                'required': 'true'
            }),
            'presentacion': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ej: 500ml, caja x12',
                'required': 'true'
            }),
            'unidad_medida': forms.Select(attrs={
                'class': 'form-select',
                'required': 'true'
                
            }),
            'estado': forms.Select(attrs={
                'class': 'form-select',
 
            }),
        }

        labels = {
            'codigo_compra': 'Código de Compra',
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

        # ✅ Cargar marca al editar
        if self.instance.pk and self.instance.id_marca:
            self.fields['marca_texto'].initial = self.instance.id_marca.nombre

    def clean_precio(self):
        precio = self.cleaned_data.get('precio')
        if precio is not None and precio < 0:
            raise forms.ValidationError('El precio no puede ser negativo.')
        return precio

    def save(self, commit=True):
        producto = super().save(commit=False)

        nombre_marca = self.cleaned_data['marca_texto'].strip()

        marca, _ = Marca.objects.get_or_create(
            nombre__iexact=nombre_marca,
            defaults={'nombre': nombre_marca}
        )

        producto.id_marca = marca

        if commit:
            producto.save()

        return producto
def clean(self):
    cleaned = super().clean()

    for campo in [
        'marca_texto',
        'nombre',
        'precio',
        'estado',
        'unidad_medida',
    ]:
        if not cleaned.get(campo):
            self.add_error(campo, 'Este campo es obligatorio.')

    return cleaned
