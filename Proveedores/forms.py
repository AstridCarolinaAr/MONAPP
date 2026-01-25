from django import forms
from django.core.exceptions import ValidationError
from .models import Proveedor
import re


<<<<<<< HEAD

class ProveedorForm(forms.ModelForm):
=======
class ProveedorForm(forms.ModelForm):

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
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
<<<<<<< HEAD
                'maxlength': 15,
                'data-only': 'number'
            }),
            'id_venta': forms.TextInput(attrs={
                'class': 'form-control',
                'maxlength': 15,
                'data-only': 'number'
            }),
            'codigo_marca': forms.TextInput(attrs={
                'class': 'form-control',
                'maxlength': 15,
                'data-only': 'number'
            }),
            'nombre_proveedor': forms.TextInput(attrs={
                'class': 'form-control'
            }),
            'fecha_entrega': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
            'cc_encargado': forms.TextInput(attrs={
                'class': 'form-control',
                'maxlength': 15,
                'data-only': 'number'
            }),
            'nombre_encargado': forms.TextInput(attrs={
                'class': 'form-control'
            }),
            'tipo_vehiculo': forms.TextInput(attrs={
                'class': 'form-control'
            }),
            'placa_vehiculo': forms.TextInput(attrs={
                'class': 'form-control'
            }),
            'telefono_proveedor': forms.TextInput(attrs={
                'class': 'form-control',
                'maxlength': 15,
                'data-only': 'number'
            }),
            'correo_proveedor': forms.EmailInput(attrs={
                'class': 'form-control'
=======
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
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
            }),
            'estado': forms.Select(attrs={
                'class': 'form-select'
            }),
        }

<<<<<<< HEAD

    # ===== VALIDACIONES =====

=======
    # ===============================
    # VALIDACIONES PRO (FORM)
    # ===============================
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    def clean_nit(self):
        nit = self.cleaned_data['nit']
        if not nit.isdigit():
            raise ValidationError("El NIT solo debe contener números.")
        return nit

    def clean_cc_encargado(self):
        cc = self.cleaned_data['cc_encargado']
        if not cc.isdigit():
<<<<<<< HEAD
            raise ValidationError("El documento del encargado solo debe contener números.")
=======
            raise ValidationError("La cédula solo debe contener números.")
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
        return cc

    def clean_telefono_proveedor(self):
        telefono = self.cleaned_data['telefono_proveedor']
        if not telefono.isdigit():
            raise ValidationError("El teléfono solo debe contener números.")
        return telefono

    def clean_nombre_proveedor(self):
<<<<<<< HEAD
        nombre = self.cleaned_data['nombre_proveedor']
=======
        nombre = self.cleaned_data['nombre_proveedor'].strip().title()
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', nombre):
            raise ValidationError("El nombre del proveedor solo debe contener letras.")
        return nombre

    def clean_nombre_encargado(self):
<<<<<<< HEAD
        nombre = self.cleaned_data['nombre_encargado']
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', nombre):
            raise ValidationError("El nombre del encargado solo debe contener letras.")
        return nombre
    def clean_correo_proveedor(self):
        correo = self.cleaned_data['correo_proveedor']
        if not correo.endswith(('.com', '.co')):
            raise ValidationError("El correo debe ser .com o .co")
        return correo
    def _solo_numeros(self, valor, campo):
      if not valor.isdigit():
        raise ValidationError(f"El campo {campo} solo admite números.")
      return valor
=======
        nombre = self.cleaned_data['nombre_encargado'].strip().title()
        if not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', nombre):
            raise ValidationError("El nombre del encargado solo debe contener letras.")
        return nombre

    def clean_correo_proveedor(self):
        correo = self.cleaned_data['correo_proveedor']
        if not correo.endswith(('.com', '.co')):
            raise ValidationError("El correo debe terminar en .com o .co")
        return correo
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
