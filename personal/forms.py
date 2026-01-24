from django import forms
from django.contrib.auth.models import User
from .models import Personal


class PersonalForm(forms.ModelForm):
    class Meta:
        model = Personal
        fields = ['numero_documento', 'nombres', 'telefono', 'correo', 'rol', 'activo']
        widgets = {
            'numero_documento': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ingrese número de documento'
            }),
            'nombres': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ingrese nombres completos'
            }),
            'telefono': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ingrese teléfono'
            }),
            'correo': forms.EmailInput(attrs={
                'class': 'form-control',
                'placeholder': 'Ingrese correo electrónico'
            }),
            'rol': forms.Select(attrs={
                'class': 'form-control'
            }),
            'activo': forms.CheckboxInput(attrs={
                'class': 'form-check-input'
            })
        }


class PersonalBusquedaForm(forms.Form):
    busqueda = forms.CharField(
        required=False,
        label='Buscar por ID, documento, nombres o contacto',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingrese término de búsqueda'
        })
    )
    rol = forms.ChoiceField(
        required=False,
        label='Filtrar por rol',
        choices=[('', 'Todos los roles')] + list(Personal.ROLES),
        widget=forms.Select(attrs={
            'class': 'form-control'
        })
    )
