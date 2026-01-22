document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("modalConfirmarEliminacion");
    const texto = document.getElementById("textoConfirmacionProducto");
    const checkbox = document.getElementById("confirmacionCheckboxProducto");
    const boton = document.getElementById("btnConfirmarEliminarProducto");

    modal?.addEventListener("show.bs.modal", event => {
        const button = event.relatedTarget;
        const nombre = button.getAttribute("data-producto");

        texto.innerHTML = `
            ¿Deseas eliminar permanentemente el producto
            <strong class="text-danger">${nombre}</strong>?
        `;

        checkbox.checked = false;
        boton.disabled = true;
    });

    checkbox?.addEventListener("change", () => {
        boton.disabled = !checkbox.checked;
    });

});
