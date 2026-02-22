# usuarios/urls.py

from django.urls import path
from . import views

app_name = 'usuarios'

urlpatterns = [
    # Autenticación
    path('login/', views.login_view, name='login'),
    path('registro/', views.registro_view, name='registro'),
    path('logout/', views.logout_view, name='logout'),
    
    # Recuperación de cuenta
    path('password-reset/', views.password_reset_view, name='password_reset'),
    path('username-recovery/', views.username_recovery_view, name='username_recovery'),
    
    # Perfil de usuario
    path('perfil/', views.perfil_view, name='perfil'),
    
    # Panel de administración
    path('usuarios/', views.lista_usuarios_view, name='lista_usuarios'),
    path('usuarios/crear/', views.crear_usuario_view, name='crear_usuario'),
    path('usuarios/<int:user_id>/editar/', views.editar_usuario_view, name='editar_usuario'),
    path('usuarios/<int:user_id>/eliminar/', views.eliminar_usuario_view, name='eliminar_usuario'),

  #recuperar contraseña
    path('recuperar/', views.solicitar_recuperacion, name='recuperar'),
    path('verificar/', views.verificar_codigo, name='verificar_codigo'),
    path('nueva-password/', views.nueva_password, name='nueva_password'),
]