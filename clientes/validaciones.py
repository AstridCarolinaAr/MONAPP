from datetime import date
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import re
from .models import Cliente


def validar_datos_cliente(data, cliente_id=None):
    errores = {}

    tipo_documento = data.get('tipo_documento', '').strip()
    numero_documento = data.get('numero_documento', '').strip()
    nombre = data.get('nombre', '').strip()
    apellido = data.get('apellido', '').strip()
    fecha_nacimiento_str = data.get('fecha_nacimiento', '').strip()
    telefono = data.get('telefono', '').strip()
    correo = data.get('correo', '').strip()

    # ===============================
    # VALIDACIONES
    # ===============================

    if not tipo_documento:
        errores['tipo_documento'] = 'El tipo de documento es obligatorio.'

    if not numero_documento:
        errores['numero_documento'] = 'El número de documento es obligatorio.'
    elif not numero_documento.isdigit():
        errores['numero_documento'] = 'Solo se permiten números.'
    elif not (6 <= len(numero_documento) <= 12):
        errores['numero_documento'] = 'Debe tener entre 6 y 12 dígitos.'
    else:
        qs = Cliente.objects.filter(numero_documento=numero_documento)
        if cliente_id:
            qs = qs.exclude(id=cliente_id)
        if qs.exists():
            errores['numero_documento'] = 'Ya existe otro cliente con este documento.'

    if not nombre:
        errores['nombre'] = 'El nombre es obligatorio.'
    elif not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', nombre):
        errores['nombre'] = 'El nombre solo puede contener letras.'

    if not apellido:
        errores['apellido'] = 'El apellido es obligatorio.'
    elif not re.match(r'^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$', apellido):
        errores['apellido'] = 'El apellido solo puede contener letras.'

    if not fecha_nacimiento_str:
        errores['fecha_nacimiento'] = 'La fecha de nacimiento es obligatoria.'
    else:
        try:
            fecha = date.fromisoformat(fecha_nacimiento_str)
            if fecha > date.today():
                errores['fecha_nacimiento'] = 'La fecha no puede ser futura.'
        except ValueError:
            errores['fecha_nacimiento'] = 'Fecha inválida.'

    if telefono:
        if not telefono.isdigit():
            errores['telefono'] = 'El teléfono solo puede contener números.'
        elif len(telefono) != 10:
            errores['telefono'] = 'Debe tener exactamente 10 dígitos.'

    if correo:
        try:
            validate_email(correo)
        except ValidationError:
            errores['correo'] = 'Correo electrónico inválido.'

    return errores
