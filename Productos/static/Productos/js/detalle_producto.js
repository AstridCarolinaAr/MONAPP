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

<<<<<<< HEAD
    set("d-codigo", data.codigo);
    set("d-nombre", data.nombre);
    set("d-marca", data.marca);
    set("d-precio", data.precio ? `$${data.precio}` : "—");
    set("d-linea", data.linea);
    set("d-presentacion", data.presentacion);
    set("d-unidad", data.unidad);
    set("d-descripcion", data.descripcion);
<<<<<<< HEAD
=======
            set('d-codigo', btn.dataset.codigo);
            set('d-nombre', btn.dataset.nombre);
            set('d-marca', btn.dataset.marca);
            set('d-precio', btn.dataset.precio);
            set('d-linea', btn.dataset.linea);
            set('d-presentacion', btn.dataset.presentacion);
            set('d-unidad', btn.dataset.unidad);
            set('d-estado', btn.dataset.estado);
            set('d-descripcion', btn.dataset.descripcion);
            document.getElementById('id-cantidad').textContent=this.dataset.cantidad;
        });
    });
>>>>>>> sergio
=======
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
>>>>>>> sergioo
    
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
document.addEventListener("click", function (e) {
  const img = e.target.closest(".js-img-zoom");
  if (!img) return;

  const src = img.dataset.src || img.src;
  if (!src) return;

  const zoomImg = document.getElementById("zoomImg");
  const modalEl = document.getElementById("modalZoomImagen");

  if (!zoomImg || !modalEl) {
    console.error("No existe el modal de zoom");
    return;
  }

  zoomImg.src = src;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
  modal.show();
});
document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("modalZoomImagen");
  if (!modalEl) return;

  const modal = bootstrap.Modal.getOrCreateInstance(modalEl, {
    backdrop: true,
    keyboard: true
  });

  // Click fuera de la imagen cierra
  modalEl.addEventListener("click", (e) => {
    const img = e.target.closest("#zoomImg");
    if (!img) modal.hide(); // si NO clickeó la imagen => cerrar
  });

  // Evita que el click en la imagen cierre
  const zoomImg = document.getElementById("zoomImg");
  if (zoomImg) {
    zoomImg.addEventListener("click", (e) => e.stopPropagation());
  }
});
