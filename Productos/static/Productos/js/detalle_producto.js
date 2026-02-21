document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalDetalleProducto");
  if (!modal) return;

  modal.addEventListener("show.bs.modal", (event) => {
    const btn = event.relatedTarget;
    if (!btn) return;

    const set = (id, value) => {
      const el = document.getElementById(id);
      if (el) el.textContent = value || "—";
    };

    const data = btn.dataset;

    set("d-codigo", data.codigo);
    set("d-nombre", data.nombre);
    set("d-marca", data.marca);
    set("d-precio", data.precio ? `$${data.precio}` : "—");
    set("d-linea", data.linea);
    set("d-presentacion", data.presentacion);
    set("d-unidad", data.unidad);
    set("d-descripcion", data.descripcion);
    const cont = document.getElementById("d-imagen");

    if (data.imagen) {
      cont.innerHTML = `
        <img
          src="${data.imagen}"
          class="img-detalle js-img-zoom"
          data-src="${data.imagen}"
          alt="Imagen producto"
        >
      `;
    } else {
      cont.innerHTML = "—";
    }
    
    const estadoEl = document.getElementById("d-estado");
    const activo = (data.activo === "1" || data.activo === "true" || data.activo === true);

    estadoEl.classList.remove("bg-success", "bg-danger", "bg-secondary");
    estadoEl.classList.add("badge");

    if (activo) {
      estadoEl.classList.add("bg-success");
      estadoEl.textContent = "Activo";
    } else {
      estadoEl.classList.add("bg-danger");
      estadoEl.textContent = "Inactivo";
    }

  });

});
