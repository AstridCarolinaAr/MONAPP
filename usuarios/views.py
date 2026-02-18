from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User, Group
from django.contrib import messages
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.db.models import Q
from django.http import JsonResponse
from django.template.loader import render_to_string
from .forms import LoginForm, RegistroForm, EditarUsuarioForm, EditarPerfilForm
from .models import PerfilUsuario
from core.funciones import admin_o_aux_required, solo_admin_required, no_colaborador_required

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
def lista_usuarios_view(request):
    grupos = list(request.user.groups.values_list('name', flat=True))
    
    # Verificar si el usuario actual es Administrador (puede eliminar)
    es_administrador = request.user.is_superuser or 'Administrador' in grupos
    
    # Verificar si puede crear/editar (no colaborador)
    puede_modificar = request.user.is_superuser or 'Administrador' in grupos or 'Auxiliar' in grupos

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
            'es_administrador': es_administrador,
            'puede_modificar': puede_modificar,
        }
    )


@login_required
@no_colaborador_required()
def crear_usuario_view(request):
    grupos = list(request.user.groups.values_list('name', flat=True))
    
    # Verificar si es una petición AJAX para cargar el modal
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    if request.method == 'POST':
        form = RegistroForm(request.POST, request.FILES)
        if form.is_valid():
            user = form.save()
            
            if is_ajax:
                # Respuesta JSON para AJAX
                return JsonResponse({
                    'success': True,
                    'message': f'Usuario {user.get_full_name()} creado exitosamente.'
                })
            else:
                messages.success(
                    request,
                    f'Usuario {user.get_full_name()} creado exitosamente.'
                )
                return redirect('usuarios:lista_usuarios')
        else:
            if is_ajax:
                # Renderizar el formulario con errores para el modal
                html_form = render_to_string('usuarios/_formulario_usuario_modal.html', 
                                            {'form': form}, 
                                            request=request)
                return JsonResponse({
                    'success': False,
                    'html_form': html_form
                })
    else:
        form = RegistroForm()
    
    # Si es AJAX y es GET, retornar el HTML del formulario para el modal
    if is_ajax:
        html_form = render_to_string('usuarios/_formulario_usuario_modal.html', 
                                     {'form': form}, 
                                     request=request)
        return JsonResponse({'html_form': html_form})

    # Si no es AJAX, mostrar la página completa (comportamiento anterior)
    return render(
        request,
        'crear_usuario.html',
        {
            'titulo': 'Crear Usuario',
            'form': form,
        }
    )


@login_required
@no_colaborador_required()
def editar_usuario_view(request, user_id):
    grupos = list(request.user.groups.values_list('name', flat=True))

    usuario = get_object_or_404(User, id=user_id)
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    if request.method == 'POST':
        form_usuario = EditarUsuarioForm(request.POST, instance=usuario)
        form_perfil = EditarPerfilForm(
            request.POST,
            request.FILES,
            instance=usuario.perfil
        )

        if form_usuario.is_valid() and form_perfil.is_valid():
            user_updated = form_usuario.save(commit=False)
            
            # Actualizar grupos según el rol
            rol = form_usuario.cleaned_data.get('rol')
            if rol:
                user_updated.groups.clear()
                grupo, created = Group.objects.get_or_create(name=rol)
                user_updated.groups.add(grupo)
                
                # Configurar is_staff según rol
                if rol in ['Administrador', 'Auxiliar']:
                    user_updated.is_staff = True
                else:
                    user_updated.is_staff = False
            
            user_updated.save()
            form_perfil.save()
            
            if is_ajax:
                return JsonResponse({
                    'success': True,
                    'message': f'Usuario {usuario.get_full_name()} actualizado exitosamente.'
                })
            else:
                messages.success(
                    request,
                    f'Usuario {usuario.get_full_name()} actualizado.'
                )
                return redirect('usuarios:lista_usuarios')
        else:
            if is_ajax:
                html_form = render_to_string('usuarios/_formulario_editar_usuario_modal.html', 
                                            {
                                                'form_usuario': form_usuario,
                                                'form_perfil': form_perfil,
                                                'usuario': usuario
                                            }, 
                                            request=request)
                return JsonResponse({
                    'success': False,
                    'html_form': html_form
                })

    else:
        form_usuario = EditarUsuarioForm(instance=usuario)
        form_perfil = EditarPerfilForm(instance=usuario.perfil)
    
    # Si es AJAX y es GET, retornar el HTML del formulario para el modal
    if is_ajax:
        html_form = render_to_string('usuarios/_formulario_editar_usuario_modal.html', 
                                     {
                                         'form_usuario': form_usuario,
                                         'form_perfil': form_perfil,
                                         'usuario': usuario
                                     }, 
                                     request=request)
        return JsonResponse({'html_form': html_form})

    return render(
        request,
        'usuarios/editar_usuario.html',
        {
            'titulo': f'Editar Usuario: {usuario.get_full_name()}',
            'form_usuario': form_usuario,
            'form_perfil': form_perfil,
            'usuario': usuario,
        }
    )


@login_required
@solo_admin_required()
def eliminar_usuario_view(request, user_id):
    grupos = list(request.user.groups.values_list('name', flat=True))

    usuario = get_object_or_404(User, id=user_id)
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    if usuario == request.user:
        if is_ajax:
            return JsonResponse({
                'success': False,
                'message': 'No puedes eliminarte a ti mismo.'
            })
        messages.error(request, 'No puedes eliminarte a ti mismo.')
        return redirect('usuarios:lista_usuarios')

    if request.method == 'POST':
        nombre_completo = usuario.get_full_name()
        usuario.delete()
        
        if is_ajax:
            return JsonResponse({
                'success': True,
                'message': f'Usuario {nombre_completo} eliminado exitosamente.'
            })
        else:
            messages.success(
                request,
                f'Usuario {nombre_completo} eliminado.'
            )
            return redirect('usuarios:lista_usuarios')

    # Si es AJAX y es GET, retornar el HTML del modal de confirmación
    if is_ajax:
        try:
            html_content = render_to_string('usuarios/_confirmar_eliminar_modal.html', 
                                           {'usuario': usuario}, 
                                           request=request)
            return JsonResponse({'html_content': html_content})
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Error al cargar el contenido: {str(e)}'
            }, status=500)

    # Si no es AJAX, mostrar la página completa (comportamiento anterior)
    return render(
        request,
        'usuarios/eliminar_usuario.html',
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


# ==================== VALIDACIONES AJAX EN TIEMPO REAL ====================

@login_required
@no_colaborador_required()
def validar_documento_ajax(request):
    """
    Endpoint AJAX para validar documento en tiempo real
    """
    if request.method == 'GET':
        documento = request.GET.get('documento', '').strip()
        
        if not documento:
            return JsonResponse({
                'valido': False,
                'mensaje': 'El documento es requerido'
            })
        
        # Validar que solo contenga números
        if not documento.isdigit():
            return JsonResponse({
                'valido': False,
                'mensaje': 'El documento solo puede contener números'
            })
        
        # Validar longitud mínima
        if len(documento) < 6:
            return JsonResponse({
                'valido': False,
                'mensaje': 'El documento debe tener al menos 6 dígitos'
            })
        
        # Verificar si ya existe
        if PerfilUsuario.objects.filter(documento=documento).exists():
            return JsonResponse({
                'valido': False,
                'mensaje': 'Este documento ya está registrado'
            })
        
        return JsonResponse({
            'valido': True,
            'mensaje': 'Documento válido'
        })
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)


@login_required
@no_colaborador_required()
def validar_email_ajax(request):
    """
    Endpoint AJAX para validar email en tiempo real
    """
    if request.method == 'GET':
        email = request.GET.get('email', '').strip()
        
        if not email:
            return JsonResponse({
                'valido': False,
                'mensaje': 'El correo electrónico es requerido'
            })
        
        # Validar formato de email básico
        import re
        email_regex = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
        if not re.match(email_regex, email):
            return JsonResponse({
                'valido': False,
                'mensaje': 'Ingrese un correo electrónico válido'
            })
        
        # Verificar si ya existe
        if User.objects.filter(email=email).exists():
            return JsonResponse({
                'valido': False,
                'mensaje': 'Este correo electrónico ya está registrado'
            })
        
        return JsonResponse({
            'valido': True,
            'mensaje': 'Correo electrónico válido'
        })
    
    return JsonResponse({'error': 'Método no permitido'}, status=405)
