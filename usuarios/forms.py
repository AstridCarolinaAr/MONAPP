from django import forms
from django.contrib.auth.forms import AuthenticationForm, UserCreationForm
from django.contrib.auth.models import User
from .models import PerfilUsuario
from django.contrib.auth.models import Group


class LoginForm(AuthenticationForm):
    """
    Formulario personalizado para inicio de sesión
    Usamos el campo username para almacenar el documento
    """
    username = forms.CharField(
        label='Documento',
        max_length=20,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingrese su documento o usuario',
            'autofocus': True
        })
    )
    
    password = forms.CharField(
        label='Contraseña',
        widget=forms.PasswordInput(attrs={
            'class': 'form-control',
            'placeholder': 'Ingrese su contraseña',
            'id': 'password'
        })
    )
    
    remember_me = forms.BooleanField(
        required=False,
        initial=True,
        widget=forms.CheckboxInput(attrs={
            'class': 'form-check-input',
            'id': 'remember_me'
        }),
        label='Recordarme'
    )


class RegistroForm(UserCreationForm):
    """
    Formulario para registro de nuevos usuarios
    Extiende UserCreationForm de Django
    """
    
    ROL_CHOICES = [
        ('Administrador', 'Administrador'),
        ('Auxiliar', 'Auxiliar'),
        ('Colaborador', 'Colaborador'),
    ]

    rol = forms.ChoiceField(
        choices=ROL_CHOICES,
        required=True,
        widget=forms.Select(attrs={
            'class': 'form-control'
        }),
        label='Rol del usuario'
    )

    
    documento = forms.CharField(
        max_length=20,
        required=True,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Número de documento',
            'pattern': '[0-9]+',
            'title': 'Solo se permiten números'
        }),
        label='Documento'
    )
    
    email = forms.EmailField(
        required=True,
        widget=forms.EmailInput(attrs={
            'class': 'form-control',
            'placeholder': 'correo@ejemplo.com'
        })
    )
    
    first_name = forms.CharField(
        max_length=150,
        required=True,
        label='Nombre',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Nombre',
            'pattern': '[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+',
            'title': 'Solo se permiten letras y espacios'
        })
    )
    
    last_name = forms.CharField(
        max_length=150,
        required=True,
        label='Apellido',
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Apellido',
            'pattern': '[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+',
            'title': 'Solo se permiten letras y espacios'
        })
    )
    
    telefono = forms.CharField(
        max_length=15,
        required=False,
        widget=forms.TextInput(attrs={
            'class': 'form-control',
            'placeholder': 'Teléfono (opcional)',
            'pattern': '[0-9]+',
            'title': 'Solo se permiten números'
        }),
        label='Teléfono'
    )
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'password1', 'password2']
        widgets = {
            'password1': forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Contraseña'}),
            'password2': forms.PasswordInput(attrs={'class': 'form-control', 'placeholder': 'Confirmar contraseña'}),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Reordenar campos para que aparezcan en el orden deseado
        self.order_fields(['documento', 'email', 'first_name', 'last_name', 'password1', 'password2', 'rol', 'telefono'])
    
    def clean_documento(self):
        """Valida que el documento no exista en la base de datos"""
        documento = self.cleaned_data.get('documento')
        if documento:
            # Validar que solo contenga números
            if not documento.isdigit():
                raise forms.ValidationError('El documento solo puede contener números.')
            # Validar que no exista
            if PerfilUsuario.objects.filter(documento=documento).exists():
                raise forms.ValidationError('Este documento ya está registrado.')
        return documento
    
    def clean_email(self):
        """Valida que el email no exista en la base de datos"""
        email = self.cleaned_data.get('email')
        if User.objects.filter(email=email).exists():
            raise forms.ValidationError('Este correo electrónico ya está registrado.')
        return email
    
    def clean_first_name(self):
        """Validar que el nombre solo contenga letras y espacios"""
        first_name = self.cleaned_data.get('first_name')
        if first_name:
            import re
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', first_name):
                raise forms.ValidationError('El nombre solo puede contener letras y espacios.')
        return first_name
    
    def clean_last_name(self):
        """Validar que el apellido solo contenga letras y espacios"""
        last_name = self.cleaned_data.get('last_name')
        if last_name:
            import re
            if not re.match(r'^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$', last_name):
                raise forms.ValidationError('El apellido solo puede contener letras y espacios.')
        return last_name
    
    def clean_telefono(self):
        """Validar que el teléfono solo contenga números"""
        telefono = self.cleaned_data.get('telefono')
        if telefono and not telefono.isdigit():
            raise forms.ValidationError('El teléfono solo puede contener números.')
        return telefono
    
    def save(self, commit=True):
        user = super().save(commit=False)

        # Documento como username
        user.username = self.cleaned_data['documento']
        user.email = self.cleaned_data['email']

        rol = self.cleaned_data['rol']

        # Configurar is_staff según rol
        if rol in ['Administrador', 'Auxiliar']:
            user.is_staff = True
        else:
            user.is_staff = False

        if commit:
            user.save()

            # Perfil (ya existe por la señal)
            perfil = user.perfil
            perfil.documento = self.cleaned_data['documento']
            perfil.telefono = self.cleaned_data.get('telefono', '')
            perfil.save()

            # Asignar grupo (crear si no existe)
            user.groups.clear()
            grupo, created = Group.objects.get_or_create(name=rol)
            user.groups.add(grupo)

        return user



class EditarUsuarioForm(forms.ModelForm):

    ROL_CHOICES = [
        ('Administrador', 'Administrador'),
        ('Auxiliar', 'Auxiliar'),
        ('Colaborador', 'Colaborador'),
    ]

    rol = forms.ChoiceField(
        choices=ROL_CHOICES,
        required=True,
        widget=forms.Select(attrs={'class': 'form-control'}),
        label='Rol'
    )

    class Meta:
        model = User
        fields = ['first_name', 'last_name', 'email', 'is_active']
    def __init__(self, *args, **kwargs):
     super().__init__(*args, **kwargs)
     if self.instance.pk:
        grupos = self.instance.groups.values_list('name', flat=True)
        if grupos:
            self.fields['rol'].initial = grupos[0]



class EditarPerfilForm(forms.ModelForm):
    """
    Formulario para editar el perfil del usuario
    """
    class Meta:
        model = PerfilUsuario
        fields = [
            'documento',
            'telefono',
            'direccion',
            'foto_perfil',
            'fecha_nacimiento'
        ]
        widgets = {
            'documento': forms.TextInput(attrs={
                'class': 'form-control',
                'readonly': 'readonly'
            }),
            'telefono': forms.TextInput(attrs={'class': 'form-control'}),
            'direccion': forms.TextInput(attrs={'class': 'form-control'}),
            'foto_perfil': forms.FileInput(attrs={'class': 'form-control'}),
            'fecha_nacimiento': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date'
            }),
        }

