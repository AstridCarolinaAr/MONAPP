document.addEventListener('DOMContentLoaded', function () {
    /* =========================================================
       UTILIDADES
    ========================================================= */
    function setButtonState(button, enabled) {
        if (!button) return;

        button.disabled = !enabled;

        if (enabled) {
            button.classList.remove('btn-secondary');
            button.classList.add('btn-dark');
        } else {
            button.classList.remove('btn-dark');
            button.classList.add('btn-secondary');
        }
    }

    function invalido(input, mensaje) {
        if (!input) return;

        input.classList.add('is-invalid');
        input.classList.remove('is-valid');

        const feedback = input.nextElementSibling;
        if (feedback) feedback.textContent = mensaje || '';
    }

    function valido(input) {
        if (!input) return;

        input.classList.remove('is-invalid');
        input.classList.add('is-valid');

        const feedback = input.nextElementSibling;
        if (feedback) feedback.textContent = '';
    }

    function limpiar(input) {
        if (!input) return;

        input.classList.remove('is-invalid', 'is-valid');

        const feedback = input.nextElementSibling;
        if (feedback) feedback.textContent = '';
    }

    function limpiarFormulario(form) {
        if (!form) return;

        form.reset();

        form.querySelectorAll('input, select, textarea').forEach(el => {
            el.classList.remove('is-valid', 'is-invalid');
            const feedback = el.nextElementSibling;
            if (feedback) feedback.textContent = '';
        });
    }

    /* =========================================================
       INICIALIZADOR FORMULARIO CLIENTE CON VALIDACIÓN EN TIEMPO REAL
    ========================================================= */
    function initClienteForm(config) {
        const modal = document.getElementById(config.modalId);
        const form = document.getElementById(config.formId);
        const btnGuardar = document.getElementById(config.buttonId);

        if (!modal || !form || !btnGuardar) return;

        const obligatorios = config.requiredIds;
        const opcionales = config.optionalIds;

        const tipoDocumento = document.getElementById(config.fields.tipoDocumento);
        const numeroDocumento = document.getElementById(config.fields.numeroDocumento);
        const nombre = document.getElementById(config.fields.nombre);
        const apellido = document.getElementById(config.fields.apellido);
        const fechaNacimiento = document.getElementById(config.fields.fechaNacimiento);
        const telefono = document.getElementById(config.fields.telefono);
        const correo = document.getElementById(config.fields.correo);

        setButtonState(btnGuardar, false);

        function esCampoValido(input) {
            if (!input) return false;

            const id = input.id;
            const valor = (input.value || '').trim();
            const esObligatorio = obligatorios.includes(id);

            if (!esObligatorio && valor === '') return true;
            if (esObligatorio && valor === '') return false;

            if (id === config.fields.tipoDocumento) {
                return valor !== '';
            }

            if (id === config.fields.numeroDocumento) {
                return /^\d{6,12}$/.test(valor) &&
                    input.classList.contains('is-valid') &&
                    !input.classList.contains('is-invalid');
            }

            if (id === config.fields.nombre || id === config.fields.apellido) {
                return /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/.test(valor);
            }

            if (id === config.fields.fechaNacimiento) {
                const fecha = new Date(input.value + 'T00:00:00');
                const hoy = new Date();
                hoy.setHours(0, 0, 0, 0);
                return fecha <= hoy;
            }

            if (id === config.fields.telefono) {
                return /^\d{10}$/.test(valor);
            }

            if (id === config.fields.correo) {
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
            }

            return true;
        }

        function actualizarEstadoBoton() {
            const obligatoriosValidos = obligatorios.every(id => {
                const campo = document.getElementById(id);
                return esCampoValido(campo);
            });

            const opcionalesValidos = opcionales.every(id => {
                const campo = document.getElementById(id);
                if (!campo) return true;

                const valor = (campo.value || '').trim();
                if (valor === '') return true;

                return esCampoValido(campo);
            });

            setButtonState(btnGuardar, obligatoriosValidos && opcionalesValidos);
        }

        function validarNombreApellido(input) {
            const valor = (input.value || '').trim();
            const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

            if (!valor) {
                invalido(input, 'Campo obligatorio.');
            } else if (!regex.test(valor)) {
                invalido(input, 'Solo letras.');
            } else {
                valido(input);
            }

            actualizarEstadoBoton();
        }

        function validarTelefono(input) {
            const valor = (input.value || '').trim();

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

        function validarCorreo(input) {
            const valor = (input.value || '').trim();
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!valor) {
                limpiar(input);
            } else if (!emailRegex.test(valor)) {
                invalido(input, 'Correo inválido.');
            } else {
                valido(input);
            }

            actualizarEstadoBoton();
        }

        function validarTipoDocumento(input) {
            const valor = (input.value || '').trim();

            if (!valor) {
                limpiar(input);
            } else {
                valido(input);
            }

            actualizarEstadoBoton();
        }

        function validarFechaNacimiento(input) {
            const valor = input.value;

            if (!valor) {
                limpiar(input);
                actualizarEstadoBoton();
                return;
            }

            const fechaSeleccionada = new Date(valor + 'T00:00:00');
            const hoy = new Date();
            hoy.setHours(0, 0, 0, 0);

            if (fechaSeleccionada > hoy) {
                invalido(input, 'No puede ser futura.');
            } else {
                valido(input);
            }

            actualizarEstadoBoton();
        }

        let docTimer = null;
        let docAbort = null;

        function validarDocumentoEnVivo(input) {
            const valor = (input.value || '').trim();

            if (docTimer) clearTimeout(docTimer);
            if (docAbort) docAbort.abort();

            if (!valor) {
                limpiar(input);
                actualizarEstadoBoton();
                return;
            }

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

            docAbort = new AbortController();

            docTimer = setTimeout(async () => {
                try {
                    const res = await fetch(`/clientes/validar-documento/?numero=${encodeURIComponent(valor)}`, {
                        signal: docAbort.signal
                    });

                    const data = await res.json();

                    if (!data.valido) {
                        invalido(input, data.mensaje);
                    } else {
                        valido(input);
                    }
                } catch (e) {
                    if (e.name !== 'AbortError') {
                        invalido(input, 'Error validando documento.');
                    }
                }

                actualizarEstadoBoton();
            }, 300);
        }

        // Validación EN TIEMPO REAL
        form.addEventListener('input', function (e) {
            const input = e.target;
            if (!input || !input.id) return;

            if (input.id === config.fields.numeroDocumento) {
                validarDocumentoEnVivo(input);
                return;
            }

            if (input.id === config.fields.nombre || input.id === config.fields.apellido) {
                validarNombreApellido(input);
                return;
            }

            if (input.id === config.fields.telefono) {
                validarTelefono(input);
                return;
            }

            if (input.id === config.fields.correo) {
                validarCorreo(input);
                return;
            }
        });

        // Validación por cambio
        form.addEventListener('change', function (e) {
            const input = e.target;
            if (!input || !input.id) return;

            if (input.id === config.fields.tipoDocumento) {
                validarTipoDocumento(input);
                return;
            }

            if (input.id === config.fields.fechaNacimiento) {
                validarFechaNacimiento(input);
                return;
            }

            if (input.id === config.fields.numeroDocumento) {
                validarDocumentoEnVivo(input);
                return;
            }

            if (input.id === config.fields.telefono) {
                validarTelefono(input);
                return;
            }

            if (input.id === config.fields.correo) {
                validarCorreo(input);
                return;
            }
        });

        // Validación al salir del campo
        form.addEventListener('blur', function (e) {
            const input = e.target;
            if (!input || !input.id) return;

            if (input.id === config.fields.nombre || input.id === config.fields.apellido) {
                validarNombreApellido(input);
                return;
            }

            if (input.id === config.fields.tipoDocumento) {
                validarTipoDocumento(input);
                return;
            }

            if (input.id === config.fields.fechaNacimiento) {
                validarFechaNacimiento(input);
                return;
            }

            if (input.id === config.fields.telefono) {
                validarTelefono(input);
                return;
            }

            if (input.id === config.fields.correo) {
                validarCorreo(input);
                return;
            }

            if (input.id === config.fields.numeroDocumento) {
                validarDocumentoEnVivo(input);
                return;
            }
        }, true);

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

            const formData = new FormData(form);

            try {
                const response = await fetch('/clientes/crear/', {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    }
                });

                const data = await response.json();

                if (data.success) {
                    const selectClienteGestion = document.getElementById('selectCliente');

                    if (selectClienteGestion) {
                        const option = document.createElement('option');
                        option.value = data.cliente.id;
                        option.textContent = `${data.cliente.nombre} ${data.cliente.apellido} - ${data.cliente.numero_documento}`;
                        option.setAttribute('data-documento', data.cliente.numero_documento);
                        option.selected = true;
                        selectClienteGestion.appendChild(option);
                        selectClienteGestion.dispatchEvent(new Event('change'));
                    }

                    const modalInstance = bootstrap.Modal.getInstance(modal);
                    if (modalInstance) {
                        modalInstance.hide();
                    }

                    limpiarFormulario(form);

                    const alertaErrores = document.getElementById(config.errorAlertId);
                    if (alertaErrores) alertaErrores.classList.add('d-none');

                    const listaErrores = document.getElementById(config.errorListId);
                    if (listaErrores) listaErrores.innerHTML = '';

                    if (typeof mostrarNotificacion === 'function') {
                        mostrarNotificacion('Cliente registrado correctamente', 'success');
                    }
                } else {
                    const alertaErrores = document.getElementById(config.errorAlertId);
                    const listaErrores = document.getElementById(config.errorListId);

                    if (listaErrores) listaErrores.innerHTML = '';

                    if (data.errores && listaErrores) {
                        for (const [campo, mensaje] of Object.entries(data.errores)) {
                            const li = document.createElement('li');
                            li.innerHTML = `<strong>${campo}:</strong> ${mensaje}`;
                            listaErrores.appendChild(li);
                        }
                    }

                    if (alertaErrores) alertaErrores.classList.remove('d-none');
                }
            } catch (error) {
                if (typeof mostrarNotificacion === 'function') {
                    mostrarNotificacion('Error al guardar el cliente. Por favor, intenta nuevamente.', 'error');
                }
            } finally {
                btnGuardar.innerHTML = config.submitText || 'Guardar cliente';
                actualizarEstadoBoton();
            }
        });

        modal.addEventListener('shown.bs.modal', function () {
            setButtonState(btnGuardar, false);
            actualizarEstadoBoton();
        });

        modal.addEventListener('hidden.bs.modal', function () {
            limpiarFormulario(form);

            const alertaErrores = document.getElementById(config.errorAlertId);
            if (alertaErrores) alertaErrores.classList.add('d-none');

            const listaErrores = document.getElementById(config.errorListId);
            if (listaErrores) listaErrores.innerHTML = '';

            setButtonState(btnGuardar, false);
        });
    }

    /* =========================================================
       FORMULARIO PRINCIPAL DE CLIENTES
    ========================================================= */
    initClienteForm({
        modalId: 'modalCrearCliente',
        formId: 'formCrearCliente',
        buttonId: 'btnGuardarCliente',
        submitText: 'Guardar cliente',
        errorAlertId: 'alertaErroresCliente',
        errorListId: 'listaErroresCliente',
        requiredIds: [
            'tipo_documento',
            'numero_documento',
            'nombre',
            'apellido',
            'fecha_nacimiento'
        ],
        optionalIds: [
            'telefono',
            'correo'
        ],
        fields: {
            tipoDocumento: 'tipo_documento',
            numeroDocumento: 'numero_documento',
            nombre: 'nombre',
            apellido: 'apellido',
            fechaNacimiento: 'fecha_nacimiento',
            telefono: 'telefono',
            correo: 'correo'
        }
    });

    /* =========================================================
       FORMULARIO CLIENTE DENTRO DE GESTIÓN DE ALISADOS
    ========================================================= */
    initClienteForm({
        modalId: 'modalCrearCliente',
        formId: 'formCrearClienteModal',
        buttonId: 'btnGuardarClienteModalGestion',
        submitText: 'Guardar cliente',
        errorAlertId: 'alertaErroresClienteModal',
        errorListId: 'listaErroresClienteModal',
        requiredIds: [
            'tipo_documento_cliente_modal',
            'numero_documento_cliente_modal',
            'nombre_cliente_modal',
            'apellido_cliente_modal',
            'fecha_nacimiento_cliente_modal'
        ],
        optionalIds: [
            'telefono_cliente_modal',
            'correo_cliente_modal'
        ],
        fields: {
            tipoDocumento: 'tipo_documento_cliente_modal',
            numeroDocumento: 'numero_documento_cliente_modal',
            nombre: 'nombre_cliente_modal',
            apellido: 'apellido_cliente_modal',
            fechaNacimiento: 'fecha_nacimiento_cliente_modal',
            telefono: 'telefono_cliente_modal',
            correo: 'correo_cliente_modal'
        }
    });

    /* =========================================================
       CONFIRMAR GESTIÓN DE ALISADOS DESDE CLIENTES
    ========================================================= */
    if (window.mostrarModalGestion) {
        const modalConfirmacionEl = document.getElementById('modalGestionDatos');
        const btnAbrirGestion = document.getElementById('btnAbrirGestionDesdeCliente');
        const contenedor = document.getElementById('contenedorGestionAlisadoModal');
        const modalGestionEl = document.getElementById('modalGestionAlisadoCliente');

        if (modalConfirmacionEl) {
            const modalConfirmacion = new bootstrap.Modal(modalConfirmacionEl);
            modalConfirmacion.show();
        }

        if (btnAbrirGestion && contenedor && modalGestionEl) {
            btnAbrirGestion.addEventListener('click', async function () {
                try {
                    if (!window.urlGestionModal) {
                        console.error('window.urlGestionModal no está definida');
                        alert('No se encontró la URL del formulario de gestión.');
                        return;
                    }

                    const url = `${window.urlGestionModal}?cliente=${window.clienteCreadoId}&desde_clientes=1`;

                    const response = await fetch(url, {
                        headers: {
                            'X-Requested-With': 'XMLHttpRequest'
                        }
                    });

                    const html = await response.text();
                    contenedor.innerHTML = html;

                    // Ejecutar scripts del formulario cargado dinámicamente
                    contenedor.querySelectorAll('script').forEach(oldScript => {
                        const newScript = document.createElement('script');

                        if (oldScript.src) {
                            newScript.src = oldScript.src;
                        } else {
                            newScript.textContent = oldScript.textContent;
                        }

                        document.body.appendChild(newScript);
                        oldScript.remove();
                    });

                    const modalConfirmacion = bootstrap.Modal.getInstance(modalConfirmacionEl);
                    if (modalConfirmacion) {
                        modalConfirmacion.hide();
                    }

                    const modalGestion = new bootstrap.Modal(modalGestionEl);
                    modalGestion.show();

                } catch (error) {
                    console.error('Error cargando formulario de gestión:', error);
                    alert('No se pudo cargar el formulario.');
                }
            });
        }
    }

    /* =========================================================
       CONTROL ELIMINAR
    ========================================================= */
    document.querySelectorAll('.btn-eliminar[data-control-eliminar]').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const esAdmin = this.dataset.esAdmin === 'true';
            const modalId = this.dataset.modalId;

            if (esAdmin) {
                const modalEl = document.getElementById(modalId);
                if (!modalEl) return;
                new bootstrap.Modal(modalEl).show();
            } else {
                e.preventDefault();

                const modalNoPermitido = document.getElementById('modalAccionNoPermitida');
                if (!modalNoPermitido) return;

                const bsModal = new bootstrap.Modal(modalNoPermitido);
                bsModal.show();

                setTimeout(() => {
                    bsModal.hide();
                    document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
                    document.body.classList.remove('modal-open');
                }, 3500);
            }
        });
    });
});