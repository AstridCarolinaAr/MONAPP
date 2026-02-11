from django import forms
from django.core.exceptions import ValidationError
from .models import Proveedor
import re


class ProveedorcrearForm(forms.ModelForm):

    class Meta:
        model = Proveedor
        fields = [
            'nit',
            'nombre_proveedor',
            'telefono_proveedor',
            'correo_proveedor',
            'direccion_proveedor',
        ]

        widgets = {
            'nit': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),

            'nombre_proveedor': forms.TextInput(attrs={
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
            'direccion_proveedor': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),
        }

class ProveedoreditarForm(forms.ModelForm):
    class Meta:
        model = Proveedor
        fields = [
            'nit',
            'nombre_proveedor',
            'telefono_proveedor',
            'correo_proveedor',
            'direccion_proveedor',
            'estado',
        ]

        widgets = {
            'nit': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True
            }),

            'nombre_proveedor': forms.TextInput(attrs={
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
            'direccion_proveedor': forms.TextInput(attrs={
                'class': 'form-control'
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

def clean_direccion_proveedor(self):
        direccion = self.cleaned_data.get('direccion_proveedor', '').strip()

        if not re.match(r'^[@ ]+$', direccion):
            raise forms.ValidationError(
                'La del proveedor debe contener un @ o un espacio.'
            )
    