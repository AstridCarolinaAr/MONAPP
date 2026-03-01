document.addEventListener('DOMContentLoaded', function () {

    const modal = document.getElementById('modalCrearCliente');
    const btnGuardar = document.getElementById('btnGuardarCliente');

    if (!modal || !btnGuardar) return;

    const form = modal.querySelector('form');

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
        const feedback = input.nextElementSibling;
        if (feedback) feedback.textContent = mensaje;
    }

    function valido(input) {
        input.classList.remove('is-invalid');
        input.classList.add('is-valid');
        const feedback = input.nextElementSibling;
        if (feedback) feedback.textContent = '';
    }

    function limpiar(input) {
        input.classList.remove('is-invalid', 'is-valid');
        const feedback = input.nextElementSibling;
        if (feedback) feedback.textContent = '';
    }

    /* ===============================
       ESTADO DEL BOTÓN
    =============================== */
    function actualizarEstadoBoton() {

        const obligatorios = [
            'tipo_documento',
            'numero_documento',
            'nombre',
            'apellido',
            'fecha_nacimiento'
        ];

        let habilitar = true;

        obligatorios.forEach(id => {
            const campo = document.getElementById(id);
            if (!campo) habilitar = false;

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

            if (valor.length < 6 || valor.length > 12) {
                invalido(input, 'Debe tener entre 6 y 12 dígitos.');
                actualizarEstadoBoton();
                return;
            }

            const clienteIdEl = document.getElementById('cliente_id');
            const clienteId = clienteIdEl ? clienteIdEl.value : '';

            let url = `/clientes/validar-documento/?numero=${encodeURIComponent(valor)}`;
            if (clienteId) {
                url += `&cliente_id=${encodeURIComponent(clienteId)}`;
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
       EVENTOS INPUT
    =============================== */
    form.addEventListener('input', function (e) {

        const input = e.target;
        const valor = (input.value || '').trim();

        /* DOCUMENTO */
        if (input.id === 'numero_documento') {
            if (!valor) {
                limpiar(input);
                actualizarEstadoBoton();
                return;
            }
            validarDocumentoEnVivo(valor, input);
            return;
        }

        /* NOMBRE / APELLIDO */
        if (input.id === 'nombre' || input.id === 'apellido') {

            const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

            if (!valor) invalido(input, 'Campo obligatorio.');
            else if (!regex.test(valor)) invalido(input, 'Solo letras.');
            else valido(input);

            actualizarEstadoBoton();
        }

        /* TELÉFONO */
        if (input.id === 'telefono') {

            if (!valor) limpiar(input);
            else if (!/^\d+$/.test(valor)) invalido(input, 'Solo números.');
            else if (valor.length !== 10) invalido(input, 'Debe tener 10 dígitos.');
            else valido(input);

            actualizarEstadoBoton();
        }

        /* CORREO */
        if (input.id === 'correo') {

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!valor) limpiar(input);
            else if (!emailRegex.test(valor)) invalido(input, 'Correo inválido.');
            else valido(input);

            actualizarEstadoBoton();
        }
    });

    /* ===============================
       VALIDACIÓN TIPO DOCUMENTO (SELECT)
    =============================== */
    const tipoDocumentoSelect = document.getElementById('tipo_documento');
    
    if (tipoDocumentoSelect) {
        tipoDocumentoSelect.addEventListener('change', function() {
            const feedback = this.nextElementSibling;
            
            if (this.value.trim() === '') {
                limpiar(this, feedback);
            } else {
                valido(this, feedback);
            }
            
            actualizarEstadoBoton();
        });
    }


    /* ===============================
       LIMPIAR TODO AL CERRAR MODAL
    =============================== */

    /* FECHA */
    const fecha = document.getElementById('fecha_nacimiento');
    if (fecha) {
        fecha.addEventListener('change', function () {
            const hoy = new Date().toISOString().split('T')[0];
            if (!this.value) limpiar(this);
            else if (this.value > hoy) invalido(this, 'No puede ser futura.');
            else valido(this);
            actualizarEstadoBoton();
        });
    }

    /* LIMPIAR MODAL */
    modal.addEventListener('hidden.bs.modal', function () {
        form.reset();
        form.querySelectorAll('input, select').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
        });
        btnGuardar.disabled = true;
        btnGuardar.classList.remove('btn-dark');
        btnGuardar.classList.add('btn-secondary');
    });

});

/* ===============================
   CONFIRMAR GESTIÓN
=============================== */
document.addEventListener("DOMContentLoaded", function () {
    if (!window.mostrarModalGestion) return;

    const confirmar = confirm(
        "¿Deseas añadir un tratamiento de datos a este cliente recién creado?"
    );

    if (confirmar) {
        window.location.href =
            `/servicios/gestion-alisados/crear/?cliente=${window.clienteCreadoId}`;
    }
});

/* ===============================
   CONTROL ELIMINAR
=============================== */
document.addEventListener("DOMContentLoaded", function () {

    document.querySelectorAll(".btn-eliminar[data-control-eliminar]")
        .forEach(btn => {

            btn.addEventListener("click", function (e) {

                const esAdmin = this.dataset.esAdmin === "true";
                const modalId = this.dataset.modalId;

                if (esAdmin) {
                    const modalEl = document.getElementById(modalId);
                    if (!modalEl) return;
                    new bootstrap.Modal(modalEl).show();
                } else {
                    e.preventDefault();

                    const modal = document.getElementById("modalAccionNoPermitida");
                    if (!modal) return;

                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();

                    setTimeout(() => {
                        bsModal.hide();
                        document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
                        document.body.classList.remove("modal-open");
                    }, 3500);
                }
            });

        });
});