from django.db import models
<<<<<<< HEAD
=======
from django.core.exceptions import ValidationError

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0

class Proveedor(models.Model):

    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

<<<<<<< HEAD
    # Información comercial
    nit = models.CharField(max_length=20)
    id_venta = models.CharField(max_length=50)
    codigo_marca = models.CharField(max_length=50)

    # Información del proveedor
    nombre_proveedor = models.CharField(max_length=150)
    fecha_entrega = models.DateField()

    # Responsable
    cc_encargado = models.CharField(max_length=20)
    nombre_encargado = models.CharField(max_length=150)

    # Transporte
    tipo_vehiculo = models.CharField(max_length=100)
    placa_vehiculo = models.CharField(max_length=20)

    # Contacto
    telefono_proveedor = models.CharField(max_length=20)
    correo_proveedor = models.EmailField()

    # Estado
=======
    # ===============================
    # INFORMACIÓN COMERCIAL
    # ===============================
    nit = models.CharField(
        max_length=20,
        unique=True,
        verbose_name="NIT"
    )

    id_venta = models.CharField(
        max_length=50,
        verbose_name="ID Venta"
    )

    codigo_marca = models.CharField(
        max_length=50,
        verbose_name="Código Marca"
    )

    # ===============================
    # INFORMACIÓN DEL PROVEEDOR
    # ===============================
    nombre_proveedor = models.CharField(
        max_length=150,
        unique=True,
        verbose_name="Proveedor"
    )

    fecha_entrega = models.DateField(
        verbose_name="Fecha de entrega"
    )

    # ===============================
    # RESPONSABLE
    # ===============================
    cc_encargado = models.CharField(
        max_length=20,
        verbose_name="Cédula encargado"
    )

    nombre_encargado = models.CharField(
        max_length=150,
        verbose_name="Nombre encargado"
    )

    # ===============================
    # TRANSPORTE
    # ===============================
    tipo_vehiculo = models.CharField(
        max_length=100,
        verbose_name="Tipo de vehículo"
    )

    placa_vehiculo = models.CharField(
        max_length=20,
        verbose_name="Placa"
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
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    estado = models.CharField(
        max_length=10,
        choices=ESTADO_CHOICES,
        default='activo'
    )

<<<<<<< HEAD
=======
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
        self.nombre_encargado = self.nombre_encargado.strip().title()

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

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    def __str__(self):
        return f"{self.nombre_proveedor} ({self.nit})"
