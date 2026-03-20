from django import forms
from core.form_validations import ValidationFormMixin
from .models import Servicio

class ServicioForm(ValidationFormMixin, forms.ModelForm):
    class Meta:
        model = Servicio
        fields = ['nombre', 'precio', 'descripcion', 'imagen', 'video']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del servicio'
            }),
            'precio': forms.NumberInput(attrs={
                'class': 'form-control',
                'step': '0.01',
                'min': '0',
                'placeholder': 'Precio'
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Descripción del servicio'
            }),
            'imagen': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
            'video': forms.FileInput(attrs={
                'class': 'form-control',
                'accept': 'video/*'
            }),
        }
        labels = {
            'nombre': 'Nombre del Servicio',
            'precio': 'Precio ($)',
            'descripcion': 'Descripción',
            'imagen': 'Imagen del Servicio',
            'video': 'Video del Servicio',
        }

    def clean_nombre(self):
        nombre = (self.cleaned_data.get('nombre') or '').strip()
        if not nombre:
            raise forms.ValidationError('El nombre del servicio es obligatorio.')
        return nombre

    def clean_precio(self):
        precio = self.cleaned_data.get('precio')
        if precio is None:
            raise forms.ValidationError('El precio es obligatorio.')
        if precio < 0:
            raise forms.ValidationError('El precio no puede ser negativo.')
        return precio

    def clean_descripcion(self):
        descripcion = (self.cleaned_data.get('descripcion') or '').strip()
        if not descripcion:
            raise forms.ValidationError('La descripción es obligatoria.')
        return descripcion

    def clean_imagen(self):
        imagen = self.cleaned_data.get('imagen')
        if imagen:
            content_type = getattr(imagen, 'content_type', '')
            if content_type and not content_type.startswith('image/'):
                raise forms.ValidationError('Debes subir un archivo de imagen válido.')
        return imagen

    def clean_video(self):
        video = self.cleaned_data.get('video')
        if video:
            content_type = getattr(video, 'content_type', '')
            if content_type and not content_type.startswith('video/'):
                raise forms.ValidationError('Debes subir un archivo de video válido.')
        return video
