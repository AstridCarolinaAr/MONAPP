from django.db import models

class Proveedor(models.Model):

    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

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
    estado = models.CharField(
        max_length=10,
        choices=ESTADO_CHOICES,
        default='activo'
    )

    def __str__(self):
        return f"{self.nombre_proveedor} ({self.nit})"
