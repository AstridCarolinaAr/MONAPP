from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from datetime import datetime,date
from core.funciones import admin_o_aux_required

from usuarios.forms import LoginForm
from django.contrib.auth import login

from clientes.models import Cliente
from servicios.models import Servicio



def index(request):
    show_login_modal = False

    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)

        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('core:dashboard')

        messages.error(request, 'Usuario o contraseña incorrectos.')
        show_login_modal = True

    # Obtener servicios activos
    servicios = Servicio.objects.filter(activo=True)

    return render(request, 'core/index.html', {
        'show_login_modal': show_login_modal,
        'servicios': servicios
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
