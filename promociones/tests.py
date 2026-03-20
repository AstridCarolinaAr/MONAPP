from datetime import date, timedelta
from decimal import Decimal
from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from .models import Promocion
from .forms import PromocionForm

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

def make_promocion(**kwargs):
    """Crea y guarda una Promocion con datos válidos por defecto."""
    defaults = {
        'nombre': 'Promo Test',
        'descripcion': 'Descripción de prueba',
        'etiqueta': 'nuevo',
        'porcentaje_descuento': Decimal('10.00'),
        'fecha_inicio': date.today(),
        'fecha_fin': date.today() + timedelta(days=30),
        'activa': True,
    }
    defaults.update(kwargs)
    return Promocion.objects.create(**defaults)


def valid_form_data(**overrides):
    """Devuelve un dict con datos válidos para PromocionForm."""
    data = {
        'nombre': 'Promo Verano',
        'descripcion': 'Oferta de verano',
        'etiqueta': 'especial',
        'porcentaje_descuento': '15',
        'fecha_inicio': str(date.today()),
        'fecha_fin': str(date.today() + timedelta(days=30)),
        'activa': True,
    }
    data.update(overrides)
    return data


# ═══════════════════════════════════════════════════════
# MODELOS
# ═══════════════════════════════════════════════════════

class PromocionModelTest(TestCase):

    def test_crear_promocion(self):
        p = make_promocion()
        self.assertIsNotNone(p.pk)
        self.assertEqual(p.nombre, 'Promo Test')
        self.assertEqual(p.porcentaje_descuento, Decimal('10.00'))

    def test_str(self):
        p = make_promocion(nombre='Descuento Navidad', porcentaje_descuento=Decimal('25.00'))
        self.assertEqual(str(p), 'Descuento Navidad – 25.00%')

    def test_activa_default_true(self):
        p = Promocion.objects.create(
            nombre='Sin activa',
            porcentaje_descuento=Decimal('5.00'),
            fecha_inicio=date.today(),
            fecha_fin=date.today() + timedelta(days=10),
        )
        self.assertTrue(p.activa)

    def test_etiqueta_default_nuevo(self):
        p = Promocion.objects.create(
            nombre='Test etiqueta',
            porcentaje_descuento=Decimal('5.00'),
            fecha_inicio=date.today(),
            fecha_fin=date.today() + timedelta(days=10),
        )
        self.assertEqual(p.etiqueta, 'nuevo')

    def test_uuid_como_pk(self):
        p = make_promocion()
        import uuid
        self.assertIsInstance(p.pk, uuid.UUID)

    def test_fechas_se_guardan(self):
        inicio = date.today()
        fin = date.today() + timedelta(days=60)
        p = make_promocion(fecha_inicio=inicio, fecha_fin=fin)
        self.assertEqual(p.fecha_inicio, inicio)
        self.assertEqual(p.fecha_fin, fin)


# ═══════════════════════════════════════════════════════
# FORMULARIO
# ═══════════════════════════════════════════════════════

class PromocionFormNombreTest(TestCase):

    def test_nombre_vacio_invalido(self):
        form = PromocionForm(data=valid_form_data(nombre=''))
        self.assertFalse(form.is_valid())
        self.assertIn('nombre', form.errors)

    def test_nombre_un_caracter_invalido(self):
        form = PromocionForm(data=valid_form_data(nombre='A'))
        self.assertFalse(form.is_valid())
        self.assertIn('nombre', form.errors)

    def test_nombre_con_numeros_invalido(self):
        form = PromocionForm(data=valid_form_data(nombre='Promo 2024'))
        self.assertFalse(form.is_valid())
        self.assertIn('nombre', form.errors)

    def test_nombre_con_caracteres_especiales_invalido(self):
        form = PromocionForm(data=valid_form_data(nombre='Promo-Verano!'))
        self.assertFalse(form.is_valid())
        self.assertIn('nombre', form.errors)

    def test_nombre_con_tildes_valido(self):
        form = PromocionForm(data=valid_form_data(nombre='Prómo Especial'))
        self.assertTrue(form.is_valid(), form.errors)

    def test_nombre_con_enie_valido(self):
        form = PromocionForm(data=valid_form_data(nombre='Oferta Año Nuevo'))
        self.assertTrue(form.is_valid(), form.errors)

    def test_nombre_exactamente_doscientos_valido(self):
        form = PromocionForm(data=valid_form_data(nombre='A' * 200))
        self.assertTrue(form.is_valid(), form.errors)

    def test_nombre_doscientos_uno_invalido(self):
        form = PromocionForm(data=valid_form_data(nombre='A' * 201))
        self.assertFalse(form.is_valid())
        self.assertIn('nombre', form.errors)


class PromocionFormPorcentajeTest(TestCase):

    def test_porcentaje_cero_invalido(self):
        form = PromocionForm(data=valid_form_data(porcentaje_descuento='0'))
        self.assertFalse(form.is_valid())
        self.assertIn('porcentaje_descuento', form.errors)

    def test_porcentaje_negativo_invalido(self):
        form = PromocionForm(data=valid_form_data(porcentaje_descuento='-5'))
        self.assertFalse(form.is_valid())
        self.assertIn('porcentaje_descuento', form.errors)

    def test_porcentaje_mayor_cien_invalido(self):
        form = PromocionForm(data=valid_form_data(porcentaje_descuento='101'))
        self.assertFalse(form.is_valid())
        self.assertIn('porcentaje_descuento', form.errors)

    def test_porcentaje_uno_valido(self):
        form = PromocionForm(data=valid_form_data(porcentaje_descuento='1'))
        self.assertTrue(form.is_valid(), form.errors)

    def test_porcentaje_cien_valido(self):
        form = PromocionForm(data=valid_form_data(porcentaje_descuento='100'))
        self.assertTrue(form.is_valid(), form.errors)

    def test_porcentaje_decimal_dos_cifras_valido(self):
        form = PromocionForm(data=valid_form_data(porcentaje_descuento='15.50'))
        self.assertTrue(form.is_valid(), form.errors)

    def test_porcentaje_tres_decimales_invalido(self):
        form = PromocionForm(data=valid_form_data(porcentaje_descuento='15.555'))
        self.assertFalse(form.is_valid())
        self.assertIn('porcentaje_descuento', form.errors)


class PromocionFormFechasTest(TestCase):

    def test_fechas_validas(self):
        form = PromocionForm(data=valid_form_data(
            fecha_inicio=str(date.today()),
            fecha_fin=str(date.today() + timedelta(days=30)),
        ))
        self.assertTrue(form.is_valid(), form.errors)

    def test_fecha_fin_anterior_inicio_invalida(self):
        form = PromocionForm(data=valid_form_data(
            fecha_inicio=str(date.today()),
            fecha_fin=str(date.today() - timedelta(days=1)),
        ))
        self.assertFalse(form.is_valid())
        self.assertIn('fecha_fin', form.errors)

    def test_duracion_mayor_anio_invalida(self):
        form = PromocionForm(data=valid_form_data(
            fecha_inicio=str(date.today()),
            fecha_fin=str(date.today() + timedelta(days=366)),
        ))
        self.assertFalse(form.is_valid())
        self.assertIn('fecha_fin', form.errors)

    def test_fecha_inicio_mas_doce_meses_futuro_invalida(self):
        form = PromocionForm(data=valid_form_data(
            fecha_inicio=str(date.today() + timedelta(days=400)),
            fecha_fin=str(date.today() + timedelta(days=410)),
        ))
        self.assertFalse(form.is_valid())
        self.assertIn('fecha_inicio', form.errors)

    def test_fecha_fin_mismo_dia_inicio_valida(self):
        hoy = str(date.today())
        form = PromocionForm(data=valid_form_data(fecha_inicio=hoy, fecha_fin=hoy))
        self.assertTrue(form.is_valid(), form.errors)


class PromocionFormDescripcionTest(TestCase):

    def test_descripcion_vacia_valida(self):
        form = PromocionForm(data=valid_form_data(descripcion=''))
        self.assertTrue(form.is_valid(), form.errors)

    def test_descripcion_quinientos_caracteres_valida(self):
        form = PromocionForm(data=valid_form_data(descripcion='X' * 500))
        self.assertTrue(form.is_valid(), form.errors)

    def test_descripcion_quinientos_uno_invalida(self):
        form = PromocionForm(data=valid_form_data(descripcion='X' * 501))
        self.assertFalse(form.is_valid())
        self.assertIn('descripcion', form.errors)


# ═══════════════════════════════════════════════════════
# VISTAS
# ═══════════════════════════════════════════════════════

class PromocionListaViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.promo = make_promocion()
        self.url = reverse('promociones:lista')

    def test_requiere_login(self):
        self.client.logout()
        resp = self.client.get(self.url)
        self.assertNotEqual(resp.status_code, 200)

    def test_get_ok(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'promociones/lista.html')

    def test_contexto_incluye_form(self):
        resp = self.client.get(self.url)
        self.assertIn('form', resp.context)
        self.assertIsInstance(resp.context['form'], PromocionForm)

    def test_lista_muestra_promocion(self):
        resp = self.client.get(self.url)
        self.assertIn(self.promo, resp.context['promociones'])

    def test_filtro_q_por_nombre(self):
        make_promocion(nombre='Oferta Especial')
        resp = self.client.get(self.url, {'q': 'Oferta'})
        nombres = [p.nombre for p in resp.context['promociones']]
        self.assertIn('Oferta Especial', nombres)
        self.assertNotIn('Promo Test', nombres)

    def test_filtro_activa_si(self):
        make_promocion(nombre='Inactiva', activa=False)
        resp = self.client.get(self.url, {'activa': 'si'})
        for p in resp.context['promociones']:
            self.assertTrue(p.activa)

    def test_filtro_activa_no(self):
        make_promocion(nombre='Inactiva', activa=False)
        resp = self.client.get(self.url, {'activa': 'no'})
        for p in resp.context['promociones']:
            self.assertFalse(p.activa)

    def test_orden_nombre_asc(self):
        make_promocion(nombre='Alfa')
        make_promocion(nombre='Zeta')
        resp = self.client.get(self.url, {'orden': 'nombre_asc'})
        nombres = [p.nombre for p in resp.context['promociones']]
        self.assertEqual(nombres, sorted(nombres))

    def test_orden_descuento_desc(self):
        make_promocion(nombre='Baja', porcentaje_descuento=Decimal('5'))
        make_promocion(nombre='Alta', porcentaje_descuento=Decimal('80'))
        resp = self.client.get(self.url, {'orden': 'desc_desc'})
        descuentos = [p.porcentaje_descuento for p in resp.context['promociones']]
        self.assertEqual(descuentos, sorted(descuentos, reverse=True))


class PromocionCrearViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.url = reverse('promociones:crear')
        self.lista_url = reverse('promociones:lista')

    def test_get_renderiza_formulario(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'promociones/form.html')

    def test_post_valido_crea_y_redirige(self):
        resp = self.client.post(self.url, valid_form_data(nombre='Nueva Promo'))
        self.assertRedirects(resp, self.lista_url)
        self.assertTrue(Promocion.objects.filter(nombre='Nueva Promo').exists())

    def test_post_invalido_renderiza_form_con_error(self):
        resp = self.client.post(self.url, valid_form_data(nombre=''))
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'promociones/form.html')
        self.assertFalse(Promocion.objects.filter(nombre='').exists())

    def test_requiere_login(self):
        self.client.logout()
        resp = self.client.get(self.url)
        self.assertNotEqual(resp.status_code, 200)


class PromocionEditarViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.promo = make_promocion()
        self.url = reverse('promociones:editar', args=[self.promo.pk])
        self.lista_url = reverse('promociones:lista')

    def test_get_redirige_a_lista(self):
        resp = self.client.get(self.url)
        self.assertRedirects(resp, self.lista_url)

    def test_post_valido_actualiza_y_redirige(self):
        resp = self.client.post(self.url, valid_form_data(nombre='Promo Actualizada'))
        self.assertRedirects(resp, self.lista_url)
        self.promo.refresh_from_db()
        self.assertEqual(self.promo.nombre, 'Promo Actualizada')

    def test_post_invalido_redirige_sin_cambios(self):
        resp = self.client.post(self.url, valid_form_data(nombre=''))
        self.assertRedirects(resp, self.lista_url)
        self.promo.refresh_from_db()
        self.assertEqual(self.promo.nombre, 'Promo Test')

    def test_pk_inexistente_retorna_404(self):
        import uuid
        url = reverse('promociones:editar', args=[uuid.uuid4()])
        resp = self.client.post(url, valid_form_data())
        self.assertEqual(resp.status_code, 404)


class PromocionEliminarViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.promo = make_promocion()
        self.url = reverse('promociones:eliminar', args=[self.promo.pk])
        self.lista_url = reverse('promociones:lista')

    def test_get_muestra_confirmacion(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 200)
        self.assertTemplateUsed(resp, 'promociones/confirmar_eliminar.html')

    def test_post_elimina_y_redirige(self):
        resp = self.client.post(self.url)
        self.assertRedirects(resp, self.lista_url)
        self.assertFalse(Promocion.objects.filter(pk=self.promo.pk).exists())

    def test_pk_inexistente_retorna_404(self):
        import uuid
        url = reverse('promociones:eliminar', args=[uuid.uuid4()])
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 404)


class PromocionToggleActivaViewTest(TestCase):

    def setUp(self):
        self.user = User.objects.create_user(username='tester', password='pass123')
        self.client.force_login(self.user)
        self.promo = make_promocion(activa=True)
        self.url = reverse('promociones:toggle_activa', args=[self.promo.pk])

    def test_post_devuelve_json_ok(self):
        resp = self.client.post(self.url)
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        self.assertTrue(data['ok'])

    def test_activa_pasa_a_false(self):
        resp = self.client.post(self.url)
        data = resp.json()
        self.assertFalse(data['activa'])
        self.promo.refresh_from_db()
        self.assertFalse(self.promo.activa)

    def test_inactiva_pasa_a_true(self):
        self.promo.activa = False
        self.promo.save(update_fields=['activa'])
        resp = self.client.post(self.url)
        data = resp.json()
        self.assertTrue(data['activa'])

    def test_get_retorna_405(self):
        resp = self.client.get(self.url)
        self.assertEqual(resp.status_code, 405)

    def test_requiere_login(self):
        self.client.logout()
        resp = self.client.post(self.url)
        self.assertNotEqual(resp.status_code, 200)

    def test_pk_inexistente_retorna_404(self):
        import uuid
        url = reverse('promociones:toggle_activa', args=[uuid.uuid4()])
        resp = self.client.post(url)
        self.assertEqual(resp.status_code, 404)

