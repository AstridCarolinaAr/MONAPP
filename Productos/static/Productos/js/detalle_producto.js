document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalDetalleProducto");
  if (!modal) return;

  modal.addEventListener("show.bs.modal", (event) => {
    const btn = event.relatedTarget;
    if (!btn) return;

    const setText = (id, value, fallback = "—") => {
      const el = document.getElementById(id);
      if (el) el.textContent = value && String(value).trim() ? value : fallback;
    };

    setText("dp-nombre", btn.dataset.nombre, "Producto");
    setText("dp-codigo", btn.dataset.codigo);
    setText("dp-marca", btn.dataset.marca);
    setText("dp-precio", btn.dataset.precio ? `$ ${btn.dataset.precio}` : "$ 0");
    setText("dp-linea", btn.dataset.linea);
    setText("dp-presentacion", btn.dataset.presentacion);
    setText("dp-unidad", btn.dataset.unidad);
    setText("dp-descripcion", btn.dataset.descripcion, "Sin descripción");

    const estado = document.getElementById("dp-estado");
    if (estado) {
      if (btn.dataset.activo === "1") {
        estado.textContent = "Activo";
        estado.className = "badge-estado badge-ok";
      } else {
        estado.textContent = "Inactivo";
        estado.className = "badge-estado badge-off";
      }
    }

    const img = document.getElementById("dp-imagen");
    const noimg = document.getElementById("dp-noimg");

    if (img && noimg) {
      const imagen = (btn.dataset.imagen || "").trim();

      if (imagen) {
        img.src = imagen;
        img.classList.remove("d-none");
        noimg.classList.add("d-none");
      } else {
        img.src = "";
        img.classList.add("d-none");
        noimg.classList.remove("d-none");
      }
    }
    document.getElementById("dp-precio").textContent = "$ " + (btn.dataset.precio || "0");
  });
});