// Función para inicializar las validaciones en tiempo real
function inicializarValidacionesUsuario() {

    const form = document.getElementById('form-crear-usuario');
    const btnGuardar = document.getElementById('btnGuardarUsuario');

    if (!form || !btnGuardar) return;

    /* ===============================
       INICIO: BOTÓN DESHABILITADO
    =============================== */
    btnGuardar.disabled = true;
    btnGuardar.classList.remove('btn-dark');
    btnGuardar.classList.add('btn-secondary');

    /* ===============================
       FUNCIONES VISUALES
    =============================== */
    function invalido(input, mensaje) {
        input.classList.add('is-invalid');
        input.classList.remove('is-valid');
        let feedback = input.nextElementSibling;
        
        // Si el siguiente elemento no es un feedback, buscar o crear uno
        if (!feedback || !feedback.classList.contains('invalid-feedback')) {
            // Buscar si ya existe un invalid-feedback después
            feedback = input.parentElement.querySelector('.invalid-feedback');
            if (!feedback) {
                feedback = document.createElement('div');
                feedback.className = 'invalid-feedback';
                input.parentElement.appendChild(feedback);
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
            'tipo_documento',
            'documento',
            'email',
            'first_name',
            'last_name',
            'password1',
            'password2',
            'rol'
        ];

        let habilitar = true;

        obligatorios.forEach(id => {
            const campo = document.getElementById(id);
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
            btnGuardar.classList.remove('btn-dark');
            btnGuardar.classList.add('btn-secondary');
        } else {
            btnGuardar.classList.remove('btn-secondary');
            btnGuardar.classList.add('btn-dark');
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

            const userIdEl = document.getElementById('user_id');
            const userId = userIdEl ? userIdEl.value : '';

            let url = `/auth/validar-documento/?numero=${encodeURIComponent(valor)}`;
            if (userId) {
                url += `&user_id=${encodeURIComponent(userId)}`;
            }

            try {
                const res = await fetch(url, { signal: docAbort.signal });
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const data = await res.json();

                if (!data.valido) invalido(input, data.mensaje);
                else valido(input);

            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.error('Error en validación de documento:', e);
                    // Si hay un error de red, simplemente marcamos como válido para no bloquear
                    valido(input);
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

            // Validación básica: debe contener @ y un punto después del @
            if (!valor.includes('@') || !valor.split('@')[1]?.includes('.')) {
                invalido(input, 'Correo electrónico inválido.');
                actualizarEstadoBoton();
                return;
            }

            const userIdEl = document.getElementById('user_id');
            const userId = userIdEl ? userIdEl.value : '';

            let url = `/auth/validar-email/?email=${encodeURIComponent(valor)}`;
            if (userId) {
                url += `&user_id=${encodeURIComponent(userId)}`;
            }

            try {
                const res = await fetch(url, { signal: emailAbort.signal });
                
                if (!res.ok) {
                    throw new Error(`HTTP error! status: ${res.status}`);
                }
                
                const data = await res.json();

                if (!data.valido) invalido(input, data.mensaje);
                else valido(input);

            } catch (e) {
                if (e.name !== 'AbortError') {
                    console.error('Error en validación de email:', e);
                    // Si hay un error de red, simplemente marcamos como válido para no bloquear
                    valido(input);
                }
            }

            actualizarEstadoBoton();

        }, 300);
    }

    /* ===============================
       VALIDACIÓN CONTRASEÑAS
    =============================== */
    function validarPassword(input) {
        const valor = input.value;

        if (!valor) {
            invalido(input, 'La contraseña es obligatoria.');
            return false;
        }

        if (valor.length < 8) {
            invalido(input, 'Mínimo 8 caracteres.');
            return false;
        }

        if (!/[A-Z]/.test(valor)) {
            invalido(input, 'Debe contener al menos una mayúscula.');
            return false;
        }

        if (!/[a-z]/.test(valor)) {
            invalido(input, 'Debe contener al menos una minúscula.');
            return false;
        }

        if (!/[0-9]/.test(valor)) {
            invalido(input, 'Debe contener al menos un número.');
            return false;
        }

        valido(input);
        return true;
    }

    function validarPasswordConfirmacion() {
        const password1 = document.getElementById('password1');
        const password2 = document.getElementById('password2');

        if (!password2.value) {
            limpiar(password2);
            return;
        }

        if (password1.value !== password2.value) {
            invalido(password2, 'Las contraseñas no coinciden.');
        } else {
            valido(password2);
        }
    }

    /* ===============================
       EVENTOS INPUT
    =============================== */
    form.addEventListener('input', function (e) {

        const input = e.target;
        const valor = (input.value || '').trim();

        /* DOCUMENTO */
        if (input.id === 'documento') {
            if (!valor) {
                limpiar(input);
                actualizarEstadoBoton();
                return;
            }
            validarDocumentoEnVivo(valor, input);
            return;
        }

        /* EMAIL */
        if (input.id === 'email') {
            if (!valor) {
                invalido(input, 'El correo electrónico es obligatorio.');
                actualizarEstadoBoton();
                return;
            }
            validarEmailEnVivo(valor, input);
            return;
        }

        /* NOMBRE */
        if (input.id === 'first_name') {
            const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

            if (!valor) invalido(input, 'El nombre es obligatorio.');
            else if (!regex.test(valor)) invalido(input, 'Solo letras.');
            else if (valor.length > 150) invalido(input, 'Máximo 150 caracteres.');
            else valido(input);

            actualizarEstadoBoton();
        }

        /* APELLIDO */
        if (input.id === 'last_name') {
            const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

            if (!valor) invalido(input, 'El apellido es obligatorio.');
            else if (!regex.test(valor)) invalido(input, 'Solo letras.');
            else if (valor.length > 150) invalido(input, 'Máximo 150 caracteres.');
            else valido(input);

            actualizarEstadoBoton();
        }

        /* TELÉFONO */
        if (input.id === 'telefono') {

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

        /* CONTRASEÑA 1 */
        if (input.id === 'password1') {
            validarPassword(input);
            // También revalidar password2 si ya tiene valor
            const password2 = document.getElementById('password2');
            if (password2 && password2.value) {
                validarPasswordConfirmacion();
            }
            actualizarEstadoBoton();
        }

        /* CONTRASEÑA 2 */
        if (input.id === 'password2') {
            validarPasswordConfirmacion();
            actualizarEstadoBoton();
        }
    });

    /* SELECT tipo documento */
    const tipoDoc = document.getElementById('tipo_documento');
    if (tipoDoc) {
        tipoDoc.addEventListener('change', function () {
            if (!this.value.trim()) limpiar(this);
            else valido(this);
            actualizarEstadoBoton();
        });
    }

    /* SELECT rol */
    const rol = document.getElementById('rol');
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
document.addEventListener('DOMContentLoaded', inicializarValidacionesUsuario);

// También exportar para poder llamarla cuando se cargue el modal dinámicamente
if (typeof window !== 'undefined') {
    window.inicializarValidacionesUsuario = inicializarValidacionesUsuario;
}
