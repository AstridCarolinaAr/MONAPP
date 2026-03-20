import uuid
from decimal import Decimal
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import ProductoWeb
from .forms import ProductoWebForm

# ── Python 3.14 / Django 4.2 compatibility patch ──────────────────────────────
# In Python 3.14, object.__copy__() no longer automatically populates __dict__,
# which breaks Django's BaseContext.__copy__ inside the test client.
from django.template.context import BaseContext as _BaseContext
def _patched_ctx_copy(self):
    dup = self.__class__.__new__(self.__class__)
    dup.__dict__.update(self.__dict__)
    dup.dicts = self.dicts[:]
    return dup
_BaseContext.__copy__ = _patched_ctx_copy
del _BaseContext, _patched_ctx_copy
# ─────────────────────────────────────────────────────────────────────────────


# ─────────────────────── helpers ───────────────────────

def make_producto(**kwargs):
    """Crea y guarda un ProductoWeb con datos válidos por defecto."""
    defaults = {
        'nombre': 'Producto Test',
        'precio': Decimal('1000'),
        'descripcion': 'Descripción de prueba',
        'visible': True,
    }
    defaults.update(kwargs)
    return ProductoWeb.objects.create(**defaults)


def valid_form_data(**overrides):
    """Devuelve un dict con datos válidos para ProductoWebForm."""
    data = {
        'nombre': 'Producto Ejemplo',
        'precio': '5000',
        'descripcion': 'Descripción del producto',
        'visible': True,
    }
    data.update(overrides)
    return data


# ═══════════════════════════════════════════════════════
# MODELOS
# ═══════════════════════════════════════════════════════

class ProductoWebModelTest(TestCase):

    def test_crear_producto(self):
        p = make_producto()
        self.assertIsNotNone(p.pk)
        self.assertEqual(p.nombre, 'Producto Test')
        self.assertEqual(p.precio, Decimal('1000'))

    def test_str(self):
        p = make_producto(nombre='Café Premium', precio=Decimal('3500'))
        self.assertEqual(str(p), 'Café Premium – $3500')

    def test_visible_default_true(self):
        p = ProductoWeb.objects.create(nombre='Sin visible', precio=Decimal('500'))
        self.assertTrue(p.visible)

    def test_uuid_como_pk(self):
        p = make_producto()
        self.assertIsInstance(p.pk, uuid.UUID)

    def test_descripcion_puede_estar_vacia(self):
        p = ProductoWeb.objects.create(nombre='Sin desc', precio=Decimal('200'))
        self.assertEqual(p.descripcion, '')

    def test_precio_se_guarda_correctamente(self):
        p = make_producto(precio=Decimal('12345'))
        p.refresh_from_db()
        self.assertEqual(p.precio, Decimal('12345'))


# ═══════════════════════════════════════════════════════
# FORMULARIO
# ═══════════════════════════════════════════════════════

class ProductoWebFormNombreTest(TestCase):

    def test_nombre_vacio_invalido(self):
        form = ProductoWebForm(data=valid_form_data(nombre=''))
        self.assertFalse(form.is_valid())
        self.assertIn('nombre', form.errors)

    def test_nombre_un_caracter_invalido(self):
        form = ProductoWebForm(data=valid_form_data(nombre='A'))
        self.assertFalse(form.is_valid())
        self.assertIn('nombre', form.errors)

    def test_nombre_con_numeros_valido(self):
        form = ProductoWebForm(data=valid_form_data(nombre='Producto 3000'))
        self.assertTrue(form.is_valid(), form.errors)

    def test_nombre_con_tildes_valido(self):
        form = ProductoWebForm(data=valid_form_data(nombre='Café Especial'))
        self.assertTrue(form.is_valid(), form.errors)

    def test_nombre_con_guion_valido(self):
        form = ProductoWebForm(data=valid_form_data(nombre='Producto A-Plus'))
        self.assertTrue(form.is_valid(), form.errors)

    def test_nombre_caracteres_invalidos(self):
        form = ProductoWebForm(data=valid_form_data(nombre='Prod@{invalido}'))
        self.assertFalse(form.is_valid())
        self.assertIn('nombre', form.errors)

    def test_nombre_exactamente_doscientos_valido(self):
        form = ProductoWebForm(data=valid_form_data(nombre='A' * 200))
        self.assertTrue(form.is_valid(), form.errors)

    def test_nombre_doscientos_uno_invalido(self):
        form = ProductoWebForm(data=valid_form_data(nombre='A' * 201))
        self.assertFalse(form.is_valid())
        self.assertIn('nombre', form.errors)


class ProductoWebFormPrecioTest(TestCase):

    def test_precio_cien_valido(self):
        form = ProductoWebForm(data=valid_form_data(precio='100'))
        self.assertTrue(form.is_valid(), form.errors)

    def test_precio_menor_cien_invalido(self):
        form = ProductoWebForm(data=valid_form_data(precio='99'))
        self.assertFalse(form.is_valid())
        self.assertIn('precio', form.errors)

    def test_precio_cero_invalido(self):
        form = ProductoWebForm(data=valid_form_data(precio='0'))
        self.assertFalse(form.is_valid())
        self.assertIn('precio', form.errors)

    def test_precio_con_decimales_invalido(self):
        form = ProductoWebForm(data=valid_form_data(precio='1500.50'))
        self.assertFalse(form.is_valid())
        self.assertIn('precio', form.errors)

    def test_precio_excede_maximo_invalido(self):
        form = ProductoWebForm(data=valid_form_data(precio='100000000'))
        self.assertFalse(form.is_valid())
        self.assertIn('precio', form.errors)

    def test_precio_vacio_invalido(self):
        form = ProductoWebForm(data=valid_form_data(precio=''))
        self.assertFalse(form.is_valid())
        self.assertIn('precio', form.errors)

    def test_precio_negativo_invalido(self):
        form = ProductoWebForm(data=valid_form_data(precio='-500'))
        self.assertFalse(form.is_valid())
        self.assertIn('precio', form.errors)

    def test_precio_maximo_permitido_valido(self):
        form = ProductoWebForm(data=valid_form_data(precio='9999999'))
        self.assertTrue(form.is_valid(), form.errors)


class ProductoWebFormDescripcionTest(TestCase):

    def test_descripcion_vacia_valida(self):
        form = ProductoWebForm(data=valid_form_data(descripcion=''))
        self.assertTrue(form.is_valid(), form.errors)

    def test_descripcion_quinientos_caracteres_valida(self):
        form = ProductoWebForm(data=valid_form_data(descripcion='X' * 500))
        self.assertTrue(form.is_valid(), form.errors)

    def test_descripcion_quinientos_uno_invalida(self):
        form = ProductoWebForm(data=valid_form_data(descripcion='X' * 501))
        self.assertFalse(form.is_valid())
        self.assertIn('descripcion', form.errors)


# ═══════════════════════════════════════════════════════
# VISTAS
# ═══════════════════════════════════════════════════════

class ProductoWebListaViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.producto = make_producto()
        self.url = reverse('productos_web:lista')

    def test_requiere_login(self):
        self.client.logout()
        resp = self.client.get(self.url)
        self.assertNotEqual(resp.status_code, 200)

    def test_get_ok(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'productos_web/lista.html')

    def test_contexto_incluye_form(self):
        resp = self.client.get(self.url)
        self.assertIn('form', resp.context)
        self.assertIsInstance(resp.context['form'], ProductoWebForm)

    def test_lista_muestra_producto(self):
        resp = self.client.get(self.url)
        self.assertIn(self.producto, resp.context['productos'])

    def test_filtro_q_por_nombre(self):
        make_producto(nombre='Laptop Gamer')
        resp = self.client.get(self.url, {'q': 'Laptop'})
        nombres = [p.nombre for p in resp.context['productos']]
        self.assertIn('Laptop Gamer', nombres)
        self.assertNotIn('Producto Test', nombres)

    def test_filtro_visible_si(self):
        make_producto(nombre='Oculto', visible=False)
        resp = self.client.get(self.url, {'visible': 'si'})
        for p in resp.context['productos']:
            self.assertTrue(p.visible)

    def test_filtro_visible_no(self):
        make_producto(nombre='Oculto', visible=False)
        resp = self.client.get(self.url, {'visible': 'no'})
        for p in resp.context['productos']:
            self.assertFalse(p.visible)

    def test_orden_precio_asc(self):
        make_producto(nombre='Barato', precio=Decimal('100'))
        make_producto(nombre='Caro', precio=Decimal('9000'))
        resp = self.client.get(self.url, {'orden': 'precio_asc'})
        precios = [p.precio for p in resp.context['productos']]
        self.assertEqual(precios, sorted(precios))

    def test_orden_precio_desc(self):
        make_producto(nombre='Barato', precio=Decimal('100'))
        make_producto(nombre='Caro', precio=Decimal('9000'))
        resp = self.client.get(self.url, {'orden': 'precio_desc'})
        precios = [p.precio for p in resp.context['productos']]
        self.assertEqual(precios, sorted(precios, reverse=True))

    def test_orden_nombre_asc(self):
        make_producto(nombre='Alfa')
        make_producto(nombre='Zeta')
        resp = self.client.get(self.url, {'orden': 'nombre_asc'})
        nombres = [p.nombre for p in resp.context['productos']]
        self.assertEqual(nombres, sorted(nombres))


class ProductoWebCrearViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.url = reverse('productos_web:crear')
        self.lista_url = reverse('productos_web:lista')

    def test_get_renderiza_formulario(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'productos_web/form.html')

    def test_post_valido_crea_y_redirige(self):
        resp = self.client.post(self.url, valid_form_data(nombre='Nuevo Producto'))
        self.assertRedirects(resp, self.lista_url)
        self.assertTrue(ProductoWeb.objects.filter(nombre='Nuevo Producto').exists())

    def test_post_invalido_renderiza_form(self):
        resp = self.client.post(self.url, valid_form_data(nombre=''))
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'productos_web/form.html')
        self.assertFalse(ProductoWeb.objects.filter(nombre='').exists())

    def test_requiere_login(self):
        self.client.logout()
        resp = self.client.get(self.url)
        self.assertNotEqual(resp.status_code, 200)


class ProductoWebDetalleJsonViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.producto = make_producto()
        self.url = reverse('productos_web:detalle_json', args=[self.producto.pk])

    def test_devuelve_json_con_datos_correctos(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertEqual(data['nombre'], self.producto.nombre)
        self.assertEqual(Decimal(data['precio']), self.producto.precio)
        self.assertEqual(data['id'], str(self.producto.pk))

    def test_json_incluye_campo_visible(self):
        resp = self.client.get(self.url)
        data = resp.json()
        self.assertIn('visible', data)
        self.assertTrue(data['visible'])

    def test_json_incluye_descripcion(self):
        resp = self.client.get(self.url)
        data = resp.json()
        self.assertIn('descripcion', data)

    def test_pk_inexistente_retorna_404(self):
        url = reverse('productos_web:detalle_json', args=[uuid.uuid4()])
        resp = self.client.get(url)
        self.assertEqual(resp.status_code, 404)


class ProductoWebEditarViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.producto = make_producto()
        self.url = reverse('productos_web:editar', args=[self.producto.pk])
        self.lista_url = reverse('productos_web:lista')

    def test_get_muestra_formulario(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'productos_web/form.html')

    def test_post_valido_actualiza_y_redirige(self):
        resp = self.client.post(self.url, valid_form_data(nombre='Actualizado', precio='2000'))
        self.assertRedirects(resp, self.lista_url)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.nombre, 'Actualizado')
        self.assertEqual(self.producto.precio, Decimal('2000'))

    def test_post_invalido_redirige_sin_cambios(self):
        resp = self.client.post(self.url, valid_form_data(precio='50'))
        self.assertRedirects(resp, self.lista_url)
        self.producto.refresh_from_db()
        self.assertEqual(self.producto.precio, Decimal('1000'))

    def test_pk_inexistente_retorna_404(self):
        url = reverse('productos_web:editar', args=[uuid.uuid4()])
        resp = self.client.post(url, valid_form_data())
        self.assertEqual(resp.status_code, 404)


class ProductoWebEliminarViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.producto = make_producto()
        self.url = reverse('productos_web:eliminar', args=[self.producto.pk])
        self.lista_url = reverse('productos_web:lista')

    def test_get_muestra_confirmacion(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'productos_web/confirmar_eliminar.html')

    def test_post_elimina_y_redirige(self):
        resp = self.client.post(self.url)
        self.assertRedirects(resp, self.lista_url)
        self.assertFalse(ProductoWeb.objects.filter(pk=self.producto.pk).exists())

    def test_pk_inexistente_retorna_404(self):
        url = reverse('productos_web:eliminar', args=[uuid.uuid4()])
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 404)


class ProductoWebToggleVisibleViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.producto = make_producto(visible=True)
        self.url = reverse('productos_web:toggle_visible', args=[self.producto.pk])

    def test_post_devuelve_json_ok(self):
        resp = self.client.post(self.url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data['ok'])

    def test_visible_pasa_a_false(self):
        resp = self.client.post(self.url)
        data = resp.json()
        self.assertFalse(data['visible'])
        self.producto.refresh_from_db()
        self.assertFalse(self.producto.visible)

    def test_oculto_pasa_a_visible(self):
        self.producto.visible = False
        self.producto.save(update_fields=['visible'])
        resp = self.client.post(self.url)
        data = resp.json()
        self.assertTrue(data['visible'])

    def test_get_retorna_405(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 405)

    def test_requiere_login(self):
        self.client.logout()
        resp = self.client.post(self.url)
        self.assertNotEqual(resp.status_code, 200)

    def test_pk_inexistente_retorna_404(self):
        url = reverse('productos_web:toggle_visible', args=[uuid.uuid4()])
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 404)

