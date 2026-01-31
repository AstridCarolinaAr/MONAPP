from django import forms
from django.core.exceptions import ValidationError
from .models import Proveedor
import re


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
            'nit': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'id_venta': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'codigo_marca': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'nombre_proveedor': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'fecha_entrega': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date',
                'required': True
            }),
            'cc_encargado': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'nombre_encargado': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'tipo_vehiculo': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'placa_vehiculo': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'telefono_proveedor': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'correo_proveedor': forms.EmailInput(attrs={
                'class': 'form-control',
                'required': True
            }),
            'estado': forms.Select(attrs={
                'class': 'form-select'
            }),
        }
    # ===============================
    # VALIDACIONES INDIVIDUALES
    # ===============================

    def clean_nit(self):
        nit = self.cleaned_data.get('nit', '').strip()

        if not nit.isdigit():
            raise forms.ValidationError('El NIT solo debe contener números.')

        return nit

    def clean_telefono_proveedor(self):
        telefono = self.cleaned_data.get('telefono_proveedor', '').strip()

        if not telefono.isdigit():
            raise forms.ValidationError('El teléfono solo debe contener números.')

        if len(telefono) < 7:
            raise forms.ValidationError('El teléfono es demasiado corto.')

        return telefono

    def clean_id_venta(self):
        id_venta = self.cleaned_data.get('id_venta', '').strip()

        if not id_venta.isdigit():
            raise forms.ValidationError('El ID de venta solo debe contener números.')

        return id_venta

    def clean_codigo_marca(self):
        codigo = self.cleaned_data.get('codigo_marca', '').strip()

        if not codigo.isdigit():
            raise forms.ValidationError('El código de marca solo debe contener números.')

        return codigo

    def clean_cc_encargado(self):
        cc = self.cleaned_data.get('cc_encargado', '').strip()

        if not cc.isdigit():
             raise forms.ValidationError(
            'La cédula del encargado solo debe contener números.'
        )

        return cc

    # ===============================
    # VALIDACIONES DE TEXTO
    # ===============================

    def clean_nombre_proveedor(self):
        nombre = self.cleaned_data.get('nombre_proveedor', '').strip()

        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$', nombre):
            raise forms.ValidationError(
                'El nombre del proveedor solo debe contener letras.'
            )

        return nombre.title()

    def clean_nombre_encargado(self):
        nombre = self.cleaned_data.get('nombre_encargado', '').strip()

        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ ]+$', nombre):
            raise forms.ValidationError(
                'El nombre del encargado solo debe contener letras.'
            )

        return nombre.title()
    