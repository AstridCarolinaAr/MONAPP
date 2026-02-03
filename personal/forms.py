from django import forms
from django.contrib.auth.models import User
from django.core.exceptions import ValidationError
import re
from .models import Personal


class PersonalForm(forms.ModelForm):
    class Meta:
        model = Personal
        fields = ['numero_documento', 'nombres', 'telefono', 'correo', 'rol', 'activo']
        widgets = {
            'numero_documento': forms.TextInput(attrs={
                'class': 'personal-form-control',
                'placeholder': 'Ingrese número de documento',
                'pattern': '[0-9]+',
                'title': 'Solo se permiten números'
            }),
            'nombres': forms.TextInput(attrs={
                'class': 'personal-form-control',
                'placeholder': 'Ingrese nombres completos',
                'pattern': '[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+',
                'title': 'Solo se permiten letras y espacios'
            }),
            'telefono': forms.TextInput(attrs={
                'class': 'personal-form-control',
                'placeholder': 'Ingrese teléfono',
                'pattern': '[0-9]+',
                'title': 'Solo se permiten números'
            }),
            'correo': forms.EmailInput(attrs={
                'class': 'personal-form-control',
                'placeholder': 'Ingrese correo electrónico'
            }),
            'rol': forms.Select(attrs={
                'class': 'personal-form-control'
            }),
            'activo': forms.CheckboxInput(attrs={
                'style': 'width: 20px; height: 20px; cursor: pointer;'
            })
        }
    
    def clean_numero_documento(self):
        """Validar que el número de documento solo contenga números"""
        numero_documento = self.cleaned_data.get('numero_documento')
        if numero_documento:
            if not numero_documento.isdigit():
                raise ValidationError('El número de documento solo puede contener números.')
        return numero_documento
    
    def clean_nombres(self):
        """Validar que los nombres solo contengan letras y espacios"""
        nombres = self.cleaned_data.get('nombres')
        if nombres:
            # Permite letras (incluyendo acentos y ñ) y espacios
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', nombres):
                raise ValidationError('El nombre solo puede contener letras y espacios.')
        return nombres
    
    def clean_telefono(self):
        """Validar que el teléfono solo contenga números"""
        telefono = self.cleaned_data.get('telefono')
        if telefono:
            if not telefono.isdigit():
                raise ValidationError('El teléfono solo puede contener números.')
        return telefono


class PersonalBusquedaForm(forms.Form):
    busqueda = forms.CharField(
        required=False,
        label='Buscar por ID, documento, nombres o contacto',
        widget=forms.TextInput(attrs={
            'class': 'personal-form-control',
            'placeholder': 'Ingrese término de búsqueda'
        })
    )
    rol = forms.ChoiceField(
        required=False,
        label='Filtrar por rol',
        choices=[('', 'Todos los roles')] + list(Personal.ROLES),
        widget=forms.Select(attrs={
            'class': 'personal-form-control'
        })
    )
