
document.addEventListener('DOMContentLoaded', function () {

    const modalEl = document.getElementById('modalCrearCliente');
    if (!modalEl) return;

    const form = modalEl.querySelector('form');
    const btnNuevo = document.getElementById('btnNuevoCliente');

    //  Abrir modal SOLO al hacer click en el botón
    if (btnNuevo) {
        btnNuevo.addEventListener('click', function () {
            window.ABRIR_MODAL_CLIENTE = true;
            new bootstrap.Modal(modalEl).show();
        });
    }

    //  Abrir modal SOLO si backend lo indica (errores)
    if (window.ABRIR_MODAL_CLIENTE === true && !performance.getEntriesByType("navigation")[0].type.includes("reload")) {
         new bootstrap.Modal(modalEl).show();
    }


    //  LIMPIAR TODO al cerrar modal
    modalEl.addEventListener('hidden.bs.modal', function () {

        if (!form) return;

        form.reset();

        form.querySelectorAll('input, select, textarea').forEach(el => {
            el.value = '';
            el.removeAttribute('value');
            el.classList.remove('is-invalid');
        });

        form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());

        //  Evitar reapertura al refrescar
        window.ABRIR_MODAL_CLIENTE = false;
    });

});

// LIMPIEZA FORZADA AL MOSTRAR LA PÁGINA
// (EVITA CACHE DEL NAVEGADOR)

window.addEventListener('pageshow', function () {

    const modalEl = document.getElementById('modalCrearCliente');
    if (!modalEl) return;

    const form = modalEl.querySelector('form');
    if (!form) return;

    //  Limpiar SIEMPRE (no solo cuando persisted)
    form.reset();

    form.querySelectorAll('input, select, textarea').forEach(el => {
        el.value = '';
        el.defaultValue = '';
        el.classList.remove('is-invalid');
    });

    form.querySelectorAll('.invalid-feedback').forEach(el => el.remove());

    //  Forzar que el modal quede cerrado
    const modalInstance = bootstrap.Modal.getInstance(modalEl);
    if (modalInstance) {
        modalInstance.hide();
    }

    // Evitar reapertura
    window.ABRIR_MODAL_CLIENTE = false;
});

