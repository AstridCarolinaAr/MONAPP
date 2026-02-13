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

    const estadoEl = document.getElementById("d-estado");
    if (estadoEl) {
      estadoEl.textContent = data.estado || "—";
      estadoEl.classList.remove("badge-estado-activo", "badge-estado-inactivo", "badge-estado-default");

      const estadoTxt = (data.estado || "").toLowerCase();
      if (estadoTxt.includes("disponible")) estadoEl.classList.add("badge-estado-activo");
      else if (estadoTxt.includes("agotado") || estadoTxt.includes("descontinuado")) estadoEl.classList.add("badge-estado-inactivo");
      else estadoEl.classList.add("badge-estado-default");
    }
  });
});