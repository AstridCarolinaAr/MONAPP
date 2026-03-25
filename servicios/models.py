from django.db import models
from django.core.validators import MinValueValidator
from django.core.exceptions import ValidationError
import uuid


class Servicio(models.Model):
    id_servicio = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    nombre = models.CharField(max_length=200, verbose_name="Nombre del Servicio")
    precio = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        validators=[MinValueValidator(0)],
        verbose_name="Precio",
    )
    descripcion = models.TextField(verbose_name="Descripcion")
    imagen = models.ImageField(
        upload_to="servicios/",
        null=True,
        blank=True,
        verbose_name="Imagen del Servicio",
    )
    video = models.FileField(
        upload_to="servicios/videos/",
        null=True,
        blank=True,
        verbose_name="Video del Servicio",
    )
    activo = models.BooleanField(default=True, verbose_name="Activo")
    fecha_creacion = models.DateTimeField(auto_now_add=True, verbose_name="Fecha de Creacion")
    fecha_modificacion = models.DateTimeField(auto_now=True, verbose_name="Ultima Modificacion")

    class Meta:
        ordering = ["-fecha_creacion"]
        verbose_name = "Servicio"
        verbose_name_plural = "Servicios"

    @staticmethod
    def _solo_letras_numeros_y_espacios(valor):
        valor = (valor or "").strip()
        return bool(valor) and all(ch.isalnum() or ch.isspace() for ch in valor)

    @staticmethod
    def _sin_signos_peligrosos(valor):
        valor = (valor or "").strip()
        return "<" not in valor and ">" not in valor

    def clean(self):
        errores = {}

        if self.nombre:
            self.nombre = self.nombre.strip().title()
            if not self._sin_signos_peligrosos(self.nombre):
                errores["nombre"] = "El nombre no puede contener signos especiales."
            elif not self._solo_letras_numeros_y_espacios(self.nombre):
                errores["nombre"] = "El nombre solo puede contener letras, numeros y espacios."

        if self.descripcion:
            self.descripcion = self.descripcion.strip()
            if not self._sin_signos_peligrosos(self.descripcion):
                errores["descripcion"] = "La descripcion no puede contener signos HTML."
            elif not self._solo_letras_numeros_y_espacios(self.descripcion):
                errores["descripcion"] = "La descripcion solo puede contener letras, numeros y espacios."

        if errores:
            raise ValidationError(errores)

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.nombre} - ${self.precio}"
