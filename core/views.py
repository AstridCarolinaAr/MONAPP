from django.shortcuts import render, redirect
from django.contrib.auth.models import User
from django.contrib.auth.decorators import login_required, user_passes_test
from django.contrib import messages

# Create your views here.

def index(request):
    return render(request, 'core/index.html')

def Panel_Admin_base(request):
    return render(request, 'core/panel_admin_base.html')

def es_staff(user):
    """Función auxiliar para verificar si el usuario es staff o superuser"""
    return user.is_staff or user.is_superuser

@login_required
@user_passes_test(es_staff, login_url='core:index')
def dashboard_view(request):
    """
    Vista principal del panel de administración
    Solo accesible para usuarios staff o superuser
    """
    # Estadísticas generales
    total_usuarios = User.objects.count()
    usuarios_activos = User.objects.filter(is_active=True).count()
    usuarios_staff = User.objects.filter(is_staff=True).count()
    
    # Obtener el mes actual del request
    from datetime import datetime
    mes_actual = datetime.now().month
    anio_actual = datetime.now().year
    
    nuevos_usuarios_mes = User.objects.filter(
        date_joined__month=mes_actual,
        date_joined__year=anio_actual
    ).count()
    
    # Últimos usuarios registrados
    ultimos_usuarios = User.objects.select_related('perfil').order_by('-date_joined')[:5]
    
    context = {
        'titulo': 'Panel de Administración',
        'total_usuarios': total_usuarios,
        'usuarios_activos': usuarios_activos,
        'usuarios_staff': usuarios_staff,
        'nuevos_usuarios_mes': nuevos_usuarios_mes,
        'ultimos_usuarios': ultimos_usuarios,
    }
    return render(request, 'core/dashboard.html', context)