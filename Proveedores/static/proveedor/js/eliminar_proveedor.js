document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("modalConfirmarEliminacion");
    const checkbox = document.getElementById("confirmacionCheckboxProveedor");
    const boton = document.getElementById("btnConfirmarEliminarProveedor");
    const form = document.getElementById("formEliminarProveedor");

    if (!modal || !checkbox || !boton || !form) {
        console.error("❌ Elementos eliminar proveedor no encontrados");
        return;
    }

    /* ===============================
       AL ABRIR MODAL
    =============================== */
    modal.addEventListener("show.bs.modal", () => {
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
       🔥 BLOQUEO REAL DEL SUBMIT
    =============================== */
    form.addEventListener("submit", e => {
        if (!checkbox.checked) {
            e.preventDefault();
            e.stopImmediatePropagation();
            alert("Debes confirmar la eliminación marcando la casilla.");
        }
    });

});
