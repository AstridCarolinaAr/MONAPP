// Productos/static/Productos/js/lista_productos.js
(() => {
document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("btnFiltroLineas");
  const panel = document.getElementById("panelFiltroLineas");

  console.log("JS lista_productos cargado ✅", { btn: !!btn, panel: !!panel });

  if (btn && panel) {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation(); // importante dentro del dropdown
      panel.classList.toggle("d-none");
      console.log("Toggle filtro líneas ✅", panel.classList.contains("d-none"));
    });
  }

    // =========================
    // 2) Modal detalle producto (Bootstrap modal show)
    // =========================
    const modalDetalle = document.getElementById("modalDetalleProducto");
    if (modalDetalle) {
      modalDetalle.addEventListener("show.bs.modal", (event) => {
        const btn = event.relatedTarget;
        if (!btn) return;

        const d = btn.dataset;

        const setText = (id, value) => {
          const el = document.getElementById(id);
          if (el) el.textContent = value ?? "—";
        };

        setText("d-codigo", d.codigo || "—");
        setText("d-nombre", d.nombre || "—");
        setText("d-marca", d.marca || "—");
        setText("d-precio", d.precio || "—");
        setText("d-linea", d.linea || "—");
        setText("d-unidad", d.unidad || "—");

        // Estado (activo/inactivo)
        const estado = d.activo === "1" ? "Activo" : "Inactivo";
        const elEstado = document.getElementById("d-estado");
        if (elEstado) {
          elEstado.textContent = estado;
          elEstado.classList.remove("text-success", "text-danger");
          elEstado.classList.add(d.activo === "1" ? "text-success" : "text-danger");
        }

        // Descripción
        const descEl = document.getElementById("d-descripcion");
        if (descEl) descEl.textContent = d.descripcion?.trim() ? d.descripcion : "—";

        // Imagen
        const imgEl = document.getElementById("d-imagen");
        if (imgEl) {
          if (d.imagen) {
            imgEl.src = d.imagen;
            imgEl.classList.remove("d-none");
            imgEl.classList.add("js-img-zoom");
            imgEl.setAttribute("data-src", d.imagen);
          } else {
            imgEl.src = "";
            imgEl.classList.add("d-none");
          }
        }
      });
    }

    // =========================
    // 3) Zoom imagen (abre modalImagen)
    // =========================
    document.addEventListener("click", (e) => {
      const img = e.target.closest(".js-img-zoom");
      if (!img) return;

      e.preventDefault();

      const src = img.getAttribute("data-src") || img.getAttribute("src");
      const modalEl = document.getElementById("modalImagen");
      const tag = document.getElementById("modalImagenTag");

      if (!src || !modalEl || !tag) return;

      tag.src = src;
      new bootstrap.Modal(modalEl).show();
    });
  });
})();
const switchEl = document.getElementById(`estado-producto-${data.id}`);
const labelEl = document.getElementById(`estado-label-${data.id}`);

if (switchEl) {
    switchEl.classList.remove("is-on");
    switchEl.classList.add("is-off");
}

if (labelEl) {
    labelEl.textContent = "Desactivado";
}
if (switchEl) {
    switchEl.classList.remove("is-off");
    switchEl.classList.add("is-on");
}

if (labelEl) {
    labelEl.textContent = "Activo";
}