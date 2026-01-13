from django.db import models

class Proveedor(models.Model):

    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]


    nit = models.CharField(max_length=20)
    id_venta = models.CharField(max_length=50)
    codigo_marca = models.CharField(max_length=50)

    nombre_proveedor = models.CharField(max_length=150)
    fecha_entrega = models.DateField()

    cc_encargado = models.CharField(max_length=20)
    nombre_encargado = models.CharField(max_length=150)


    tipo_vehiculo = models.CharField(max_length=100)
    placa_vehiculo = models.CharField(max_length=20)


    telefono_proveedor = models.CharField(max_length=20)
    correo_proveedor = models.EmailField()

    estado = models.CharField(
        max_length=10,
        choices=ESTADO_CHOICES
    )

    def __str__(self):
        return self.nombre_proveedor
