from django import forms
from .models import Producto


class ProductoForm(forms.ModelForm):
    marca_texto = forms.CharField(
        label="Marca",
        max_length=100,
        required=False,
        widget=forms.TextInput(
            attrs={
                "class": "form-control",
                "placeholder": "Escribe la marca (Ej: Mona Keratina)",
            }
        ),
    )

    class Meta:
        model = Producto
        fields = [
            "marca",
            "nombre",
            "precio",
            "descripcion",
            "linea",
            "presentacion",
            "unidad_medida",
            "activo",
            "imagen",
            "imagen_url",
        ]
        widgets = {
            "nombre": forms.TextInput(attrs={"class": "form-control", "placeholder": "Ej: Shampoo 500ml"}),
            "precio": forms.TextInput(
                attrs={
                    "class": "form-control",
                    "inputmode": "numeric",
                    "autocomplete": "off",
                    "placeholder": "0",
                }
            ),
            "descripcion": forms.Textarea(attrs={"class": "form-control", "rows": 3}),
            "linea": forms.TextInput(attrs={"class": "form-control"}),
            "presentacion": forms.TextInput(attrs={"class": "form-control"}),
            "unidad_medida": forms.Select(attrs={"class": "form-select"}),
            "activo": forms.CheckboxInput(attrs={"class": "switch-input"}),
            "marca": forms.TextInput(
                attrs={"class": "form-control", "placeholder": "Escribe la marca (Ej: Mona Keratina)"}
            ),
            "imagen_url": forms.URLInput(attrs={"class": "form-control", "placeholder": "https://..."}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        for name, field in self.fields.items():
            if name == "activo":
                continue
            if not field.widget.attrs.get("class"):
                if field.widget.__class__.__name__ in ["Select", "SelectMultiple"]:
                    field.widget.attrs["class"] = "form-select"
                else:
                    field.widget.attrs["class"] = "form-control"

    def clean_nombre(self):
        nombre = self.cleaned_data.get("nombre", "").strip().title()

        if nombre.isdigit():
            raise forms.ValidationError("El nombre no puede ser solo numeros.")
        if not any(c.isalpha() for c in nombre):
            raise forms.ValidationError("El nombre debe contener al menos una letra.")

        if Producto.objects.exclude(pk=self.instance.pk).filter(nombre__iexact=nombre).exists():
            raise forms.ValidationError("Ya existe un producto con este nombre.")

        return nombre

    def clean(self):
        cleaned = super().clean()
        imagen = cleaned.get("imagen")
        imagen_url = cleaned.get("imagen_url")

        if imagen and imagen_url:
            self.add_error("imagen_url", "Usa solo una imagen o URL, no ambas.")

        return cleaned

