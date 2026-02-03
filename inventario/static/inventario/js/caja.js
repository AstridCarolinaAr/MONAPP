// Script para el módulo de Caja

document.addEventListener('DOMContentLoaded', function() {
    // Validación del formulario
    const form = document.getElementById('transaccionForm');
    
    if (form) {
        form.addEventListener('submit', function(e) {
            const monto = document.querySelector('input[name="monto"]').value;
            const motivo = document.querySelector('textarea[name="motivo"]').value;
            
            if (!monto || parseFloat(monto) <= 0) {
                e.preventDefault();
                alert('Por favor, ingrese un monto válido mayor a 0.');
                return false;
            }
            
            if (!motivo.trim()) {
                e.preventDefault();
                alert('Por favor, ingrese un motivo para la transacción.');
                return false;
            }
        });
    }
    
    // Auto-cerrar alertas después de 5 segundos
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(function(alert) {
        setTimeout(function() {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
        }, 5000);
    });
    
    // Formatear números en la tabla
    const montos = document.querySelectorAll('td strong');
    montos.forEach(function(monto) {
        const valor = parseFloat(monto.textContent.replace('$', '').replace(',', ''));
        if (!isNaN(valor)) {
            monto.textContent = '$' + valor.toLocaleString('es-MX', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        }
    });
    
    // Efecto de confirmación al exportar
    const btnExportar = document.querySelector('a[href*="exportar"]');
    if (btnExportar) {
        btnExportar.addEventListener('click', function(e) {
            // Solo mostrar mensaje, no prevenir el comportamiento predeterminado
            console.log('Exportando reporte...');
        });
    }
});

// Función para actualizar la página automáticamente cada 30 segundos (opcional)
// setInterval(function() {
//     location.reload();
// }, 30000);
