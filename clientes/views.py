from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.contrib.auth.decorators import login_required
from .models import Cliente
from django.db.models import Q
from datetime import date
from django.core.validators import validate_email
from django.core.exceptions import ValidationError
import re
from django.http import JsonResponse
from core.funciones import bloquear_eliminar
from .validaciones import validar_datos_cliente


def crear_cliente(request):
    if request.method != 'POST':
        return redirect('clientes:lista')

    datos = request.POST
    errores = validar_datos_cliente(datos)
    
    # Si es una petición AJAX, devolver JSON
    es_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    if errores:
        if es_ajax:
            return JsonResponse({
                'success': False,
                'errores': errores
            })
        messages.error(request, ' No se pudo registrar el cliente.')
        return render(request, 'clientes/lista_clientes.html', {
            'clientes': Cliente.objects.all(),
            'abrir_modal_cliente': True,
            'errores': errores,
            'datos': datos,
        })

    cliente = Cliente.objects.create(
        tipo_documento=datos['tipo_documento'],
        numero_documento=datos['numero_documento'],
        nombre=datos['nombre'],
        apellido=datos['apellido'],
        fecha_nacimiento=datos['fecha_nacimiento'],
        telefono=datos.get('telefono', ''),
        correo=datos.get('correo', ''),
        estado='activo'
    )
    
    if es_ajax:
        return JsonResponse({
            'success': True,
            'cliente': {
                'id': cliente.id,
                'nombre': cliente.nombre,
                'apellido': cliente.apellido,
                'numero_documento': cliente.numero_documento
            }
        })

    messages.success(request, 'Cliente registrado correctamente.')
    return redirect('clientes:lista')

def editar_cliente(request, cliente_id):
    cliente = get_object_or_404(Cliente, id=cliente_id)

    if request.method == 'POST':
        datos = request.POST
        errores = validar_datos_cliente(datos, cliente_id=cliente.id)

        if errores:
            messages.error(request, ' No se pudieron guardar los cambios.')
            return render(request, 'clientes/editar_cliente.html', {
                'cliente': cliente,
                'errores': errores,
            })

        cliente.tipo_documento = datos['tipo_documento']
        cliente.numero_documento = datos['numero_documento']
        cliente.nombre = datos['nombre']
        cliente.apellido = datos['apellido']
        cliente.fecha_nacimiento = datos['fecha_nacimiento']
        cliente.telefono = datos.get('telefono', '')
        cliente.correo = datos.get('correo', '')
        cliente.estado = datos['estado']

        cliente.save()

        messages.success(request, 'Cliente actualizado correctamente.')
        return redirect('clientes:lista')

    return render(request, 'clientes/editar_cliente.html', {
        'cliente': cliente
    })
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
    
def validar_documento(request):
    numero = request.GET.get('numero', '').strip()
    cliente_id = request.GET.get('cliente_id')

    if not numero.isdigit():
        return JsonResponse({'valido': False, 'mensaje': 'Solo números'})

    if not (6 <= len(numero) <= 12):
        return JsonResponse({'valido': False, 'mensaje': 'Debe tener entre 6 y 12 dígitos'})
    
    qs = Cliente.objects.filter(numero_documento=numero)

    if cliente_id:
        qs = qs.exclude(id=cliente_id)

    if qs.exists():
        return JsonResponse({
            'valido': False,
            'mensaje': 'Ya existe otro cliente con este documento.'
        })

    return JsonResponse({'valido': True})

    if Cliente.objects.filter(numero_documento=numero).exists():
        return JsonResponse({'valido': False, 'mensaje': 'Documento ya registrado'})

    return JsonResponse({'valido': True})





@bloquear_eliminar("No tienes permiso para eliminar clientes.")
def eliminar_cliente(request, cliente_id):
    cliente = get_object_or_404(Cliente, id=cliente_id)

    if request.method == 'POST':
        cliente.delete()


        messages.success(request, "Cliente eliminado correctamente.")

    return redirect('clientes:lista')
