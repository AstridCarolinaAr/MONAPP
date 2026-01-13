from django.shortcuts import redirect, render
from django.contrib.auth.decorators import login_required
from django.contrib import messages
from django.contrib.auth.models import User
from datetime import datetime


def index(request):
    return render(request, 'core/index.html')


@login_required
def dashboard_view(request):
    """
    Vista principal del panel de administración
    Solo Administrador y Auxiliar
    """

    # 🔐 CONTROL DE ACCESO POR GRUPOS
    grupos = list(request.user.groups.values_list('name', flat=True))

    if 'Administrador' not in grupos and 'Auxiliar' not in grupos:
        messages.error(request, 'No tienes acceso al panel.')
        return redirect('usuarios:login')

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

    context = {
        'titulo': 'Panel de Administración',
        'total_usuarios': total_usuarios,
        'usuarios_activos': usuarios_activos,
        'usuarios_staff': usuarios_staff,
        'nuevos_usuarios_mes': nuevos_usuarios_mes,
        'ultimos_usuarios': ultimos_usuarios,
    }

    return render(request, 'core/dashboard.html', context)
