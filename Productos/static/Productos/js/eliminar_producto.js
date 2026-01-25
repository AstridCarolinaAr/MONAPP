document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("modalConfirmarEliminacion");
<<<<<<< HEAD
    const texto = document.getElementById("textoConfirmacionProducto");
    const checkbox = document.getElementById("confirmacionCheckboxProducto");
    const boton = document.getElementById("btnConfirmarEliminarProducto");

    modal?.addEventListener("show.bs.modal", event => {
        const button = event.relatedTarget;
        const nombre = button.getAttribute("data-producto");

        texto.innerHTML = `
            ¿Deseas eliminar permanentemente el producto
=======
    if (!modal) return;

    const checkbox = document.getElementById("confirmacionCheckboxProducto");
    const boton = document.getElementById("btnConfirmarEliminarProducto");
    const texto = document.getElementById("textoConfirmacionProducto");
    const form = document.getElementById("formEliminarProducto");

    /* ===============================
       CUANDO SE ABRE EL MODAL
    =============================== */
    modal.addEventListener("show.bs.modal", event => {
        const btn = event.relatedTarget;
        const nombre = btn?.getAttribute("data-producto") || "";

        texto.innerHTML = `
            ¿Estás seguro de que deseas eliminar el producto
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
            <strong class="text-danger">${nombre}</strong>?
        `;

        checkbox.checked = false;
        boton.disabled = true;
    });

<<<<<<< HEAD
    checkbox?.addEventListener("change", () => {
        boton.disabled = !checkbox.checked;
    });

=======
    /* ===============================
       CHECKBOX CONTROLA BOTÓN
    =============================== */
    checkbox.addEventListener("change", () => {
        boton.disabled = !checkbox.checked;
    });

    /* ===============================
       BLOQUEO FINAL (SEGURIDAD REAL)
    =============================== */
    form.addEventListener("submit", (e) => {
        if (!checkbox.checked) {
            e.preventDefault();
            e.stopPropagation();
            alert("Debes confirmar la eliminación marcando la casilla.");
        }
    });

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
});
