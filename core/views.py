from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from django.http import JsonResponse
from datetime import datetime,date
from usuarios.forms import LoginForm
from django.contrib.auth import login
from clientes.models import Cliente
from servicios.models import Servicio
from django.shortcuts import get_object_or_404
from django.views.decorators.http import require_POST
from promociones.models import Promocion
from productos_web.models import ProductoWeb
from servicios_web.models import ServicioWeb




def index(request):
    # Obtener servicios activos
    servicios = ServicioWeb.objects.filter(activo=True).order_by('nombre')
    promociones = Promocion.objects.filter(activa=True)
    productos_web = ProductoWeb.objects.filter(visible=True)

    return render(request, 'core/index.html', {
        'servicios': servicios,
        'promociones': promociones,
        'productos_web': productos_web,
    })
    
    

@login_required
def dashboard_view(request):
    """
    Vista principal del panel de administración
    Todos los usuarios autenticados pueden acceder
    """

    grupos = list(request.user.groups.values_list('name', flat=True))

    # 📊 Estadísticas
    total_usuarios = User.objects.count()
    usuarios_activos = User.objects.filter(is_active=True).count()
    usuarios_staff = User.objects.filter(is_staff=True).count()

    mes_actual = datetime.now().month
    anio_actual = datetime.now().year

    nuevos_usuarios_mes = User.objects.filter(
        date_joined__month=mes_actual,
        date_joined__year=anio_actual
    ).count()

    ultimos_usuarios = User.objects.select_related(
        'perfil'
    ).order_by('-date_joined')[:5]
        #  Clientes que cumplen años
    hoy = date.today()

    clientes_cumple_hoy = Cliente.objects.filter(
        fecha_nacimiento__day=hoy.day,
        fecha_nacimiento__month=hoy.month
    )
    
    clientes_cumple_info = []
    for cliente in clientes_cumple_hoy:
        edad = hoy.year - cliente.fecha_nacimiento.year
        clientes_cumple_info.append({
            'cliente': cliente,
            'edad': edad
        })
    context = {
        'titulo': 'Panel de Administración',
        'total_usuarios': total_usuarios,
        'usuarios_activos': usuarios_activos,
        'usuarios_staff': usuarios_staff,
        'nuevos_usuarios_mes': nuevos_usuarios_mes,
        'ultimos_usuarios': ultimos_usuarios,
        'clientes_cumple_hoy': clientes_cumple_info
    }

    return render(request, 'core/dashboard.html', context)


@login_required
def gestion_datos_view(request):
    """
    Vista para gestión de datos
    """
    if request.method == 'POST':
        # Procesar el formulario enviado desde el modal
        try:
            nombre = request.POST.get('nombre')
            categoria = request.POST.get('categoria')
            descripcion = request.POST.get('descripcion')
            fecha = request.POST.get('fecha')
            estado = request.POST.get('estado')
            
            # Aquí puedes guardar los datos en la base de datos
            # Por ejemplo:
            # DatoModel.objects.create(
            #     nombre=nombre,
            #     categoria=categoria,
            #     descripcion=descripcion,
            #     fecha=fecha,
            #     estado=estado
            # )
            
            return JsonResponse({
                'success': True,
                'message': 'Datos guardados correctamente'
            })
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': str(e)
            }, status=400)
    
    context = {
        'titulo': 'Gestión de Datos',
    }
    return render(request, 'core/gestion_datos.html', context)


def solo_admin(view_func):
    def wrapper(request, *args, **kwargs):
        if not request.user.is_staff:
            messages.error(
                request,
                "No tienes permisos para realizar esta acción."
            )
            return redirect("core:dashboard")
        return view_func(request, *args, **kwargs)
    return wrapper

