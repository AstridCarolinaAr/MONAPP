import re
import socket
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
from .forms import LoginForm, RegistroForm, EditarUsuarioForm, EditarPerfilForm, UsuarioBusquedaForm
from .models import PerfilUsuario
import random
from django.utils import timezone
from django.core.mail import send_mail
from datetime import timedelta
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.utils.crypto import get_random_string
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
import traceback

# ==================== VISTAS DE AUTENTICACIÓN ====================

@csrf_protect
@never_cache
def login_view(request):
    # Si el usuario ya está autenticado, lo enviamos al dashboard
    if request.user.is_authenticated:
        return redirect('core:dashboard')

    if request.method == 'POST':
        form = LoginForm(request, data=request.POST)

        if form.is_valid():
            user = form.get_user()
            login(request, user)
            return redirect('core:dashboard')

        messages.error(request, 'Usuario o contraseña incorrectos.')
        # Redirigir de vuelta a la página donde estaba el usuario para que el modal se pueda reabrir
        return redirect(request.META.get('HTTP_REFERER', 'core:index'))
    else:
        # Para peticiones GET, creamos un formulario vacío
        form = LoginForm()

    return render(request, 'usuarios/login.html', {
        'form': form
    })



@login_required
def logout_view(request):
    logout(request)
    messages.success(request, 'Has cerrado sesión exitosamente.')
    return redirect('core:index')


# ==================== RECUPERACIÓN DE CONTRASEÑA ====================


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
        except (socket.gaierror, OSError, TimeoutError) as e:
            messages.error(
                request,
                'No se pudo conectar al servidor de correo. Verifica la conexión a internet e intenta más tarde.'
            )
            return render(request, 'usuarios/password_reset.html')
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

    es_administrador = request.user.is_superuser or 'Administrador' in grupos
    puede_modificar  = request.user.is_superuser or 'Administrador' in grupos or 'Auxiliar' in grupos

    # ✅ form se crea PRIMERO
    form = UsuarioBusquedaForm(request.GET)

    usuarios = User.objects.select_related('perfil').all()

    if form.is_valid():
        busqueda = form.cleaned_data.get('busqueda')
        filtro   = form.cleaned_data.get('filtro')

        if busqueda:
            usuarios = usuarios.filter(
                Q(username__icontains=busqueda)   |
                Q(first_name__icontains=busqueda) |
                Q(last_name__icontains=busqueda)  |
                Q(email__icontains=busqueda)      |
                Q(perfil__documento__icontains=busqueda)
            )

        if filtro:
            if filtro == 'activo':
                usuarios = usuarios.filter(is_active=True)
            elif filtro == 'inactivo':
                usuarios = usuarios.filter(is_active=False)
            elif filtro.startswith('rol_'):
                rol_valor = filtro.replace('rol_', '')
                usuarios = usuarios.filter(groups__name=rol_valor)

    usuarios = usuarios.order_by('-date_joined')

    q = form.cleaned_data.get('busqueda', '') if form.is_valid() else ''

    context = {
        'titulo'          : 'Gestión de Usuarios',
        'usuarios'        : usuarios,
        'form'            : form,
        'es_administrador': es_administrador,
        'puede_modificar' : puede_modificar,
        'q'               : q,
    }

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return render(request, 'usuarios/lista_usuarios_global.html', context)

    return render(request, 'usuarios/lista_usuarios.html', context)

@login_required
#@no_colaborador_required()
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
def editar_usuario_view(request, user_id):
    usuario = get_object_or_404(User, id=user_id)
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    try:
        perfil, _ = PerfilUsuario.objects.get_or_create(user=usuario)

        if request.method == 'POST':
            form_usuario = EditarUsuarioForm(request.POST, instance=usuario)
            form_perfil = EditarPerfilForm(
                request.POST,
                request.FILES,
                instance=perfil
            )

            if form_usuario.is_valid() and form_perfil.is_valid():
                user_updated = form_usuario.save(commit=False)

            rol = str(form_usuario.cleaned_data.get('rol', '')).strip()
            if rol:
                user_updated.groups.clear()
                grupo, _ = Group.objects.get_or_create(name=rol)
                user_updated.groups.add(grupo)
                user_updated.is_staff = rol in ['Administrador', 'Auxiliar']

                user_updated.save()
                form_perfil.save()

                if is_ajax:
                    return JsonResponse({
                        'success': True,
                        'message': f'Usuario {usuario.get_full_name() or usuario.username} actualizado exitosamente.'
                    })

                messages.success(
                    request,
                    f'Usuario {usuario.get_full_name() or usuario.username} actualizado.'
                )
                return redirect('usuarios:lista_usuarios')

            if is_ajax:
                html_form = render_to_string(
                    'usuarios/_formulario_editar_usuario_modal.html',
                    {
                        'form_usuario': form_usuario,
                        'form_perfil': form_perfil,
                        'usuario': usuario,
                    },
                    request=request
                )
                return JsonResponse({
                    'success': False,
                    'html_form': html_form
                }, status=400)

        else:
            form_usuario = EditarUsuarioForm(instance=usuario)
            form_perfil = EditarPerfilForm(instance=perfil)

        if is_ajax:
            html_form = render_to_string(
                'usuarios/_formulario_editar_usuario_modal.html',
                {
                    'form_usuario': form_usuario,
                    'form_perfil': form_perfil,
                    'usuario': usuario,
                },
                request=request
            )
            return JsonResponse({
                'success': True,
                'html_form': html_form
            })

        return render(
            request,
            'usuarios/editar_usuario.html',
            {
                'titulo': f'Editar Usuario: {usuario.get_full_name() or usuario.username}',
                'form_usuario': form_usuario,
                'form_perfil': form_perfil,
                'usuario': usuario,
            }
        )

    except Exception as e:
        print("ERROR EDITAR USUARIO:")
        print(traceback.format_exc())

        if is_ajax:
            return JsonResponse({
                'success': False,
                'message': str(e),
                'trace': traceback.format_exc()
            }, status=500)
        raise

@login_required
# @solo_admin_required()
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
def detalle_usuario_view(request, user_id):
    """Ver detalles de un usuario vía AJAX."""
    grupos = list(request.user.groups.values_list('name', flat=True))
    es_administrador = request.user.is_superuser or 'Administrador' in grupos
    puede_modificar = request.user.is_superuser or 'Administrador' in grupos or 'Auxiliar' in grupos

    usuario = get_object_or_404(User, id=user_id)
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    if is_ajax:
        html_content = render_to_string(
            'usuarios/_detalle_usuario_modal.html',
            {
                'usuario': usuario,
                'es_administrador': es_administrador,
                'puede_modificar': puede_modificar,
            },
            request=request
        )
        return JsonResponse({'html_content': html_content})

    return redirect('usuarios:lista_usuarios')


@login_required
def toggle_activo_usuario_view(request, user_id):
    """Cambia el estado activo/inactivo de un usuario vía AJAX."""
    is_ajax = request.headers.get('X-Requested-With') == 'XMLHttpRequest'

    if not is_ajax or request.method != 'POST':
        return JsonResponse({'success': False, 'mensaje': 'Solicitud no válida.'}, status=400)

    usuario = get_object_or_404(User, id=user_id)

    if usuario == request.user:
        return JsonResponse({'success': False, 'mensaje': 'No puedes cambiar tu propio estado.'}, status=403)

    usuario.is_active = not usuario.is_active
    usuario.save(update_fields=['is_active'])

    estado = 'activo' if usuario.is_active else 'inactivo'
    return JsonResponse({
        'success': True,
        'activo': usuario.is_active,
        'mensaje': f'Usuario "{usuario.username}" marcado como {estado}.'
    })


@login_required
# @admin_o_aux_required()
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
# @no_colaborador_required()
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
# @no_colaborador_required()
def validar_email_ajax(request):
    """
    Endpoint AJAX para validar email en tiempo real
    """
    if request.method == 'GET':
        email = request.GET.get('email', '').strip()
        
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

    user = User.objects.get(email__iexact=email)


    try:
        perfil = user.perfil
    except Exception:
        messages.error(request, "Este usuario no tiene perfil asociado.")
        return redirect("usuarios:login")

    if not perfil.recovery_code or not perfil.recovery_code_created:
        return render(request, "usuarios/verificar_codigo.html", {
            "error": "No hay un código activo. Solicita uno nuevo."
        })

    if request.method == "POST":
        codigo = (request.POST.get("codigo") or "").strip()

        if perfil.recovery_code != codigo:
            return render(request, "usuarios/verificar_codigo.html", {
                "error": "Código incorrecto"
            })

        if timezone.now() - perfil.recovery_code_created > timedelta(minutes=10):
            return render(request, "usuarios/verificar_codigo.html", {
                "error": "El código ha expirado"
            })

        request.session["codigo_validado"] = True
        request.session["user_id_reset"] = user.id  # para saber a quién cambiarle la clave luego
        return redirect("usuarios:nueva_password")

    return render(request, "usuarios/verificar_codigo.html")
def nueva_password(request):
    #  Verificar que el código fue validado
    if not request.session.get('codigo_validado'):
        return redirect('usuarios:login')

    user_id = request.session.get('user_id_reset')
    if not user_id:
        return redirect('usuarios:login')

    try:
        user = User.objects.get(id=user_id)
    except User.DoesNotExist:
        return redirect('usuarios:login')

    if request.method == 'POST':
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')

        if not password1 or not password2:
            messages.error(request, "Debes completar ambos campos.")
            return render(request, 'usuarios/nueva_password.html')

        if password1 != password2:
            messages.error(request, "Las contraseñas no coinciden.")
            return render(request, 'usuarios/nueva_password.html')

        #  Cambiar contraseña
        user.set_password(password1)
        user.save()

        #  Limpiar sesión
        request.session.pop('codigo_validado', None)
        request.session.pop('user_id_reset', None)

        messages.success(request, "Contraseña actualizada correctamente. Ahora puedes iniciar sesión.")
        return redirect('usuarios:login')

    return render(request, 'usuarios/nueva_password.html')


# ==================== RECUPERACIÓN DE USUARIO ====================

@csrf_protect
@never_cache
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
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[email],
        )

        email_msg.attach_alternative(html_content, "text/html")
        email_msg.send()

        request.session['recovery_user'] = user.id
        return redirect('usuarios:verificar_codigo')

    return render(request, 'usuarios/recuperar.html')

@csrf_protect
@never_cache
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

@csrf_protect
@never_cache
def nueva_password(request):
    if not request.session.get('codigo_validado'):
        return redirect('usuarios:login')

    user = User.objects.get(id=request.session['recovery_user'])

    if request.method == 'POST':
        password1 = request.POST.get('password1')
        password2 = request.POST.get('password2')

        if not password1 or not password2:
            messages.error(request, 'Debes ingresar ambas contraseñas.')
            return render(request, 'usuarios/nueva_password.html')

        if password1 != password2:
            messages.error(request, 'Las contraseñas no coinciden.')
            return render(request, 'usuarios/nueva_password.html')

        if len(password1) < 8:
            messages.error(request, 'La contraseña debe tener al menos 8 caracteres.')
            return render(request, 'usuarios/nueva_password.html')

        if not re.search(r'[A-Z]', password1):
            messages.error(request, 'La contraseña debe contener al menos una letra mayúscula.')
            return render(request, 'usuarios/nueva_password.html')

        if not re.search(r'[0-9]', password1):
            messages.error(request, 'La contraseña debe contener al menos un número.')
            return render(request, 'usuarios/nueva_password.html')

        if not re.search(r'[^A-Za-z0-9]', password1):
            messages.error(request, 'La contraseña debe incluir al menos un carácter especial (ej: @, #, !, %).')
            return render(request, 'usuarios/nueva_password.html')

        user.set_password(password1)
        user.save()

        # Limpiar código
        perfil = user.perfil
        perfil.recovery_code = None
        perfil.recovery_code_created = None
        perfil.save()

        request.session.flush()
        messages.success(request, 'Tu contraseña ha sido actualizada exitosamente.')
        return redirect('usuarios:login')

    return render(request, 'usuarios/nueva_password.html')


# ==================== VALIDACIONES EN TIEMPO REAL ====================

def validar_documento_usuario(request):
    """
    Endpoint para validar documento de usuario en tiempo real
    """
    numero = (request.GET.get('numero') or '').strip()
    user_id = request.GET.get('user_id')

    # Validar número
    if not numero.isdigit():
        return JsonResponse({'valido': False, 'mensaje': 'Solo números'})

    # Normalizar user_id
    if not user_id or user_id in ('undefined', 'null', ''):
        user_id = None
    else:
        try:
            user_id = int(user_id)
        except ValueError:
            user_id = None

    qs = PerfilUsuario.objects.filter(documento=numero)

    # Si es edición, excluye el mismo usuario
    if user_id is not None:
        qs = qs.exclude(user__id=user_id)

    if qs.exists():
        return JsonResponse({
            'valido': False,
            'mensaje': 'Ya existe otro usuario con este documento.'
        })

    return JsonResponse({'valido': True})


def validar_email_usuario(request):
    """
    Endpoint para validar email de usuario en tiempo real
    """
    email = (request.GET.get('email') or '').strip()
    user_id = request.GET.get('user_id')

    # Validar formato de email (solo verificar @ y .)
    if '@' not in email or '.' not in email.split('@')[-1]:
        return JsonResponse({'valido': False, 'mensaje': 'Correo electrónico inválido'})

    # Normalizar user_id
    if not user_id or user_id in ('undefined', 'null', ''):
        user_id = None
    else:
        try:
            user_id = int(user_id)
        except ValueError:
            user_id = None

    qs = User.objects.filter(email=email)

    # Si es edición, excluye el mismo usuario
    if user_id is not None:
        qs = qs.exclude(id=user_id)

    if qs.exists():
        return JsonResponse({
            'valido': False,
            'mensaje': 'Ya existe otro usuario con este email.'
        })

    return JsonResponse({'valido': True})
