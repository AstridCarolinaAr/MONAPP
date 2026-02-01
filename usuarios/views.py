from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.db.models import Q
from .forms import LoginForm, RegistroForm, EditarUsuarioForm, EditarPerfilForm
from .models import PerfilUsuario
from core.funciones import admin_o_aux_required

# ==================== VISTAS DE AUTENTICACIÓN ====================

@csrf_protect
@never_cache
def login_view(request):

    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)

        if form.is_valid():
            user = form.get_user()
            login(request, user)

            return redirect('core:dashboard')

        messages.error(request, 'Usuario o contraseña incorrectos.')

        return render(request, 'core/index.html', {
            'show_login_modal': True
        })

    return redirect('core:index')



@login_required
def logout_view(request):
    logout(request)
    messages.info(request, 'Has cerrado sesión exitosamente.')
    return redirect('core:index')


# ==================== PANEL DE USUARIOS (ADMIN / AUX) ====================

@login_required
@admin_o_aux_required()
def lista_usuarios_view(request):
    grupos = list(request.user.groups.values_list('name', flat=True))

    busqueda = request.GET.get('buscar', '')

    usuarios = User.objects.select_related('perfil').all()

    if busqueda:
        usuarios = usuarios.filter(
            Q(username__icontains=busqueda) |
            Q(first_name__icontains=busqueda) |
            Q(last_name__icontains=busqueda) |
            Q(email__icontains=busqueda) |
            Q(perfil__documento__icontains=busqueda)
        )

    usuarios = usuarios.order_by('-date_joined')

    return render(
        request,
        'usuarios/lista_usuarios.html',
        {
            'titulo': 'Gestión de Usuarios',
            'usuarios': usuarios,
            'busqueda': busqueda,
        }
    )


@login_required
@admin_o_aux_required()
def crear_usuario_view(request):
    grupos = list(request.user.groups.values_list('name', flat=True))

    if request.method == 'POST':
        form = RegistroForm(request.POST)
        if form.is_valid():
            user = form.save()
            messages.success(
                request,
                f'Usuario {user.get_full_name()} creado exitosamente.'
            )
            return redirect('usuarios:lista_usuarios')
    else:
        form = RegistroForm()

    return render(
        request,
        'usuarios/panel_admin/crear_usuario.html',
        {
            'titulo': 'Crear Usuario',
            'form': form,
        }
    )


@login_required
@admin_o_aux_required()
def editar_usuario_view(request, user_id):
    grupos = list(request.user.groups.values_list('name', flat=True))


    usuario = get_object_or_404(User, id=user_id)

    if request.method == 'POST':
        form_usuario = EditarUsuarioForm(request.POST, instance=usuario)
        form_perfil = EditarPerfilForm(
            request.POST,
            request.FILES,
            instance=usuario.perfil
        )

        if form_usuario.is_valid() and form_perfil.is_valid():
            form_usuario.save()
            form_perfil.save()
            messages.success(
                request,
                f'Usuario {usuario.get_full_name()} actualizado.'
            )
            return redirect('usuarios:lista_usuarios')

    else:
        form_usuario = EditarUsuarioForm(instance=usuario)
        form_perfil = EditarPerfilForm(instance=usuario.perfil)

    return render(
        request,
        'usuarios/panel_admin/editar_usuario.html',
        {
            'titulo': f'Editar Usuario: {usuario.get_full_name()}',
            'form_usuario': form_usuario,
            'form_perfil': form_perfil,
            'usuario': usuario,
        }
    )


@login_required
@admin_o_aux_required()
def eliminar_usuario_view(request, user_id):
    grupos = list(request.user.groups.values_list('name', flat=True))


    usuario = get_object_or_404(User, id=user_id)

    if usuario == request.user:
        messages.error(request, 'No puedes eliminarte a ti mismo.')
        return redirect('usuarios:lista_usuarios_admin')

    if request.method == 'POST':
        usuario.is_active = False
        usuario.save()
        messages.success(
            request,
            f'Usuario {usuario.get_full_name()} desactivado.'
        )
        return redirect('usuarios:lista_usuarios')

    return render(
        request,
        'usuarios/panel_admin/eliminar_usuario.html',
        {
            'titulo': 'Eliminar Usuario',
            'usuario': usuario,
        }
    )


@login_required
@admin_o_aux_required()
def perfil_view(request):
    usuario = request.user

    if request.method == 'POST':
        form_usuario = EditarUsuarioForm(request.POST, instance=usuario)
        form_perfil = EditarPerfilForm(
            request.POST,
            request.FILES,
            instance=usuario.perfil
        )

        if form_usuario.is_valid() and form_perfil.is_valid():
            form_usuario.save()
            form_perfil.save()
            messages.success(request, 'Perfil actualizado.')
            return redirect('usuarios:perfil')

    else:
        form_usuario = EditarUsuarioForm(instance=usuario)
        form_perfil = EditarPerfilForm(instance=usuario.perfil)

    return render(
        request,
        'usuarios/perfil.html',
        {
            'titulo': 'Mi Perfil',
            'form_usuario': form_usuario,
            'form_perfil': form_perfil,
        }
    )
