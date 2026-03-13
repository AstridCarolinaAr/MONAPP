from django import forms
from django.forms import inlineformset_factory
from .models import Compra, DetalleCompra
from Proveedores.models import Proveedor
from Productos.models import Producto
from django.db.models import Q  

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

        #  Base: solo activos
        qs = Producto.objects.filter(activo=True)

        #  Si estamos editando un detalle existente, incluir su producto aunque esté inactivo
        if self.instance and self.instance.producto_id:
            qs = (qs | Producto.objects.filter(pk=self.instance.producto_id)).distinct()

        self.fields["producto"].queryset = qs.order_by("nombre")
        self.fields["producto"].widget.attrs.update({"class": "form-select"})

        #  Mostrar etiqueta bonita (Inactivo)
        self.fields["producto"].label_from_instance = lambda obj: (
            f"{obj.nombre} (Inactivo)" if not obj.activo else obj.nombre
        )

        #  Si el producto actual del detalle está inactivo, no permitir cambiarlo
        if self.instance and self.instance.producto_id and not self.instance.producto.activo:
            self.fields["producto"].disabled = True
            self.fields["producto"].help_text = (
                "Este producto está inactivo y no se puede cambiar en una compra existente."
            )

    def clean_producto(self):
        """
         Seguridad extra: aunque manipulen el POST, no dejamos cambiar el producto
        si el producto original del detalle está inactivo.
        """
        producto = self.cleaned_data.get("producto")

        if self.instance and self.instance.producto_id and not self.instance.producto.activo:
            return self.instance.producto  # forzamos el original

        return producto


DetalleCompraFormSet = inlineformset_factory(
    Compra,
    DetalleCompra,
    form=DetalleCompraForm,
    extra=1,
    can_delete=True,
    validate_min=False
)