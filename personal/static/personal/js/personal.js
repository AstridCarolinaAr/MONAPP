// Función para inicializar las validaciones en tiempo real
function inicializarValidacionesPersonal() {

    const form = document.getElementById('form-crear-personal') || document.getElementById('form-editar-personal');
    const btnGuardar = document.getElementById('btnGuardarPersonal');

    if (!form || !btnGuardar) return;

    /* ===============================
       INICIO: BOTÓN DESHABILITADO
    =============================== */
    btnGuardar.disabled = true;
    btnGuardar.classList.remove('personal-btn-dark');
    btnGuardar.classList.add('personal-btn-secondary');

    /* ===============================
       FUNCIONES VISUALES
    =============================== */
    function invalido(input, mensaje) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        let feedback = input.nextElementSibling;
        
        // Si el siguiente elemento no es un feedback o es un small, buscar o crear uno
        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            // Saltar el elemento small si existe
            if (feedback && feedback.tagName === 'SMALL') {
                feedback = feedback.nextElementSibling;
            }
            if (!feedback || !feedback.classList.contains('invalid-feedback')) {
                feedback = input.parentElement.querySelector('.invalid-feedback');
                if (!feedback) {
                    feedback = document.createElement('div');
                    feedback.className = 'invalid-feedback';
                    feedback.style.cssText = 'color: #c7412b; font-size: 0.85rem; margin-top: 6px; display: block;';
                    // Insertar después del small si existe
                    const small = input.parentElement.querySelector('small');
                    if (small) {
                        small.parentNode.insertBefore(feedback, small.nextSibling);
                    } else {
                        input.parentElement.appendChild(feedback);
                    }
                }
            }
        }
        
        feedback.textContent = mensaje;
        feedback.style.display = 'block';
    }

    function valido(input) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        const feedback = input.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.style.display = 'none';
        }
    }

    function limpiar(input) {
        input.classList.remove('is-invalid', 'is-valid');
        const feedback = input.parentElement.querySelector('.invalid-feedback');
        if (feedback) {
            feedback.textContent = '';
            feedback.style.display = 'none';
        }
    }

    /* ===============================
       ESTADO DEL BOTÓN
    =============================== */
    function actualizarEstadoBoton() {

        const obligatorios = [
            'numero_documento',
            'nombres',
            'apellidos',
            'rol'
        ];

        let habilitar = true;

        obligatorios.forEach(id => {
            const campo = document.getElementById('id_' + id);
            if (!campo) {
                habilitar = false;
                return;
            }

            const valor = (campo.value || '').trim();

            if (valor === '') habilitar = false;
            if (!campo.classList.contains('is-valid')) habilitar = false;
            if (campo.classList.contains('is-invalid')) habilitar = false;
        });

        btnGuardar.disabled = !habilitar;

        if (btnGuardar.disabled) {
            btnGuardar.classList.remove('personal-btn-dark');
            btnGuardar.classList.add('personal-btn-secondary');
        } else {
            btnGuardar.classList.remove('personal-btn-secondary');
            btnGuardar.classList.add('personal-btn-dark');
        }
    }

    /* ===============================
       VALIDACIÓN DOCUMENTO EN VIVO
    =============================== */
    let docTimer = null;
    let docAbort = null;

    function validarDocumentoEnVivo(valor, input) {

        if (docTimer) clearTimeout(docTimer);
        if (docAbort) docAbort.abort();

        docAbort = new AbortController();

        docTimer = setTimeout(async () => {

            if (!/^\d+$/.test(valor)) {
                invalido(input, 'Solo números.');
                actualizarEstadoBoton();
                return;
            }

            if (valor.length < 6 || valor.length > 12) {
                invalido(input, 'Debe tener entre 6 y 12 dígitos.');
                actualizarEstadoBoton();
                return;
            }

            const personalId = form.dataset.personalId || '';

            let url = `/personal/validar-documento/?numero=${encodeURIComponent(valor)}`;
            if (personalId) {
                url += `&personal_id=${encodeURIComponent(personalId)}`;
            }

            try {
                const res = await fetch(url, { signal: docAbort.signal });
                const data = await res.json();

                if (!data.valido) invalido(input, data.mensaje);
                else valido(input);

            } catch (e) {
                if (e.name !== 'AbortError') {
                    invalido(input, 'Error validando documento.');
                }
            }

            actualizarEstadoBoton();

        }, 300);
    }

    /* ===============================
       VALIDACIÓN EMAIL EN VIVO
    =============================== */
    let emailTimer = null;
    let emailAbort = null;

    function validarEmailEnVivo(valor, input) {

        if (emailTimer) clearTimeout(emailTimer);
        if (emailAbort) emailAbort.abort();

        emailAbort = new AbortController();

        emailTimer = setTimeout(async () => {

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            
            if (!emailRegex.test(valor)) {
                invalido(input, 'Correo electrónico inválido.');
                actualizarEstadoBoton();
                return;
            }

            const personalId = form.dataset.personalId || '';

            let url = `/personal/validar-email/?email=${encodeURIComponent(valor)}`;
            if (personalId) {
                url += `&personal_id=${encodeURIComponent(personalId)}`;
            }

            try {
                const res = await fetch(url, { signal: emailAbort.signal });
                const data = await res.json();

                if (!data.valido) invalido(input, data.mensaje);
                else valido(input);

            } catch (e) {
                if (e.name !== 'AbortError') {
                    invalido(input, 'Error validando email.');
                }
            }

            actualizarEstadoBoton();

        }, 300);
    }

    /* ===============================
       EVENTOS INPUT
    =============================== */
    form.addEventListener('input', function (e) {

        const input = e.target;
        const valor = (input.value || '').trim();

        /* DOCUMENTO */
        if (input.id === 'id_numero_documento') {
            if (!valor) {
                limpiar(input);
                actualizarEstadoBoton();
                return;
            }
            validarDocumentoEnVivo(valor, input);
            return;
        }

        /* NOMBRES */
        if (input.id === 'id_nombres') {
            const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

            if (!valor) invalido(input, 'Los nombres son obligatorios.');
            else if (!regex.test(valor)) invalido(input, 'Solo letras.');
            else if (valor.length > 150) invalido(input, 'Máximo 150 caracteres.');
            else valido(input);

            actualizarEstadoBoton();
        }

        /* APELLIDOS */
        if (input.id === 'id_apellidos') {
            const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

            if (!valor) invalido(input, 'Los apellidos son obligatorios.');
            else if (!regex.test(valor)) invalido(input, 'Solo letras.');
            else if (valor.length > 150) invalido(input, 'Máximo 150 caracteres.');
            else valido(input);

            actualizarEstadoBoton();
        }

        /* CORREO */
        if (input.id === 'id_correo') {
            if (!valor) {
                limpiar(input);
                actualizarEstadoBoton();
                return;
            }
            validarEmailEnVivo(valor, input);
            return;
        }

        /* TELÉFONO */
        if (input.id === 'id_telefono') {

            if (!valor) {
                limpiar(input);
            } else if (!/^\d+$/.test(valor)) {
                invalido(input, 'Solo números.');
            } else if (valor.length !== 10) {
                invalido(input, 'Debe tener 10 dígitos.');
            } else {
                valido(input);
            }

            actualizarEstadoBoton();
        }
    });

    /* SELECT rol */
    const rol = document.getElementById('id_rol');
    if (rol) {
        rol.addEventListener('change', function () {
            if (!this.value.trim()) {
                invalido(this, 'El rol es obligatorio.');
            } else {
                valido(this);
            }
            actualizarEstadoBoton();
        });
    }

}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', inicializarValidacionesPersonal);

// También exportar para poder llamarla cuando se cargue el modal dinámicamente
if (typeof window !== 'undefined') {
    window.inicializarValidacionesPersonal = inicializarValidacionesPersonal;
}
