from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth import get_user_model
from django.core.files.uploadedfile import SimpleUploadedFile
from unittest.mock import patch
from decimal import Decimal
from .models import Producto
from django.contrib.auth.models import Group

User = get_user_model()


class GestionViewsTest(TestCase):
    def setUp(self):
        self.client = Client()
        # Crear superuser para pruebas
        self.admin = User.objects.create_superuser(username='admin', password='adminpass', email='admin@example.com')
        self.client.login(username='admin', password='adminpass')

    def test_product_pagination_and_search(self):
        # Crear 15 productos
        for i in range(15):
            Producto.objects.create(
                nombre=f'Producto {i}',
                descripcion='Descripción de prueba',
                precio=Decimal('10000.00'),
                stock=10
            )
        resp = self.client.get(reverse('listar_productos'))
        self.assertEqual(resp.status_code, 200)
        self.assertTrue(resp.context.get('is_paginated'))
        self.assertEqual(len(resp.context['productos']), 10)

        resp2 = self.client.get(reverse('listar_productos') + '?page=2')
        self.assertEqual(len(resp2.context['productos']), 5)

        # Búsqueda
        Producto.objects.create(nombre='UniqueNameXYZ', descripcion='buscarme', precio=Decimal('5000.00'), stock=1)
        resp_search = self.client.get(reverse('listar_productos') + '?q=UniqueNameXYZ')
        self.assertEqual(len(resp_search.context['productos']), 1)

    def test_restore_view_allowed_for_auxiliar_and_admin(self):
        # Crear grupo Auxiliares y usuario
        group, _ = Group.objects.get_or_create(name='Auxiliares')
        user_aux = User.objects.create_user(username='aux', password='auxpass')
        user_aux.groups.add(group)

        # Admin (ya logueado) puede acceder
        resp = self.client.get(reverse('restaurar_bd'))
        self.assertEqual(resp.status_code, 200)

        # Auxiliar puede acceder
        self.client.logout()
        self.client.login(username='aux', password='auxpass')
        resp2 = self.client.get(reverse('restaurar_bd'))
        self.assertEqual(resp2.status_code, 200)

    @patch('Gestion.views.call_command')
    def test_restore_post_calls_loaddata(self, mock_call):
        # Subir archivo válido (simulado)
        json_content = b'[]'
        f = SimpleUploadedFile('backup.json', json_content, content_type='application/json')
        self.client.login(username='admin', password='adminpass')
        resp = self.client.post(reverse('restaurar_bd'), {'archivo_backup': f}, follow=True)
        self.assertEqual(resp.status_code, 200)
        mock_call.assert_called()

