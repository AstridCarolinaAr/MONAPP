from django import forms
from .models import Producto, Marca


class ProductoForm(forms.ModelForm):

    marca_texto = forms.CharField(
        label='Marca',
        max_length=100,
        required=True,
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
                'placeholder': 'Código de compra'
            }),
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del producto'
            }),
            'precio': forms.TextInput(attrs={
                'class': 'form-control precio-formateado',
                'inputmode': 'numeric',
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

    # ===============================
    # VALIDACIONES
    # ===============================

    def clean_nombre(self):
        nombre = self.cleaned_data.get('nombre', '').strip().title()

        if Producto.objects.exclude(pk=self.instance.pk).filter(
            nombre__iexact=nombre
        ).exists():
            raise forms.ValidationError(
                'Ya existe un producto con este nombre.'
            )

        return nombre

    def clean_precio(self):
        precio = self.cleaned_data.get('precio')

        if precio is None:
            raise forms.ValidationError('El precio es obligatorio.')

        if precio < 0:
            raise forms.ValidationError('El precio no puede ser negativo.')

        return precio

    def clean(self):
        cleaned = super().clean()

        campos_obligatorios = [
            'marca_texto',
            'nombre',
            'precio',
            'descripcion',
            'linea',
            'presentacion',
            'unidad_medida',
            'estado',
        ]

        for campo in campos_obligatorios:
            if not cleaned.get(campo):
                self.add_error(campo, 'Este campo es obligatorio.')

        return cleaned

    # ===============================
    # SAVE
    # ===============================

    def save(self, commit=True):
        producto = super().save(commit=False)

        nombre_marca = self.cleaned_data['marca_texto'].strip().title()

        marca, _ = Marca.objects.get_or_create(
            nombre__iexact=nombre_marca,
            defaults={'nombre': nombre_marca}
        )

        producto.id_marca = marca

        if commit:
            producto.save()

        return producto
