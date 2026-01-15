document.addEventListener('DOMContentLoaded', () => {
    const checkbox = document.getElementById('checkConfirmar');
    const btnEliminar = document.getElementById('btnEliminarFinal');

    if (checkbox && btnEliminar) {
        checkbox.addEventListener('change', () => {
            btnEliminar.disabled = !checkbox.checked;
        });
    }
});
