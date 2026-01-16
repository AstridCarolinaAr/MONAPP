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
    # VALIDACIONES PRO (FORM)
    # ===============================
    def clean_nit(self):
        nit = self.cleaned_data['nit']
        if not nit.isdigit():
            raise ValidationError("El NIT solo debe contener números.")
        return nit

    def clean_cc_encargado(self):
        cc = self.cleaned_data['cc_encargado']
        if not cc.isdigit():
            raise ValidationError("La cédula solo debe contener números.")
        return cc

    def clean_telefono_proveedor(self):
        telefono = self.cleaned_data['telefono_proveedor']
        if not telefono.isdigit():
            raise ValidationError("El teléfono solo debe contener números.")
        return telefono

    def clean_nombre_proveedor(self):
        nombre = self.cleaned_data['nombre_proveedor'].strip().title()
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', nombre):
            raise ValidationError("El nombre del proveedor solo debe contener letras.")
        return nombre

    def clean_nombre_encargado(self):
        nombre = self.cleaned_data['nombre_encargado'].strip().title()
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', nombre):
            raise ValidationError("El nombre del encargado solo debe contener letras.")
        return nombre

    def clean_correo_proveedor(self):
        correo = self.cleaned_data['correo_proveedor']
        if not correo.endswith(('.com', '.co')):
            raise ValidationError("El correo debe terminar en .com o .co")
        return correo
