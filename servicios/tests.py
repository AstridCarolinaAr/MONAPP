from django.test import TestCase
from django.core.exceptions import ValidationError
from django.contrib.auth import get_user_model
from django.urls import reverse
from decimal import Decimal
from .models import Servicio


class ServicioModelTest(TestCase):
    """Pruebas unitarias para el modelo Servicio"""
    
    def setUp(self):
        """Configura los datos de prueba"""
        self.servicio = Servicio.objects.create(
            nombre='Corte de Cabello',
            precio=Decimal('50.00'),
            descripcion='Corte de cabello profesional',
            activo=True
        )
    
    def test_crear_servicio_exitosamente(self):
        """Prueba que un servicio se crea correctamente con datos válidos"""
        self.assertEqual(self.servicio.nombre, 'Corte de Cabello')
        self.assertEqual(self.servicio.precio, Decimal('50.00'))
        self.assertEqual(self.servicio.descripcion, 'Corte de cabello profesional')
        self.assertTrue(self.servicio.activo)
        self.assertIsNotNone(self.servicio.id_servicio)
        self.assertIsNotNone(self.servicio.fecha_creacion)
    
    def test_str_method(self):
        """Prueba que el método __str__ devuelve el formato esperado"""
        expected_str = 'Corte de Cabello - $50.00'
        self.assertEqual(str(self.servicio), expected_str)
    
    def test_actualizar_servicio_correctamente(self):
        """Prueba que un servicio se puede actualizar correctamente"""
        self.servicio.nombre = 'Corte Premium'
        self.servicio.precio = Decimal('75.00')
        self.servicio.descripcion = 'Corte de cabello premium con tratamiento'
        self.servicio.save()
        
        # Recargar desde la base de datos
        servicio_actualizado = Servicio.objects.get(id_servicio=self.servicio.id_servicio)
        
        self.assertEqual(servicio_actualizado.nombre, 'Corte Premium')
        self.assertEqual(servicio_actualizado.precio, Decimal('75.00'))
        self.assertEqual(servicio_actualizado.descripcion, 'Corte de cabello premium con tratamiento')
    
    def test_servicio_inactivo(self):
        """Prueba que un servicio se puede desactivar correctamente"""
        self.assertTrue(self.servicio.activo)
        
        self.servicio.activo = False
        self.servicio.save()
        
        # Recargar desde la base de datos
        servicio_inactivo = Servicio.objects.get(id_servicio=self.servicio.id_servicio)
        
        self.assertFalse(servicio_inactivo.activo)

    def test_normaliza_nombre_al_guardar(self):
        """Prueba que el nombre se normaliza removiendo espacios duplicados"""
        servicio = Servicio.objects.create(
            nombre='  Corte    Basico  ',
            precio=Decimal('30.00'),
            descripcion='Servicio con nombre desordenado'
        )
        self.assertEqual(servicio.nombre, 'Corte Basico')

    def test_no_permite_nombre_duplicado_case_insensitive(self):
        """Prueba que no se permiten duplicados por mayúsculas/minúsculas"""
        duplicado = Servicio(
            nombre='corte de cabello',
            precio=Decimal('60.00'),
            descripcion='Intento de duplicado'
        )

        with self.assertRaises(ValidationError) as error:
            duplicado.full_clean()

        self.assertIn('nombre', error.exception.message_dict)


class ServicioViewsTest(TestCase):
    """Pruebas funcionales para vistas del módulo servicios"""

    def setUp(self):
        User = get_user_model()
        self.admin_user = User.objects.create_user(
            username='admin_servicios',
            password='pass12345',
            is_staff=True,
            is_superuser=True,
        )
        self.regular_user = User.objects.create_user(
            username='usuario_servicios',
            password='pass12345',
            is_staff=False,
            is_superuser=False,
        )
        self.servicio = Servicio.objects.create(
            nombre='Colorimetria',
            precio=Decimal('120.00'),
            descripcion='Servicio para pruebas funcionales',
            activo=True,
        )

    def test_lista_servicios_requiere_login(self):
        response = self.client.get(reverse('servicios:lista_servicios'))
        self.assertEqual(response.status_code, 302)

    def test_admin_puede_crear_servicio_via_ajax(self):
        self.client.login(username='admin_servicios', password='pass12345')
        response = self.client.post(
            reverse('servicios:crear_servicio'),
            {
                'nombre': 'Masaje Capilar',
                'precio': '90.00',
                'descripcion': 'Prueba de creación AJAX',
            },
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json().get('success'))
        self.assertTrue(Servicio.objects.filter(nombre='Masaje Capilar').exists())

    def test_usuario_no_admin_no_puede_crear_servicio(self):
        self.client.login(username='usuario_servicios', password='pass12345')
        response = self.client.post(
            reverse('servicios:crear_servicio'),
            {
                'nombre': 'Servicio Bloqueado',
                'precio': '10.00',
                'descripcion': 'No debería crearse',
            },
        )

        self.assertEqual(response.status_code, 302)
        self.assertFalse(Servicio.objects.filter(nombre='Servicio Bloqueado').exists())

    def test_toggle_activo_requiere_post(self):
        self.client.login(username='admin_servicios', password='pass12345')
        response = self.client.get(reverse('servicios:toggle_activo_servicio', kwargs={'pk': self.servicio.pk}))
        self.assertEqual(response.status_code, 400)

    def test_toggle_activo_admin_funciona(self):
        self.client.login(username='admin_servicios', password='pass12345')
        response = self.client.post(
            reverse('servicios:toggle_activo_servicio', kwargs={'pk': self.servicio.pk}),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(response.status_code, 200)
        self.servicio.refresh_from_db()
        self.assertFalse(self.servicio.activo)
        self.assertTrue(response.json().get('success'))

    def test_toggle_activo_no_admin_denegado(self):
        self.client.login(username='usuario_servicios', password='pass12345')
        response = self.client.post(
            reverse('servicios:toggle_activo_servicio', kwargs={'pk': self.servicio.pk}),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(response.status_code, 403)

    def test_eliminar_servicio_desactiva_sin_borrar(self):
        self.client.login(username='admin_servicios', password='pass12345')
        response = self.client.post(
            reverse('servicios:eliminar_servicio', kwargs={'pk': self.servicio.pk}),
            HTTP_X_REQUESTED_WITH='XMLHttpRequest',
        )

        self.assertEqual(response.status_code, 200)
        self.servicio.refresh_from_db()
        self.assertFalse(self.servicio.activo)
        self.assertTrue(Servicio.objects.filter(pk=self.servicio.pk).exists())
