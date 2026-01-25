document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("modalConfirmarEliminacion");
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
            <strong class="text-danger">${nombre}</strong>?
        `;

        checkbox.checked = false;
        boton.disabled = true;
    });

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

});
