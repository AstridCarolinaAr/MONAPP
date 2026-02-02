from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages
from django.core.management import call_command
from django.views.decorators.http import require_http_methods
from .models import Producto, Promocion, Servicio
from .forms import ProductoForm, PromocionForm, ServicioForm, RestoreDBForm
import os

# --- CHEQUEOS DE PERMISOS ---
def es_administrador(user):
    """Verifica si el usuario es administrador"""
    return user.is_authenticated and (user.is_superuser or user.groups.filter(name='Administradores').exists())

def es_admin_o_auxiliar(user):
    """Verifica si el usuario es administrador o auxiliar"""
    return user.is_authenticated and (user.is_superuser or user.groups.filter(name__in=['Administradores', 'Auxiliares']).exists())

# --- GESTIÓN DE PRODUCTOS ---

@user_passes_test(es_administrador)
def listar_productos(request):
    """Muestra el listado de todos los productos"""
    productos = Producto.objects.all()
    context = {
        'productos': productos,
        'total_productos': productos.count(),
        'titulo_pagina': 'Gestión de Productos'
    }
    return render(request, 'gestion/listar_productos.html', context)

@user_passes_test(es_administrador)
def crear_producto(request):
    """Crea un nuevo producto"""
    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES)
        if form.is_valid():
            producto = form.save()
            messages.success(
                request,
                f'✅ Producto "{producto.nombre}" agregado correctamente.'
            )
            return redirect('listar_productos')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"❌ {field}: {error}")
    else:
        form = ProductoForm()
    return render(request, 'gestion/form.html', {
        'form': form,
        'titulo': 'Crear Nuevo Producto',
        'icono': '📦'
    })

@user_passes_test(es_administrador)
def editar_producto(request, id):
    """Edita un producto existente"""
    producto = get_object_or_404(Producto, id=id)
    if request.method == 'POST':
        form = ProductoForm(request.POST, request.FILES, instance=producto)
        if form.is_valid():
            form.save()
            messages.success(
                request,
                f'✅ Producto "{producto.nombre}" actualizado correctamente.'
            )
            return redirect('listar_productos')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"❌ {field}: {error}")
    else:
        form = ProductoForm(instance=producto)
    return render(request, 'gestion/form.html', {
        'form': form,
        'titulo': f'Editar Producto: {producto.nombre}',
        'icono': '✏️'
    })

@user_passes_test(es_administrador)
@require_http_methods(["POST"])
def eliminar_producto(request, id):
    """Elimina un producto"""
    producto = get_object_or_404(Producto, id=id)
    nombre_producto = producto.nombre
    producto.delete()
    messages.warning(request, f'🗑️ Producto "{nombre_producto}" eliminado permanentemente.')
    return redirect('listar_productos')

# --- GESTIÓN DE PROMOCIONES ---

@user_passes_test(es_administrador)
def listar_promociones(request):
    """Muestra el listado de todas las promociones"""
    promociones = Promocion.objects.all()
    context = {
        'promociones': promociones,
        'total_promociones': promociones.count(),
        'titulo_pagina': 'Gestión de Promociones'
    }
    return render(request, 'gestion/listar_promocion.html', context)

@user_passes_test(es_administrador)
def crear_promocion(request):
    """Crea una nueva promoción"""
    if request.method == 'POST':
        form = PromocionForm(request.POST)
        if form.is_valid():
            promocion = form.save()
            messages.success(
                request,
                f'✅ Promoción "{promocion.titulo}" creada exitosamente.'
            )
            return redirect('listar_promociones')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"❌ {field}: {error}")
    else:
        form = PromocionForm()
    return render(request, 'gestion/form.html', {
        'form': form,
        'titulo': 'Crear Nueva Promoción',
        'icono': '🎉'
    })

@user_passes_test(es_administrador)
def editar_promocion(request, id):
    """Edita una promoción existente"""
    promocion = get_object_or_404(Promocion, id=id)
    if request.method == 'POST':
        form = PromocionForm(request.POST, instance=promocion)
        if form.is_valid():
            form.save()
            messages.success(
                request,
                f'✅ Promoción "{promocion.titulo}" actualizada correctamente.'
            )
            return redirect('listar_promociones')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"❌ {field}: {error}")
    else:
        form = PromocionForm(instance=promocion)
    return render(request, 'gestion/form.html', {
        'form': form,
        'titulo': f'Editar Promoción: {promocion.titulo}',
        'icono': '✏️'
    })

@user_passes_test(es_administrador)
@require_http_methods(["POST"])
def eliminar_promocion(request, id):
    """Elimina una promoción"""
    promocion = get_object_or_404(Promocion, id=id)
    titulo = promocion.titulo
    promocion.delete()
    messages.warning(request, f'🗑️ Promoción "{titulo}" eliminada permanentemente.')
    return redirect('listar_promociones')

# --- GESTIÓN DE SERVICIOS ---

@user_passes_test(es_administrador)
def listar_servicios(request):
    """Muestra el listado de todos los servicios"""
    servicios = Servicio.objects.all()
    context = {
        'servicios': servicios,
        'total_servicios': servicios.count(),
        'titulo_pagina': 'Catálogo de Servicios'
    }
    return render(request, 'gestion/listar_servicios.html', context)

@user_passes_test(es_administrador)
def crear_servicio(request):
    """Crea un nuevo servicio"""
    if request.method == 'POST':
        form = ServicioForm(request.POST)
        if form.is_valid():
            servicio = form.save()
            messages.success(
                request,
                f'✅ Servicio "{servicio.nombre}" agregado correctamente.'
            )
            return redirect('listar_servicios')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"❌ {field}: {error}")
    else:
        form = ServicioForm()
    return render(request, 'gestion/form.html', {
        'form': form,
        'titulo': 'Crear Nuevo Servicio',
        'icono': '🔧'
    })

@user_passes_test(es_administrador)
def editar_servicio(request, id):
    """Edita un servicio existente"""
    servicio = get_object_or_404(Servicio, id=id)
    if request.method == 'POST':
        form = ServicioForm(request.POST, instance=servicio)
        if form.is_valid():
            form.save()
            messages.success(
                request,
                f'✅ Servicio "{servicio.nombre}" actualizado correctamente.'
            )
            return redirect('listar_servicios')
        else:
            for field, errors in form.errors.items():
                for error in errors:
                    messages.error(request, f"❌ {field}: {error}")
    else:
        form = ServicioForm(instance=servicio)
    return render(request, 'gestion/form.html', {
        'form': form,
        'titulo': f'Editar Servicio: {servicio.nombre}',
        'icono': '✏️'
    })

@user_passes_test(es_administrador)
@require_http_methods(["POST"])
def eliminar_servicio(request, id):
    """Elimina un servicio"""
    servicio = get_object_or_404(Servicio, id=id)
    nombre_servicio = servicio.nombre
    servicio.delete()
    messages.warning(request, f'🗑️ Servicio "{nombre_servicio}" eliminado permanentemente.')
    return redirect('listar_servicios')

# --- RESTAURAR BASE DE DATOS ---

@user_passes_test(es_admin_o_auxiliar)
def restaurar_bd(request):
    """Restaura la base de datos desde un archivo backup"""
    if request.method == 'POST':
        form = RestoreDBForm(request.POST, request.FILES)
        if form.is_valid():
            archivo = request.FILES['archivo_backup']
            temp_path = 'temp_backup.json'
            
            try:
                # Guardar temporalmente el archivo
                with open(temp_path, 'wb+') as destination:
                    for chunk in archivo.chunks():
                        destination.write(chunk)
                
                # Ejecutar loaddata de Django
                call_command('loaddata', temp_path)
                messages.success(
                    request,
                    '✅ Base de datos restaurada exitosamente. Todos los datos han sido actualizados.'
                )
            except Exception as e:
                messages.error(
                    request,
                    f'❌ Error al restaurar: {str(e)}'
                )
            finally:
                if os.path.exists(temp_path):
                    os.remove(temp_path)
            
            return redirect('restaurar_bd')
    else:
        form = RestoreDBForm()
    
    return render(request, 'gestion/restaurar_base.html', {'form': form})