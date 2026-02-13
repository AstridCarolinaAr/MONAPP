document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("modalConfirmarEliminacion");
  if (!modalEl) return;

  const checkbox = document.getElementById("confirmacionCheckboxProducto");
  const btnConfirm = document.getElementById("btnConfirmarEliminarProducto");
  const texto = document.getElementById("textoConfirmacionProducto");

  let deleteUrl = null; 
  function getCSRF() {
    return document.querySelector('input[name="csrfmiddlewaretoken"]')?.value;
  }

  modalEl.addEventListener("show.bs.modal", (event) => {
    const trigger = event.relatedTarget; 
    deleteUrl = trigger?.dataset?.url || null;
    const nombre = trigger?.dataset?.nombre || "";

    texto.innerHTML = `¿Estás seguro de que deseas eliminar <strong class="text-danger">${nombre}</strong>?`;

    checkbox.checked = false;
    btnConfirm.disabled = true;
  });

  checkbox.addEventListener("change", () => {
    btnConfirm.disabled = !checkbox.checked;
  });

  btnConfirm.addEventListener("click", async () => {
    if (!checkbox.checked || !deleteUrl) return;

    btnConfirm.disabled = true;

    try {
      const res = await fetch(deleteUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCSRF(),
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      const data = await res.json();

        if (data.status === "deleted") {
        alert("Producto eliminado correctamente.");
        window.location.reload();
        return;
        }

        if (data.status === "inactivated") {
        alert("No se pudo eliminar porque está relacionado. Se inactivó/descontinuó.");
        window.location.reload();
        return;
        }

      alert("Error eliminando.");
      btnConfirm.disabled = false;

    } catch (err) {
      console.error(err);
      alert("Error eliminando (revisa consola).");
      btnConfirm.disabled = false;
    }
  });
});