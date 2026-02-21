// JavaScript para búsqueda en tiempo real de proveedores
document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-proveedor');
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            const query = this.value.toLowerCase();
            const rows = document.querySelectorAll('#proveedores-tbody tr');
            rows.forEach(row => {
                const nombre = row.getAttribute('data-nombre');
                row.style.display = nombre.includes(query) ? '' : 'none';
            });
        });
    }

    // JavaScript para confirmación de eliminación (mejor que inline onclick)
    document.querySelectorAll('a[data-confirm]').forEach(link => {
        link.addEventListener('click', function(e) {
            if (!confirm(this.getAttribute('data-confirm'))) {
                e.preventDefault();
            }
        });
    });
});
document.addEventListener('DOMContentLoaded', function() {
    // Activar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Máscaras de entrada con Inputmask
    if (typeof Inputmask !== 'undefined') {
        Inputmask({ mask: '999.999.999-9', placeholder: ' ' }).mask('#id_nit'); // NIT colombiano
        Inputmask({ mask: '(999) 999-9999', placeholder: ' ' }).mask('#id_telefono_proveedor'); // Teléfono
    }

    // Validación en tiempo real básica (ejemplo para campos requeridos)
    const requiredFields = document.querySelectorAll('.form-proveedor [required]');
    requiredFields.forEach(field => {
        field.addEventListener('blur', function() {
            if (!this.value.trim()) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });
    });

    // Validación de email básica
    const emailField = document.getElementById('id_correo_proveedor');
    if (emailField) {
        emailField.addEventListener('blur', function() {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(this.value)) {
                this.classList.add('is-invalid');
            } else {
                this.classList.remove('is-invalid');
            }
        });
    }
});
fetch(form.action, {
    method: "POST",
    body: new FormData(form),
    headers: {
        "X-Requested-With": "XMLHttpRequest"
    }
})
.then(res => res.json())
.then(data => {

    if (data.success) {
        window.location.href = data.redirect_url;  // ← AQUÍ está la clave
    } else {
        modalBody.innerHTML = data.html;
    }

});