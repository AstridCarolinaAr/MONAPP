from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from .models import Cliente
from django.db.models import Q
from datetime import date
from django.http import JsonResponse
from .validaciones import validar_datos_cliente
from django.urls import reverse


def crear_cliente(request):
    if request.method != 'POST':
        return redirect('clientes:lista')

    datos = request.POST
    errores = validar_datos_cliente(datos)

    if errores:
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

    messages.success(request, 'Cliente registrado correctamente.')
    return redirect(f"{reverse('clientes:lista')}?nuevo={cliente.id}")


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
    nuevo_id = request.GET.get("nuevo")
    cliente_creado = None

    if nuevo_id:
        cliente_creado = Cliente.objects.filter(id=nuevo_id).first()

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
        'mostrar_modal_gestion': bool(cliente_creado),
        'cliente_creado_id': cliente_creado.id if cliente_creado else None,
        'cliente_creado_nombre': f"{cliente_creado.nombre} {cliente_creado.apellido}" if cliente_creado else "",
    })
    
def validar_documento(request):
    numero = (request.GET.get('numero') or '').strip()
    cliente_id = request.GET.get('cliente_id')

    #  validar numero
    if not numero.isdigit():
        return JsonResponse({'valido': False, 'mensaje': 'Solo números'})

    if not (6 <= len(numero) <= 12):
        return JsonResponse({'valido': False, 'mensaje': 'Debe tener entre 6 y 12 dígitos'})

    # normalizar cliente_id
    if not cliente_id or cliente_id in ('undefined', 'null', ''):
        cliente_id = None
    else:
        try:
            cliente_id = int(cliente_id)
        except ValueError:
            cliente_id = None

    qs = Cliente.objects.filter(numero_documento=numero)

    # si es edición, excluye el mismo cliente
    if cliente_id is not None:
        qs = qs.exclude(id=cliente_id)

    if qs.exists():
        return JsonResponse({
            'valido': False,
            'mensaje': 'Ya existe otro cliente con este documento.'
        })

    return JsonResponse({'valido': True})





def eliminar_cliente(request, cliente_id):
    cliente = get_object_or_404(Cliente, id=cliente_id)

    if request.method == 'POST':
        cliente.delete()


        messages.success(request, "Cliente eliminado correctamente.")

    return redirect('clientes:lista')