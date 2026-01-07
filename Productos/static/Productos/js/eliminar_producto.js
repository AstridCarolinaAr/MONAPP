document.addEventListener('DOMContentLoaded', function () {

    const modal = document.getElementById('modalConfirmar');
    const texto = document.getElementById('textoConfirmacion');

    if (!modal) return;

    modal.addEventListener('show.bs.modal', function (event) {
        const button = event.relatedTarget;
        const producto = button.getAttribute('data-producto');

        texto.innerHTML = `
            ¿Estás seguro de que deseas eliminar el producto
            <strong>${producto}</strong>?<br>
            <span class="text-danger">
                Esta acción no se puede deshacer.
            </span>
        `;
    });

});
