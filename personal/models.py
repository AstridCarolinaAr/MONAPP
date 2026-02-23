from django.db import models

class Personal(models.Model):
    ROLES = [
        ("Administrador", "Administrador"),
        ("Auxiliar", "Auxiliar"),
        ("Colaborador", "Colaborador"),
    ]

    tipo_documento = models.CharField(max_length=30, blank=True, null=True)
    numero_documento = models.CharField(max_length=20, unique=True)

    nombres = models.CharField(max_length=150)
    apellidos = models.CharField(max_length=150)

    correo = models.EmailField(blank=True, null=True)
    telefono = models.CharField(max_length=15, blank=True, null=True)

    rol = rol = models.CharField(max_length=20, choices=ROLES, default="Colaborador")

    activo = models.BooleanField(default=True)

    fecha_creacion = models.DateTimeField(auto_now_add=True)
    fecha_actualizacion = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.nombres} {self.apellidos} - {self.numero_documento}"