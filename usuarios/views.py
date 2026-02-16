from django.shortcuts import render, redirect, get_object_or_404
from django.contrib.auth import login, logout
from django.contrib.auth.decorators import login_required
from django.contrib.auth.models import User
from django.contrib import messages
from django.views.decorators.cache import never_cache
from django.views.decorators.csrf import csrf_protect
from django.views.decorators.http import require_POST
from django.db.models import Q
from django.utils.crypto import get_random_string
from .forms import LoginForm, RegistroForm, EditarUsuarioForm, EditarPerfilForm
from .models import PerfilUsuario
import random
from django.utils import timezone
from django.core.mail import send_mail
from datetime import timedelta
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string

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

        return render(request, 'usuarios/login.html')

    return render(request, 'usuarios/login.html')



@login_required
def logout_view(request):
    logout(request)
    messages.info(request, 'Has cerrado sesión exitosamente.')
    return redirect('core:index')


# ==================== RECUPERACIÓN DE CONTRASEÑA ====================

from django.core.mail import send_mail
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.template.loader import render_to_string
from django.conf import settings

@csrf_protect
@never_cache
def solicitar_recuperacion(request):
    """Vista para solicitar código de recuperación por email"""
    
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        
        if not email:
            messages.error(request, 'Por favor ingresa un correo electrónico.')
            return render(request, 'usuarios/password_reset.html')
        
        try:
            user = User.objects.get(email=email, is_active=True)
            
            # Generar token de recuperación
            token = default_token_generator.make_token(user)
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            
            # Construir URL de recuperación
            reset_url = request.build_absolute_uri(
                f'/auth/password-reset-confirm/{uid}/{token}/'
            )
            
            # Enviar email
            subject = 'Recuperación de Contraseña - Mona Keratina'
            message = render_to_string('usuarios/password_reset_email.html', {
                'user': user,
                'reset_url': reset_url,
                'site_name': 'Mona Keratina',
            })
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                html_message=message,
                fail_silently=False,
            )
            
            messages.success(
                request,
                'Se ha enviado un correo con instrucciones para recuperar tu contraseña.'
            )
            return redirect('usuarios:login')
            
        except User.DoesNotExist:
            # Por seguridad, no revelar si el email existe o no
            messages.success(
                request,
                'Si existe una cuenta con ese correo, recibirás instrucciones para recuperar tu contraseña.'
            )
            return redirect('usuarios:login')
        except Exception as e:
            messages.error(
                request,
                'Error al enviar el correo. Por favor intenta más tarde.'
            )
            return render(request, 'usuarios/password_reset.html')
    
    return render(request, 'usuarios/password_reset.html')


@csrf_protect
def password_reset_confirm_view(request, uidb64, token):
    """Vista para confirmar y establecer nueva contraseña"""
    
    try:
        uid = force_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(pk=uid)
    except (TypeError, ValueError, OverflowError, User.DoesNotExist):
        user = None
    
    if user is not None and default_token_generator.check_token(user, token):
        if request.method == 'POST':
            password1 = request.POST.get('password1')
            password2 = request.POST.get('password2')
            
            if not password1 or not password2:
                messages.error(request, 'Debes ingresar ambas contraseñas.')
                return render(request, 'usuarios/password_reset_confirm.html', {
                    'validlink': True,
                    'uidb64': uidb64,
                    'token': token,
                })
            
            if password1 != password2:
                messages.error(request, 'Las contraseñas no coinciden.')
                return render(request, 'usuarios/password_reset_confirm.html', {
                    'validlink': True,
                    'uidb64': uidb64,
                    'token': token,
                })
            
            if len(password1) < 8:
                messages.error(request, 'La contraseña debe tener al menos 8 caracteres.')
                return render(request, 'usuarios/password_reset_confirm.html', {
                    'validlink': True,
                    'uidb64': uidb64,
                    'token': token,
                })
            
            # Cambiar contraseña
            user.set_password(password1)
            user.save()
            
            messages.success(
                request,
                'Tu contraseña ha sido actualizada exitosamente. Ya puedes iniciar sesión.'
            )
            return redirect('usuarios:login')
        
        return render(request, 'usuarios/password_reset_confirm.html', {
            'validlink': True,
            'uidb64': uidb64,
            'token': token,
        })
    else:
        messages.error(
            request,
            'El enlace de recuperación es inválido o ha expirado. Solicita uno nuevo.'
        )
        return render(request, 'usuarios/password_reset_confirm.html', {
            'validlink': False,
        })


@csrf_protect
def username_recovery_view(request):
    """Vista para recuperar nombre de usuario por email"""
    
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()
        
        if not email:
            messages.error(request, 'Por favor ingresa un correo electrónico.')
            return render(request, 'usuarios/username_recovery.html')
        
        try:
            user = User.objects.get(email=email, is_active=True)
            
            # Enviar email con el username
            subject = 'Recuperación de Usuario - Mona Keratina'
            message = f"""
            Hola {user.get_full_name()},
            
            Tu nombre de usuario es: {user.username}
            
            Si no solicitaste esta información, puedes ignorar este correo.
            
            Saludos,
            Equipo Mona Keratina
            """
            
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL,
                [email],
                fail_silently=False,
            )
            
            messages.success(
                request,
                'Se ha enviado tu nombre de usuario al correo registrado.'
            )
            return redirect('usuarios:login')
            
        except User.DoesNotExist:
            messages.success(
                request,
                'Si existe una cuenta con ese correo, recibirás tu nombre de usuario.'
            )
            return redirect('usuarios:login')
        except Exception as e:
            messages.error(
                request,
                'Error al enviar el correo. Por favor intenta más tarde.'
            )
            return render(request, 'usuarios/username_recovery.html')
    
    return render(request, 'usuarios/username_recovery.html')


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
        'crear_usuario.html',
        {
            'titulo': 'Crear Usuario',
            'form': form,
        }
    )


@login_required
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
        'usuarios/editar_usuario.html',
        {
            'titulo': f'Editar Usuario: {usuario.get_full_name()}',
            'form_usuario': form_usuario,
            'form_perfil': form_perfil,
            'usuario': usuario,
        }
    )


@login_required
def eliminar_usuario_view(request, user_id):
    grupos = list(request.user.groups.values_list('name', flat=True))


    usuario = get_object_or_404(User, id=user_id)

    if usuario == request.user:
        messages.error(request, 'No puedes eliminarte a ti mismo.')
        return redirect('usuarios:lista_usuarios')

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
        'usuarios/eliminar_usuario.html',
        {
            'titulo': 'Eliminar Usuario',
            'usuario': usuario,
        }
    )


@login_required
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


# ==================== RECUPERACIÓN DE CONTRASEÑA ====================

@csrf_protect
@never_cache
def password_reset_view(request):
    """
    Recibe un correo, busca al usuario y genera una contraseña temporal.
    Muestra la nueva contraseña en pantalla (sin enviar email real).
    """
    if request.method == 'POST':
        email = request.POST.get('email', '').strip()

        if not email:
            messages.error(request, 'Por favor ingresa tu correo electrónico.')
            return redirect('usuarios:login')

        try:
            user = User.objects.get(email__iexact=email)
        except User.DoesNotExist:
            # Mensaje genérico por seguridad
            messages.info(
                request,
                'Si el correo está registrado, se procesó la solicitud. '
                'Revisa tu bandeja de entrada.'
            )
            return redirect('usuarios:login')

        # Generar contraseña temporal
        nueva_pass = get_random_string(length=10, allowed_chars='abcdefghjkmnpqrstuvwxyz23456789')
        user.set_password(nueva_pass)
        user.save()

        # Mostrar la nueva contraseña al usuario (en desarrollo)
        messages.success(
            request,
            f'¡Listo! Se generó una contraseña temporal para {user.get_full_name() or user.username}. '
            f'Tu nueva contraseña es: {nueva_pass} — Cámbiala al iniciar sesión.'
        )
        return redirect('usuarios:login')

    user = User.objects.get(id=user_id)
    perfil = user.perfil

    if request.method == 'POST':
        codigo = request.POST.get('codigo')

        if perfil.recovery_code != codigo:
            return render(request, 'usuarios/verificar_codigo.html', {
                'error': 'Código incorrecto'
            })

        if timezone.now() - perfil.recovery_code_created > timedelta(minutes=10):
            return render(request, 'usuarios/verificar_codigo.html', {
                'error': 'El código ha expirado'
            })

        request.session['codigo_validado'] = True
        return redirect('usuarios:nueva_password')

    return render(request, 'usuarios/verificar_codigo.html')
def nueva_password(request):
    if not request.session.get('codigo_validado'):
        return redirect('usuarios:login')


# ==================== RECUPERACIÓN DE USUARIO ====================

def solicitar_recuperacion(request):
    if request.method == 'POST':
        email = request.POST.get('email')

        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return render(request, 'usuarios/recuperar.html', {
                'error': 'El correo no está registrado'
            })

        codigo = str(random.randint(100000, 999999))

        perfil = user.perfil
        perfil.recovery_code = codigo
        perfil.recovery_code_created = timezone.now()
        perfil.save()

        html_content = render_to_string('usuarios/correo.html', {
            'codigo': codigo,
            'year': timezone.now().year
        })

        email_msg = EmailMultiAlternatives(
            subject='✨ Recuperación de contraseña - MONAPP',
            body='Tu cliente de correo no soporta HTML',
            from_email='MONAPP <tucorreo@gmail.com>',
            to=[email],
        )

        email_msg.attach_alternative(html_content, "text/html")
        email_msg.send()

        request.session['recovery_user'] = user.id
        return redirect('usuarios:verificar_codigo')

    return render(request, 'usuarios/recuperar.html')
def verificar_codigo(request):
    user_id = request.session.get('recovery_user')

    if not user_id:
        return redirect('usuarios:login')

    user = User.objects.get(id=user_id)
    perfil = user.perfil

    if request.method == 'POST':
        codigo = request.POST.get('codigo')

        if perfil.recovery_code != codigo:
            return render(request, 'usuarios/verificar_codigo.html', {
                'error': 'Código incorrecto'
            })

        if timezone.now() - perfil.recovery_code_created > timedelta(minutes=10):
            return render(request, 'usuarios/verificar_codigo.html', {
                'error': 'El código ha expirado'
            })

        request.session['codigo_validado'] = True
        return redirect('usuarios:nueva_password')

    return render(request, 'usuarios/verificar_codigo.html')
def nueva_password(request):
    if not request.session.get('codigo_validado'):
        return redirect('usuarios:login')

    user = User.objects.get(id=request.session['recovery_user'])

    if request.method == 'POST':
        password = request.POST.get('password')

        user.set_password(password)
        user.save()

        # Limpiar código
        perfil = user.perfil
        perfil.recovery_code = None
        perfil.recovery_code_created = None
        perfil.save()

        request.session.flush()
        return redirect('usuarios:login')

    return render(request, 'usuarios/nueva_password.html')