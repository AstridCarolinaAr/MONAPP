from django.test import TestCase
from django.core.exceptions import ValidationError
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
