import os

from django import forms
from .models import Servicio

class ServicioForm(forms.ModelForm):
    ALLOWED_IMAGE_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp'}
    MAX_IMAGE_SIZE_BYTES = 3 * 1024 * 1024  # 3 MB
    ALLOWED_IMAGE_MIME_TYPES = {
        'image/jpeg',
        'image/png',
        'image/webp',
        'image/gif',
        'image/bmp',
    }

    class Meta:
        model = Servicio
        fields = ['nombre', 'precio', 'descripcion', 'imagen']
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
        }
        labels = {
            'nombre': 'Nombre del Servicio',
            'precio': 'Precio ($)',
            'descripcion': 'Descripción',
            'imagen': 'Imagen del Servicio',
        }

    def clean_imagen(self):
        imagen = self.cleaned_data.get('imagen')
        if not imagen:
            return imagen

        extension = os.path.splitext(imagen.name)[1].lower()
        if extension not in self.ALLOWED_IMAGE_EXTENSIONS:
            raise forms.ValidationError(
                'Solo se permiten imagenes (JPG, JPEG, PNG, WEBP, GIF o BMP).'
            )

        content_type = (getattr(imagen, 'content_type', '') or '').lower()
        if content_type and (
            content_type not in self.ALLOWED_IMAGE_MIME_TYPES and
            not content_type.startswith('image/')
        ):
            raise forms.ValidationError('El archivo cargado no es una imagen valida.')

        if getattr(imagen, 'size', 0) > self.MAX_IMAGE_SIZE_BYTES:
            raise forms.ValidationError('La imagen supera el tamaño máximo permitido (3 MB).')

        return imagen
