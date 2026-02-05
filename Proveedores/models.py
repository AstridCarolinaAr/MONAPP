from django.db import models
from django.core.exceptions import ValidationError


class Proveedor(models.Model):

    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    # ===============================
    # INFORMACIÓN COMERCIAL
    # ===============================
    nit = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="NIT"
    )



    # ===============================
    # INFORMACIÓN DEL PROVEEDOR
    # ===============================
    nombre_proveedor = models.CharField(
        max_length=150,
        unique=True,
        verbose_name="Proveedor"
    )


    # ===============================
    # CONTACTO
    # ===============================
    telefono_proveedor = models.CharField(
        max_length=20,
        verbose_name="Teléfono"
    )

    correo_proveedor = models.EmailField(
        verbose_name="Correo"
    )

    # ===============================
    # ESTADO
    # ===============================
    estado = models.CharField(
        max_length=10,
        choices=[('activo', 'Activo'), ('inactivo', 'Inactivo')],
        default='activo'
    )

    # ===============================
    # META
    # ===============================
    class Meta:
        verbose_name = "Proveedor"
        verbose_name_plural = "Proveedores"
        ordering = ['nombre_proveedor']
        indexes = [
            models.Index(fields=['nombre_proveedor']),
            models.Index(fields=['nit']),
            models.Index(fields=['estado']),
        ]

    # ===============================
    # VALIDACIONES PRO (MODELO)
    # ===============================
    def clean(self):
        # Normalizar textos
        self.nombre_proveedor = self.nombre_proveedor.strip().title()

        # Validar NIT duplicado
        if Proveedor.objects.exclude(pk=self.pk).filter(
            nit__iexact=self.nit
        ).exists():
            raise ValidationError({'nit': 'Ya existe un proveedor con este NIT.'})

        # Validar nombre proveedor duplicado
        if Proveedor.objects.exclude(pk=self.pk).filter(
            nombre_proveedor__iexact=self.nombre_proveedor
        ).exists():
            raise ValidationError({'nombre_proveedor': 'Ya existe un proveedor con este nombre.'})

    def save(self, *args, **kwargs):
        self.full_clean()  # fuerza clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre_proveedor} ({self.nit})"
