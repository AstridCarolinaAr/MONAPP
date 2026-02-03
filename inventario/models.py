from django.db import models
from django.contrib.auth.models import User
from django.utils import timezone
import uuid

class Transaccion(models.Model):
    TIPO_CHOICES = [
        ('ingreso', 'Ingreso'),
        ('egreso', 'Egreso'),
    ]
    
    id_transaccion = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo = models.CharField(max_length=10, choices=TIPO_CHOICES)
    monto = models.DecimalField(max_digits=10, decimal_places=2)
    motivo = models.TextField()
    fecha_creacion = models.DateTimeField(default=timezone.now)
    usuario = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-fecha_creacion']
        verbose_name = 'Transacción'
        verbose_name_plural = 'Transacciones'
    
    def __str__(self):
        return f"{self.tipo.upper()} - ${self.monto} - {self.fecha_creacion.strftime('%d/%m/%Y %H:%M')}"
