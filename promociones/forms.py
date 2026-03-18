import re
from decimal import Decimal
from datetime import date
from calendar import monthrange
from django import forms
from .models import Promocion


class PromocionForm(forms.ModelForm):
    class Meta:
        model = Promocion
        fields = ['nombre', 'descripcion', 'etiqueta', 'porcentaje_descuento', 'fecha_inicio', 'fecha_fin', 'imagen', 'activa']
        widgets = {
            'nombre': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Nombre de la promoción',
                'maxlength': '200',
            }),
            'descripcion': forms.Textarea(attrs={
                'class': 'form-control',
                'rows': 3,
                'placeholder': 'Texto breve para la tarjeta pública…',
                'maxlength': '500',
            }),
            'etiqueta': forms.Select(attrs={
                'class': 'form-select',
            }),
            'porcentaje_descuento': forms.TextInput(attrs={
                'class': 'form-control',
                'inputmode': 'numeric',
                'placeholder': 'Ej: 15',
            }),
            'fecha_inicio': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date',
            }),
            'fecha_fin': forms.DateInput(attrs={
                'class': 'form-control',
                'type': 'date',
            }),
            'imagen': forms.ClearableFileInput(attrs={
                'class': 'form-control',
                'accept': 'image/jpeg,image/png,image/webp,image/gif',
            }),
            'activa': forms.CheckboxInput(attrs={
                'class': 'form-check-input',
            }),
        }
        labels = {
            'nombre': 'Nombre',
            'descripcion': 'Descripción',
            'etiqueta': 'Etiqueta',
            'porcentaje_descuento': 'Descuento (%)',
            'fecha_inicio': 'Fecha de Inicio',
            'fecha_fin': 'Fecha de Fin',
            'imagen': 'Imagen de la Promoción',
            'activa': 'Activa',
        }

    # ── Nombre ──────────────────────────────────────────────────────────
    def clean_nombre(self):
        nombre = self.cleaned_data.get('nombre', '').strip()
        if not nombre:
            raise forms.ValidationError('El nombre es obligatorio.')
        if len(nombre) < 2:
            raise forms.ValidationError('El nombre debe tener al menos 2 caracteres.')
        if len(nombre) > 200:
            raise forms.ValidationError('El nombre no puede superar 200 caracteres.')
        # Solo letras (incluye tildes/ñ) y espacios — sin números ni signos
        if not re.match(
            r'^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]+$',
            nombre
        ):
            raise forms.ValidationError(
                'El nombre solo puede contener letras y espacios. No se permiten números ni caracteres especiales.'
            )
        return nombre

    # ── Descripción ─────────────────────────────────────────────────────
    def clean_descripcion(self):
        desc = self.cleaned_data.get('descripcion', '').strip()
        if len(desc) > 500:
            raise forms.ValidationError(
                f'La descripción no puede superar 500 caracteres (actualmente {len(desc)}).'
            )
        return desc

    # ── Porcentaje de descuento ──────────────────────────────────────────
    def clean_porcentaje_descuento(self):
        pct = self.cleaned_data.get('porcentaje_descuento')
        if pct is None:
            raise forms.ValidationError('El porcentaje de descuento es obligatorio.')
        if pct < Decimal('1'):
            raise forms.ValidationError('El descuento mínimo es 1%.')
        if pct > Decimal('100'):
            raise forms.ValidationError('El descuento no puede superar el 100%.')
        if pct != pct.quantize(Decimal('0.01')):
            raise forms.ValidationError('El descuento admite máximo 2 decimales.')
        return pct

    # ── Fechas ───────────────────────────────────────────────────────────
    def clean_fecha_inicio(self):
        fecha = self.cleaned_data.get('fecha_inicio')
        if not fecha:
            raise forms.ValidationError('La fecha de inicio es obligatoria.')
        today = date.today()
        max_year  = today.year + 1
        max_day   = min(today.day, monthrange(max_year, today.month)[1])
        max_inicio = date(max_year, today.month, max_day)
        if fecha > max_inicio:
            raise forms.ValidationError(
                f'La fecha de inicio no puede ser más de 12 meses a partir de hoy ({max_inicio.strftime("%d/%m/%Y")}).'
            )
        return fecha

    def clean_fecha_fin(self):
        fecha = self.cleaned_data.get('fecha_fin')
        if not fecha:
            raise forms.ValidationError('La fecha de fin es obligatoria.')
        return fecha

    # ── Imagen ───────────────────────────────────────────────────────────
    def clean_imagen(self):
        imagen = self.cleaned_data.get('imagen')
        if imagen and hasattr(imagen, 'size'):
            max_bytes = 5 * 1024 * 1024  # 5 MB
            if imagen.size > max_bytes:
                size_mb = imagen.size / (1024 * 1024)
                raise forms.ValidationError(
                    f'La imagen pesa {size_mb:.1f} MB. El máximo permitido es 5 MB.'
                )
            tipos_validos = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
            if hasattr(imagen, 'content_type') and imagen.content_type not in tipos_validos:
                raise forms.ValidationError(
                    'Formato no válido. Solo se permiten imágenes JPG, PNG, WEBP o GIF.'
                )
        return imagen

    # ── Rango de fechas ──────────────────────────────────────────────────
    def clean(self):
        cleaned_data = super().clean()
        inicio = cleaned_data.get('fecha_inicio')
        fin    = cleaned_data.get('fecha_fin')
        if inicio and fin:
            if fin < inicio:
                self.add_error('fecha_fin', 'La fecha de fin no puede ser anterior a la fecha de inicio.')
            from datetime import timedelta
            if (fin - inicio).days > 365:
                self.add_error('fecha_fin', 'La promoción no puede durar más de 1 año (365 días).')            # La fecha de fin no puede pasar del 31/12 del año límite (año de inicio_max)
            today = date.today()
            max_year_inicio  = today.year + 1
            max_day_inicio   = min(today.day, monthrange(max_year_inicio, today.month)[1])
            max_inicio = date(max_year_inicio, today.month, max_day_inicio)
            max_fin    = date(max_inicio.year, 12, 31)
            if fin > max_fin:
                self.add_error('fecha_fin', f'La fecha de fin no puede superar el 31/12/{max_fin.year}.')
        return cleaned_data
