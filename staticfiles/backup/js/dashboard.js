document.addEventListener('DOMContentLoaded', function() {

    // ==================== OBTENER ELEMENTOS ==================== 
    const inputNombre = document.getElementById('backup_nombre');
    const inputNotas = document.getElementById('backup_notas');
    const charCountNombre = document.getElementById('char_count_nombre');
    const charCountNotas = document.getElementById('char_count_notas');
    const nombreError = document.getElementById('nombre_error');
    const notasError = document.getElementById('notas_error');
    const nombreErrorMsg = document.getElementById('nombre_error_msg');
    const notasErrorMsg = document.getElementById('notas_error_msg');
    const submitBtn = document.getElementById('btnCrearBackup');
    const modalBackup = document.getElementById('modalCrearBackup');
    const formBackup = modalBackup ? modalBackup.querySelector('form') : null;

    // Validar que los elementos existan
    if (!inputNombre || !inputNotas || !submitBtn || !formBackup) {
        console.error('Elementos del modal no encontrados');
        return;
    }

    // ==================== VALIDACIONES EN TIEMPO REAL ====================
    function validarNombre() {
        const nombre = inputNombre.value.trim();
        const nombreOriginal = inputNombre.value;
        let valido = true;
        let mensaje = '';

        // Solo espacios en blanco
        if (nombreOriginal.length > 0 && nombre.length === 0) {
            valido = false;
            mensaje = 'El nombre no puede contener solo espacios en blanco';
        }
        // Contiene contenido
        else if (nombre.length > 0) {
            // Validar caracteres especiales peligrosos
            if (!/^[a-zA-Z0-9_\-áéíóúñ\s\.]+$/.test(nombre)) {
                valido = false;
                mensaje = 'Solo se permiten letras, números, puntos, guiones y espacios';
            }
            // Validar longitud mínima
            if (nombre.length < 3) {
                valido = false;
                mensaje = 'El nombre debe tener al menos 3 caracteres';
            }
        }

        charCountNombre.textContent = inputNombre.value.length;

        if (!valido) {
            nombreError.style.display = 'block';
            nombreErrorMsg.textContent = mensaje;
            inputNombre.classList.add('is-invalid');
        } else {
            nombreError.style.display = 'none';
            inputNombre.classList.remove('is-invalid');
        }

        return valido || nombre.length === 0; // Vacío también es válido
    }

    function validarNotas() {
        const notas = inputNotas.value.trim();
        const notasOriginal = inputNotas.value;
        let valido = true;
        let mensaje = '';

        // Solo espacios en blanco
        if (notasOriginal.length > 0 && notas.length === 0) {
            valido = false;
            mensaje = 'Las notas no pueden contener solo espacios en blanco';
        }
        // Contiene contenido
        else if (notas.length > 500) {
            valido = false;
            mensaje = 'Las notas no pueden exceder 500 caracteres';
        }

        charCountNotas.textContent = inputNotas.value.length;

        if (!valido) {
            notasError.style.display = 'block';
            notasErrorMsg.textContent = mensaje;
            inputNotas.classList.add('is-invalid');
        } else {
            notasError.style.display = 'none';
            inputNotas.classList.remove('is-invalid');
        }

        return valido;
    }

    function actualizarBotón() {
        const nombreOk = validarNombre();
        const notasOk = validarNotas();
        submitBtn.disabled = !nombreOk || !notasOk;
    }

    // Event listeners para actualizar validación
    inputNombre.addEventListener('input', actualizarBotón);
    inputNombre.addEventListener('blur', actualizarBotón);
    inputNotas.addEventListener('input', actualizarBotón);
    inputNotas.addEventListener('blur', actualizarBotón);

    // Al abrir el modal, resetear campos
    if (modalBackup) {
        modalBackup.addEventListener('show.bs.modal', function() {
            inputNombre.value = '';
            inputNotas.value = '';
            charCountNombre.textContent = '0';
            charCountNotas.textContent = '0';
            nombreError.style.display = 'none';
            notasError.style.display = 'none';
            inputNombre.classList.remove('is-invalid');
            inputNotas.classList.remove('is-invalid');
            actualizarBotón();
        });
    }

    // Validar formulario antes de enviar
    formBackup.addEventListener('submit', function(e) {
        const nombre = inputNombre.value.trim();
        const notas = inputNotas.value.trim();

        // Validaciones finales
        if (nombre.length > 0 && nombre.length < 3) {
            e.preventDefault();
            nombreError.style.display = 'block';
            nombreErrorMsg.textContent = 'El nombre debe tener al menos 3 caracteres';
            inputNombre.classList.add('is-invalid');
            inputNombre.focus();
            return false;
        }

        if (inputNombre.value.trim().length === 0 && inputNombre.value.length > 0) {
            e.preventDefault();
            nombreError.style.display = 'block';
            nombreErrorMsg.textContent = 'El nombre no puede contener solo espacios en blanco';
            inputNombre.classList.add('is-invalid');
            inputNombre.focus();
            return false;
        }

        if (inputNotas.value.trim().length === 0 && inputNotas.value.length > 0) {
            e.preventDefault();
            notasError.style.display = 'block';
            notasErrorMsg.textContent = 'Las notas no pueden contener solo espacios en blanco';
            inputNotas.classList.add('is-invalid');
            inputNotas.focus();
            return false;
        }

        if (notas.length > 500) {
            e.preventDefault();
            notasError.style.display = 'block';
            notasErrorMsg.textContent = 'Las notas no pueden exceder 500 caracteres';
            inputNotas.classList.add('is-invalid');
            inputNotas.focus();
            return false;
        }

        // Mostrar loading
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i class="bi bi-hourglass-split"></i> Creando...';
    });

    // ---- Restaurar ----
    document.querySelectorAll('.btn-restaurar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const nombre = this.dataset.nombre;

            Swal.fire({
                title: '¿Restaurar backup?',
                html: `Se restaurará <strong>"${nombre}"</strong>.<br>
                       <span class="text-danger">Esto reemplazará la base de datos actual.</span><br>
                       <small>Se recomienda crear un backup antes de restaurar.</small>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3a2a24',
                cancelButtonColor: '#999',
                confirmButtonText: '<i class="bi bi-arrow-counterclockwise"></i> Sí, restaurar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    const form = document.getElementById('formRestaurar');
                    form.action = `/backup/restaurar/${id}/`;
                    form.submit();
                }
            });
        });
    });

    // ---- Eliminar ----
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const nombre = this.dataset.nombre;

            if (!window.ES_ADMIN) {
                var modal = new bootstrap.Modal(document.getElementById('modalAccionNoPermitida'));
                modal.show();
                return;
            }

            Swal.fire({
                title: '¿Eliminar backup?',
                html: `Se moverá <strong>"${nombre}"</strong> a la lista de eliminados. El archivo se conserva.`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#b44646',
                cancelButtonColor: '#999',
                confirmButtonText: '<i class="bi bi-trash"></i> Sí, eliminar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    const form = document.getElementById('formEliminar');
                    form.action = `/backup/eliminar/${id}/`;
                    form.submit();
                }
            });
        });
    });

    // ---- Reactivar ----
    document.querySelectorAll('.btn-reactivar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const nombre = this.dataset.nombre;

            Swal.fire({
                title: '¿Restaurar backup?',
                html: `Se moverá <strong>"${nombre}"</strong> de vuelta a la lista de activos.`,
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#2e7d32',
                cancelButtonColor: '#999',
                confirmButtonText: '<i class="bi bi-arrow-counterclockwise"></i> Sí, restaurar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    const form = document.getElementById('formReactivar');
                    form.action = `/backup/reactivar/${id}/`;
                    form.submit();
                }
            });
        });
    });
});

    // ==================== PERSIANA BD ==================== 
    const collapseEl = document.getElementById('collapseEstadoBD');
    const iconEl = document.getElementById('iconEstadoBD');
    if (collapseEl && iconEl) {
        collapseEl.addEventListener('hide.bs.collapse', () => {
            iconEl.style.transform = 'rotate(180deg)';
        });
        collapseEl.addEventListener('show.bs.collapse', () => {
            iconEl.style.transform = 'rotate(0deg)';
        });
    }
