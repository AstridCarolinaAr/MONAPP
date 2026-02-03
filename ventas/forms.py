from django import forms
from .models import Venta

class VentaForm(forms.ModelForm):
    class Meta:
        model = Venta
        fields = [
            'cliente',
            'codigo_producto',
            'precio_unitario',
            'cantidad',
        ]
        widgets = {
            'cliente': forms.Select(attrs={
                'class': 'form-select',
                'id': 'id_cliente'
            }),
            'codigo_producto': forms.Select(attrs={
                'class': 'form-select',
                'id': 'id_producto'
            }),
            'precio_unitario': forms.NumberInput(attrs={
                'class': 'form-control',
                'id': 'id_precio_unitario',
                'readonly': True,
                'tabindex': '-1'   # 👈 evita focus
            }),
            'cantidad': forms.NumberInput(attrs={
                'class': 'form-control',
                'id': 'id_cantidad',
                'min': 1
            }),
        }
