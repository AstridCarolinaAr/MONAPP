document.addEventListener('DOMContentLoaded', () => {
    const precioInput = document.querySelector('.precio-formateado');
    if (!precioInput) return;

    let timeout;

    precioInput.addEventListener('input', () => {
        // solo números
        let valor = precioInput.value.replace(/[^\d]/g, '');

        if (valor === '') {
            precioInput.value = '';
            return;
        }

        // separador de miles
        const conPuntos = valor.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

        // mostrar
        precioInput.value = conPuntos;

        // animación
        precioInput.classList.add('precio-activo');
        precioInput.classList.remove('precio-pulse');
        void precioInput.offsetWidth;
        precioInput.classList.add('precio-pulse');

        clearTimeout(timeout);
        timeout = setTimeout(() => {
            precioInput.classList.remove('precio-activo');
        }, 400);
    });

    // limpiar antes de enviar (Django necesita número limpio)
    precioInput.closest('form').addEventListener('submit', () => {
        precioInput.value = precioInput.value.replace(/[^\d]/g, '');
    });
});

document.addEventListener('DOMContentLoaded', () => {
    const form = document.querySelector('form');
    const btnGuardar = document.getElementById('btnGuardarProducto');

    if (!form || !btnGuardar) return;

    const camposRequeridos = form.querySelectorAll(
        'input[required], select[required], textarea[required]'
    );

    function validarFormulario() {
        let valido = true;

        camposRequeridos.forEach(campo => {
            if (!campo.value || campo.value.trim() === '') {
                valido = false;
            }
        });

        btnGuardar.disabled = !valido;
        btnGuardar.classList.toggle('btn-disabled', !valido);
    }

    // Validar al escribir / cambiar
    camposRequeridos.forEach(campo => {
        campo.addEventListener('input', validarFormulario);
        campo.addEventListener('change', validarFormulario);
    });

    // Validación inicial
    validarFormulario();
});
