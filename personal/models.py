from django.db import models
from django.contrib.auth.models import User

# Create your models here.
class Personal(models.Model):
    ROLES = [
        ('AUX', 'Auxiliar'),
        ('COL', 'Colaborador'),
        ('ADM', 'Administrador'),
    ]

    numero_documento = models.CharField(max_length=20, unique=True, verbose_name='Número de Documento')
    nombres = models.CharField(max_length=100, verbose_name='Nombres')
    apellidos = models.CharField(max_length=100, verbose_name='Apellidos')
    telefono = models.CharField(max_length=15, verbose_name='Teléfono')
    correo = models.EmailField(max_length=254, unique=True, verbose_name='Correo Electrónico')
    rol = models.CharField(max_length=3, choices=ROLES, verbose_name='Rol')
    usuario = models.OneToOneField(User, on_delete=models.PROTECT, null=True, blank=True, verbose_name='Usuario del Sistema')
    activo = models.BooleanField(default=True, verbose_name='Activo')
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name='Fecha de Creación')
    fecha_actualizacion = models.DateTimeField(auto_now=True, verbose_name='Fecha de Actualización')

    class Meta:
        verbose_name = 'Personal'
        verbose_name_plural = 'Personal'
        ordering = ['-fecha_creacion']

    def __str__(self):
        return f"{self.nombres} {self.apellidos} ({self.get_rol_display()})"
