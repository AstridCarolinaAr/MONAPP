from django import forms
from core.form_validations import ValidationFormMixin
from .models import Servicio


def _solo_letras_numeros_y_espacios(valor):
    valor = (valor or "").strip()
    return bool(valor) and all(ch.isalnum() or ch.isspace() for ch in valor)


def _sin_signos_peligrosos(valor):
    valor = (valor or "").strip()
    return "<" not in valor and ">" not in valor


class ServicioForm(ValidationFormMixin, forms.ModelForm):
    class Meta:
        model = Servicio
        fields = ["nombre", "precio", "descripcion", "imagen", "video", "activo"]
        widgets = {
            "nombre": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "placeholder": "Nombre del servicio",
                    "data-validate": "alnum",
                }
            ),
            "precio": forms.NumberInput(
                attrs={
                    "class": "form-control",
                    "step": "0.01",
                    "min": "0",
                    "placeholder": "Precio",
                    "inputmode": "decimal",
                    "data-validate": "money",
                }
            ),
            "descripcion": forms.Textarea(
                attrs={
                    "class": "form-control",
                    "rows": 4,
                    "placeholder": "Descripcion del servicio",
                    "data-validate": "alnum",
                }
            ),
            "imagen": forms.FileInput(attrs={
                "class": "form-control",
                "accept": "image/*",
            }),
            "video": forms.FileInput(attrs={
                "class": "form-control",
                "accept": "video/*",
            }),
        }
        labels = {
            "nombre": "Nombre del Servicio",
            "precio": "Precio ($)",
            "descripcion": "Descripcion",
            "imagen": "Imagen del Servicio",
            "video": "Video del Servicio",
            "activo": "Estado del Servicio",
        }

    def clean_nombre(self):
        nombre = (self.cleaned_data.get("nombre") or "").strip()
        if not nombre:
            raise forms.ValidationError("El nombre del servicio es obligatorio.")
        if not _sin_signos_peligrosos(nombre):
            raise forms.ValidationError("El nombre no puede contener signos especiales.")
        if not _solo_letras_numeros_y_espacios(nombre):
            raise forms.ValidationError("El nombre solo puede contener letras, numeros y espacios.")
        return nombre.title()

    def clean_precio(self):
        precio = self.cleaned_data.get("precio")
        if precio is None:
            raise forms.ValidationError("El precio es obligatorio.")
        if precio < 0:
            raise forms.ValidationError("El precio no puede ser negativo.")
        return precio

    def clean_descripcion(self):
        descripcion = (self.cleaned_data.get("descripcion") or "").strip()
        if not descripcion:
            raise forms.ValidationError("La descripcion es obligatoria.")
        if not _sin_signos_peligrosos(descripcion):
            raise forms.ValidationError("La descripcion no puede contener signos HTML.")
        if not _solo_letras_numeros_y_espacios(descripcion):
            raise forms.ValidationError("La descripcion solo puede contener letras, numeros y espacios.")
        return descripcion

    def clean_imagen(self):
        imagen = self.cleaned_data.get("imagen")
        if imagen:
            content_type = getattr(imagen, "content_type", "")
            if content_type and not content_type.startswith("image/"):
                raise forms.ValidationError("Debes subir un archivo de imagen valido.")
        return imagen

    def clean_video(self):
        video = self.cleaned_data.get("video")
        if video:
            content_type = getattr(video, "content_type", "")
            if content_type and not content_type.startswith("video/"):
                raise forms.ValidationError("Debes subir un archivo de video valido.")
        return video
