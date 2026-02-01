from django.db import models
from django.utils.timezone import now


class Cliente(models.Model):

    TIPO_DOCUMENTO_CHOICES = [
        ('CC', 'Cédula de ciudadanía'),
        ('TI', 'Tarjeta de identidad'),
        ('CE', 'Cédula de extranjería'),
        ('PP', 'Pasaporte'),
    ]

    ESTADO_CHOICES = [
        ('activo', 'Activo'),
        ('inactivo', 'Inactivo'),
    ]

    codigo_cliente = models.CharField(
        max_length=10,
        unique=True,
        editable=False
    )
    tipo_documento = models.CharField(
        max_length=2,
        choices=TIPO_DOCUMENTO_CHOICES
    )
    numero_documento = models.CharField(
        max_length=20,
        unique=True
    )
    nombre = models.CharField(max_length=100)
    apellido = models.CharField(max_length=100)
    fecha_nacimiento = models.DateField()
    telefono = models.CharField(
        max_length=20,
        blank=True,
        null=True
    )
    correo = models.EmailField(
        blank=True,
        null=True
    )
    estado = models.CharField(
        max_length=10,
        choices=ESTADO_CHOICES,
        default='activo'
    )
    fecha_registro = models.DateTimeField(default=now)

    def save(self, *args, **kwargs):
        if not self.codigo_cliente:
            ultimo = Cliente.objects.all().order_by('-id').first()
            if ultimo:
                numero = int(ultimo.codigo_cliente.replace('CL', '')) + 1
            else:
                numero = 1
            self.codigo_cliente = f"CL{numero:04d}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.codigo_cliente} - {self.nombre} {self.apellido}"
