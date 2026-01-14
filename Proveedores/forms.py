from django import forms
from .models import Proveedor

class ProveedorForm(forms.ModelForm):
    class Meta:
        model = Proveedor
        fields = [
            'nit',
            'id_venta',
            'codigo_marca',
            'nombre_proveedor',
            'fecha_entrega',
            'cc_encargado',
            'nombre_encargado',
            'tipo_vehiculo',
            'placa_vehiculo',
            'telefono_proveedor',
            'correo_proveedor',
            'estado',
        ]

        widgets = {
            'nit': forms.TextInput(attrs={'class': 'form-control'}),
            'id_venta': forms.TextInput(attrs={'class': 'form-control'}),
            'codigo_marca': forms.TextInput(attrs={'class': 'form-control'}),
            'nombre_proveedor': forms.TextInput(attrs={'class': 'form-control'}),
            'fecha_entrega': forms.DateInput(
                attrs={'type': 'date', 'class': 'form-control'}
            ),
            'cc_encargado': forms.TextInput(attrs={'class': 'form-control'}),
            'nombre_encargado': forms.TextInput(attrs={'class': 'form-control'}),
            'tipo_vehiculo': forms.TextInput(attrs={'class': 'form-control'}),
            'placa_vehiculo': forms.TextInput(attrs={'class': 'form-control'}),
            'telefono_proveedor': forms.TextInput(attrs={'class': 'form-control'}),
            'correo_proveedor': forms.EmailInput(attrs={'class': 'form-control'}),
            'estado': forms.Select(attrs={'class': 'form-select'}),
        }
