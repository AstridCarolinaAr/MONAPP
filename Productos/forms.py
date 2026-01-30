from django import forms
from .models import Producto, Marca


class ProductoForm(forms.ModelForm):

    marca_texto = forms.CharField(
        label='Marca',
        max_length=100,
        required=False,  # 👈 importante
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Escribe la marca (Ej: Mona Keratina)'
        })
    )

    class Meta:
        model = Producto
        fields = [
            'nombre',
            'precio',
            'descripcion',
            'linea',
            'presentacion',
            'cantidad',
            'unidad_medida',
            'estado',
        ]

        widgets = {
            'nombre': forms.TextInput(attrs={'class': 'form-control'}),
            'precio': forms.NumberInput(attrs={'class': 'form-control'}),
            'descripcion': forms.Textarea(attrs={'class': 'form-control', 'rows': 4}),
            'linea': forms.TextInput(attrs={'class': 'form-control'}),
            'presentacion': forms.TextInput(attrs={'class': 'form-control'}),
            'cantidad': forms.NumberInput(attrs={'class': 'form-control'}),
            'unidad_medida': forms.Select(attrs={'class': 'form-select'}),
            'estado': forms.Select(attrs={'class': 'form-select'}),
        }

    # ===============================
    # VALIDACIONES
    # ===============================

    def clean_nombre(self):
        nombre = self.cleaned_data.get('nombre', '').strip().title()

        if Producto.objects.exclude(pk=self.instance.pk).filter(
            nombre__iexact=nombre
        ).exists():
            raise forms.ValidationError('Ya existe un producto con este nombre.')

        return nombre

    def clean(self):
        cleaned = super().clean()

        campos_obligatorios = [
            'nombre',
            'precio',
            'linea',
            'presentacion',
            'cantidad',
            'unidad_medida',
            'estado',
        ]

        # 👉 SOLO pedir marca al CREAR
        if not self.instance.pk:
            if not cleaned.get('marca_texto'):
                self.add_error('marca_texto', 'Este campo es obligatorio.')

        return cleaned

    # ===============================
    # SAVE
    # ===============================

    def save(self, commit=True):
        producto = super().save(commit=False)

        marca_texto = self.cleaned_data.get('marca_texto')
        if marca_texto:
            marca, _ = Marca.objects.get_or_create(
                nombre__iexact=marca_texto.strip().title(),
                defaults={'nombre': marca_texto.strip().title()}
            )
            producto.id_marca = marca

        if commit:
            producto.save()

        return producto
