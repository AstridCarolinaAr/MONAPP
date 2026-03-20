from django import forms
from .models import GestionAlisado
from clientes.models import Cliente
from core.form_validations import ValidationFormMixin


class GestionAlisadoForm(ValidationFormMixin, forms.ModelForm):
    class Meta:
        model = GestionAlisado
        fields = [
            'cliente', 'precio_alisado', 'es_oferta_especial', 'descripcion_oferta',
            'anticipo_cliente', 'medio_pago', 'saldo_pendiente',
            'procedimiento_realizado_por', 'tipo_alisado', 'requiere_resellado',
            'porcentaje_alisado', 'porosidad', 'textura', 'forma_natural',
            'elasticidad', 'longitud', 'densidad', 'piel_cabelludo',
            'alopecia', 'caida_cabello', 'lactante', 'gestante', 'caspa',
            'procesos_tintura', 'procesos_decoloracion', 'procesos_ondulados',
            'procesos_extracciones', 'procesos_alisados', 'procesos_super_aclarante',
            'procesos_otro', 'cuenta_con_secador', 'frecuencia_recoge_cabello',
            'realiza_ejercicio', 'frecuencia_ejercicio', 'usa_casco',
            'productos_capilares', 'se_bana_agua_caliente', 'requiere_refuerzo_15dias',
            'sufre_tiroides', 'medicamento_tiroides', 'despunte_hoy',
            'recomendaciones_post_cuidados', 'firma_consentimiento'
        ]
        widgets = {
            'cliente': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required',
                'id': 'selectCliente'
            }),
            'precio_alisado': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '0',
                'placeholder': 'Precio del alisado en COP',
                'required': 'required'
            }),
            'es_oferta_especial': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'descripcion_oferta': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Describe la promoción'
            }),
            'anticipo_cliente': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '0',
                'placeholder': 'Anticipo realizado en COP',
                'required': 'required'
            }),
            'medio_pago': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'saldo_pendiente': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '0',
                'placeholder': 'Saldo pendiente en COP',
                'readonly': 'readonly'
            }),
            'procedimiento_realizado_por': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre del profesional',
                'required': 'required'
            }),
            'tipo_alisado': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Describe el tipo de alisado a realizar',
                'required': 'required'
            }),
            'requiere_resellado': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'porcentaje_alisado': forms.NumberInput(attrs={
                'class': 'form-control',
                'min': '0',
                'max': '100',
                'placeholder': 'Porcentaje',
                'required': 'required'
            }),
            'porosidad': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'textura': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'forma_natural': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'elasticidad': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'longitud': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'densidad': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'piel_cabelludo': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'alopecia': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'caida_cabello': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'lactante': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'gestante': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'caspa': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'procesos_tintura': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'procesos_decoloracion': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'procesos_ondulados': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'procesos_extracciones': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'procesos_alisados': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'procesos_super_aclarante': forms.CheckboxInput(attrs={'class': 'form-check-input'}),
            'procesos_otro': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Especifique otros procesos'
            }),
            'cuenta_con_secador': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'frecuencia_recoge_cabello': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Frecuencia con la que recoge su cabello',
                'required': 'required'
            }),
            'realiza_ejercicio': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'frecuencia_ejercicio': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Cuántas veces a la semana'
            }),
            'usa_casco': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'productos_capilares': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Marca de shampoo, acondicionador y mascarilla',
                'required': 'required'
            }),
            'se_bana_agua_caliente': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'requiere_refuerzo_15dias': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'sufre_tiroides': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'medicamento_tiroides': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 2,
                'placeholder': 'Especifique el medicamento'
            }),
            'despunte_hoy': forms.Select(attrs={
                'class': 'form-select',
                'required': 'required'
            }),
            'recomendaciones_post_cuidados': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 4,
                'placeholder': 'Recomendaciones o anotaciones sobre post cuidados',
                'required': 'required'
            }),
            'firma_consentimiento': forms.ClearableFileInput(attrs={
                'class': 'form-control',
                'accept': 'image/*'
            }),
        }
    
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Cargar clientes activos en el dropdown
        self.fields['cliente'].queryset = Cliente.objects.filter(estado='activo').order_by('nombre', 'apellido')
        # Función para mostrar nombre completo y documento
        self.fields['cliente'].label_from_instance = lambda obj: f"{obj.nombre} {obj.apellido} - {obj.numero_documento}"
    
    def clean(self):
        cleaned_data = super().clean()
        precio = cleaned_data.get('precio_alisado')
        anticipo = cleaned_data.get('anticipo_cliente')
        
        # Calcular saldo pendiente automáticamente
        if precio is not None and anticipo is not None:
            cleaned_data['saldo_pendiente'] = precio - anticipo
        
        return cleaned_data
