from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .models import Cliente
from django.db.models import Q
from datetime import date
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import re


def lista_clientes(request):
    q = request.GET.get('q')
    estado = request.GET.get('estado')
    codigo = request.GET.get('codigo')
    edad = request.GET.get('edad')
    orden = request.GET.get('orden')
    

    clientes = Cliente.objects.all()

    if q:
        clientes = clientes.filter(
            Q(nombre__icontains=q) |
            Q(apellido__icontains=q) |
            Q(numero_documento__icontains=q)
        )

    if codigo:
        clientes = clientes.filter(codigo__icontains=codigo)

    if estado in ['activo', 'inactivo']:
        clientes = clientes.filter(estado=estado)

    hoy = date.today()
    if edad == 'menor':
        fecha_limite = date(hoy.year - 18, hoy.month, hoy.day)
        clientes = clientes.filter(fecha_nacimiento__gt=fecha_limite)
    elif edad == 'mayor':
        fecha_limite = date(hoy.year - 18, hoy.month, hoy.day)
        clientes = clientes.filter(fecha_nacimiento__lte=fecha_limite)

    ordenamientos = {
        'nombre_asc': ('nombre', 'apellido'),
        'nombre_desc': ('-nombre', '-apellido'),
        'apellido_asc': ('apellido', 'nombre'),
        'apellido_desc': ('-apellido', '-nombre'),
        'fecha_asc': ('fecha_nacimiento',),
        'fecha_desc': ('-fecha_nacimiento',),
    }

    if orden in ordenamientos:
        clientes = clientes.order_by(*ordenamientos[orden])

    return render(request, 'clientes/lista_clientes.html', {
        'clientes': clientes,
        'q': q,
        'estado': estado,
        'codigo': codigo,
        'edad': edad,
        'orden': orden,
        'abrir_modal_cliente': False,
        'registro_fallido': False,
        'errores': {},
        'datos': {},
    })

def crear_cliente(request):
    if request.method != 'POST':
        return redirect('clientes:lista')

    # ===============================
    # DATOS DEL FORMULARIO
    # ===============================
    tipo_documento = request.POST.get('tipo_documento', '').strip()
    numero_documento = request.POST.get('numero_documento', '').strip()
    nombre = request.POST.get('nombre', '').strip()
    apellido = request.POST.get('apellido', '').strip()
    fecha_nacimiento_str = request.POST.get('fecha_nacimiento', '').strip()
    telefono = request.POST.get('telefono', '').strip()
    correo = request.POST.get('correo', '').strip()

    clientes = Cliente.objects.all()

    # Para mantener datos en el modal
    datos = {
        'tipo_documento': tipo_documento,
        'numero_documento': numero_documento,
        'nombre': nombre,
        'apellido': apellido,
        'fecha_nacimiento': fecha_nacimiento_str,
        'telefono': telefono,
        'correo': correo,
    }

    errores = {}

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
    elif Cliente.objects.filter(numero_documento=numero_documento).exists():
        errores['numero_documento'] = 'Ya existe un cliente con ese número de documento.'

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
            fecha_nacimiento = date.fromisoformat(fecha_nacimiento_str)
            if fecha_nacimiento > date.today():
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

    # ===============================
    # SI HAY ERRORES → NO REDIRECT
    # ===============================
    if errores:
        return render(request, 'clientes/lista_clientes.html', {
            'clientes': Cliente.objects.all(),
            'abrir_modal_cliente': True,
            'registro_fallido': True,
            'errores': errores,
            'datos': datos,
        })

    # ===============================
    # GUARDAR (SOLO SI TODO ESTÁ BIEN)
    # ===============================
    Cliente.objects.create(
        tipo_documento=tipo_documento,
        numero_documento=numero_documento,
        nombre=nombre,
        apellido=apellido,
        fecha_nacimiento=fecha_nacimiento,
        telefono=telefono,
        correo=correo,
        estado='activo'
    )

    messages.success(request, 'Cliente registrado correctamente.')
    return redirect('clientes:lista')




def editar_cliente(request, cliente_id):
    cliente = get_object_or_404(Cliente, id=cliente_id)

    if request.method == 'POST':
        cliente.tipo_documento = request.POST.get('tipo_documento')
        cliente.numero_documento = request.POST.get('numero_documento')
        cliente.nombre = request.POST.get('nombre')
        cliente.apellido = request.POST.get('apellido')
        cliente.fecha_nacimiento = request.POST.get('fecha_nacimiento')
        cliente.telefono = request.POST.get('telefono')
        cliente.correo = request.POST.get('correo')
        cliente.estado = request.POST.get('estado')

        cliente.save()
        return redirect('clientes:lista')

    return render(request, 'clientes/editar_cliente.html', {
        'cliente': cliente
    })
@login_required
def eliminar_cliente(request, cliente_id):
    cliente = get_object_or_404(Cliente, id=cliente_id)

    #  Permiso: solo admin
    if not request.user.is_staff:
        messages.error(request, 'No tienes permiso para eliminar clientes.')
        return redirect('clientes:lista')

    if request.method == 'POST':
        cliente.delete()
        messages.success(request, 'Cliente eliminado correctamente.')

    return redirect('clientes:lista')