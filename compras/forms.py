from django import forms
from django.forms import inlineformset_factory
from .models import Compra, DetalleCompra
from Proveedores.models import Proveedor
from Productos.models import Producto


class CompraForm(forms.ModelForm):
    class Meta:
        model = Compra
        fields = [
            "proveedor",

        ]
        widgets = {
            "proveedor": forms.Select(attrs={"class": "form-select"}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["proveedor"].queryset = Proveedor.objects.filter(estado="activo").order_by("nombre_proveedor")

class DetalleCompraForm(forms.ModelForm):
    class Meta:
        model = DetalleCompra
        fields = ["producto", "cantidad", "precio_unitario"]
        widgets = {
            "cantidad": forms.NumberInput(attrs={"class": "form-control", "min": 1}),
            "precio_unitario": forms.TextInput(attrs={
                "class": "form-control text-end js-cop",
                "inputmode": "numeric",
                "autocomplete": "off",
                "placeholder": "0",
            }),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

        self.fields["producto"].queryset = Producto.objects.all().order_by("nombre")

        self.fields["producto"].label_from_instance = lambda obj: obj.nombre

        self.fields["producto"].widget.attrs.update({"class": "form-select"})


DetalleCompraFormSet = inlineformset_factory(
    Compra,
    DetalleCompra,
    form=DetalleCompraForm,
    extra=1,
    can_delete=True,
)