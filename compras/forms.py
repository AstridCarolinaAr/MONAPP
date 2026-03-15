from django import forms
from django.forms import inlineformset_factory,BaseInlineFormSet
from .models import (
    Compra,
    DetalleCompra,
    DevolucionCompra,
    DetalleDevolucionCompra,
)
from Proveedores.models import Proveedor
from Productos.models import Producto
from django.db.models import Q,Sum

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
class DevolucionCompraForm(forms.ModelForm):
    class Meta:
        model = DevolucionCompra
        fields = ["compra", "motivo", "observacion"]
        widgets = {
            "compra": forms.Select(attrs={"class": "form-select"}),
            "motivo": forms.TextInput(attrs={"class": "form-control"}),
            "observacion": forms.Textarea(attrs={"class": "form-control", "rows": 3}),
        }

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["compra"].queryset = (
            Compra.objects
            .filter(anulada=False)
            .select_related("proveedor")
            .order_by("-id")
        )
        self.fields["compra"].label_from_instance = lambda obj: (
            f"Compra #{obj.id} - {obj.proveedor.nombre_proveedor}"
        )

    def clean_compra(self):
        compra = self.cleaned_data.get("compra")
        if compra and compra.anulada:
            raise forms.ValidationError("No puedes devolver sobre una compra anulada.")
        return compra


class DetalleDevolucionCompraForm(forms.ModelForm):
    class Meta:
        model = DetalleDevolucionCompra
        fields = ["detalle_compra", "cantidad"]
        widgets = {
            "detalle_compra": forms.Select(attrs={"class": "form-select"}),
            "cantidad": forms.NumberInput(attrs={"class": "form-control", "min": 1}),
        }

    def __init__(self, *args, **kwargs):
        self.compra_ref = kwargs.pop("compra", None)
        super().__init__(*args, **kwargs)

        qs = DetalleCompra.objects.none()

        if self.compra_ref is not None:
            qs = (
                DetalleCompra.objects
                .filter(compra=self.compra_ref)
                .select_related("compra", "producto", "compra__proveedor")
                .order_by("producto__nombre")
            )

        self.fields["detalle_compra"].queryset = qs
        self.fields["detalle_compra"].label_from_instance = lambda obj: (
            f"{obj.producto.nombre} - Comprado: {obj.cantidad} - Precio: ${obj.precio_unitario}"
        )

    def clean(self):
        cleaned_data = super().clean()

        detalle_compra = cleaned_data.get("detalle_compra")
        cantidad = cleaned_data.get("cantidad")

        fila_vacia = not detalle_compra and not cantidad
        if fila_vacia:
            return cleaned_data

        if not detalle_compra:
            self.add_error("detalle_compra", "Selecciona un detalle de compra.")
            return cleaned_data

        if not cantidad or cantidad <= 0:
            self.add_error("cantidad", "La cantidad debe ser mayor que 0.")
            return cleaned_data

        if self.compra_ref and detalle_compra.compra_id != self.compra_ref.id:
            self.add_error("detalle_compra", "Ese detalle no pertenece a la compra seleccionada.")
            return cleaned_data

        qs_devueltas = DetalleDevolucionCompra.objects.filter(
            detalle_compra=detalle_compra,
            devolucion__anulada=False
        )

        if self.instance.pk:
            qs_devueltas = qs_devueltas.exclude(pk=self.instance.pk)

        cantidad_ya_devuelta = qs_devueltas.aggregate(total=Sum("cantidad"))["total"] or 0
        disponible_para_devolver = max((detalle_compra.cantidad or 0) - cantidad_ya_devuelta, 0)

        if cantidad > disponible_para_devolver:
            self.add_error(
                "cantidad",
                f"Solo puedes devolver hasta {disponible_para_devolver} unidad(es) de este producto."
            )

        stock_actual = detalle_compra.producto.stock_actual or 0
        if cantidad > stock_actual:
            self.add_error(
                "cantidad",
                f"No puedes devolver {cantidad}. Stock disponible actual: {stock_actual}."
            )

        return cleaned_data


class BaseDetalleDevolucionCompraFormSet(BaseInlineFormSet):
    def clean(self):
        super().clean()

        if any(self.errors):
            return

        hay_detalle = False

        for form in self.forms:
            if not hasattr(form, "cleaned_data"):
                continue

            if not form.cleaned_data or form.cleaned_data.get("DELETE"):
                continue

            detalle_compra = form.cleaned_data.get("detalle_compra")
            cantidad = form.cleaned_data.get("cantidad")

            if detalle_compra and cantidad and cantidad > 0:
                hay_detalle = True
                break

        if not hay_detalle:
            raise forms.ValidationError("Debes agregar al menos un producto a devolver.")


DetalleDevolucionCompraFormSet = inlineformset_factory(
    DevolucionCompra,
    DetalleDevolucionCompra,
    form=DetalleDevolucionCompraForm,
    formset=BaseDetalleDevolucionCompraFormSet,
    extra=1,
    can_delete=True,
    validate_min=False
)