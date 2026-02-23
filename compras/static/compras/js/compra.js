document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // MODAL FORM (CREAR/EDITAR)
  // =========================
  const formModalEl = document.getElementById("ajaxFormModal");
  const formModalTitleEl = document.getElementById("ajaxFormModalTitle");
  const formModalBodyEl = document.getElementById("ajaxFormModalBody");

  let formModal = null;
  if (formModalEl) formModal = new bootstrap.Modal(formModalEl);

  // =========================
  // MODAL DETALLE
  // =========================
  const detalleModalEl = document.getElementById("modalDetalleCompra");
  const detalleBodyEl = document.getElementById("detalleCompraBody");

  let detalleModal = null;
  if (detalleModalEl) detalleModal = new bootstrap.Modal(detalleModalEl);

  // ---------- helper fetch ----------
  async function fetchSmart(url, options = {}) {
    const res = await fetch(url, options);
    const contentType = (res.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return { type: "json", ok: res.ok, status: res.status, data };
    }

    const text = await res.text();
    return { type: "html", ok: res.ok, status: res.status, data: text };
  }

  // =========================
  // ABRIR MODAL CREAR/EDITAR
  // =========================
  async function openFormModal(url, title) {
    if (!formModal || !formModalTitleEl || !formModalBodyEl) {
      console.error("Falta el modal #ajaxFormModal (o sus ids).");
      return;
    }

    formModalTitleEl.textContent = title || "Formulario";
    formModalBodyEl.innerHTML = `
      <div class="d-flex justify-content-center py-5">
        <div class="spinner-border" role="status" aria-hidden="true"></div>
      </div>
    `;

    formModal.show();

    const result = await fetchSmart(url, {
      method: "GET",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });

    if (result.type === "json") {
      formModalTitleEl.textContent = result.data.title || title || "Formulario";
      formModalBodyEl.innerHTML =
        result.data.html || `<div class="alert alert-danger">No se pudo cargar.</div>`;
      return;
    }

    // por si te devuelve HTML directo
    formModalBodyEl.innerHTML = result.data;
  }

  // =========================
  // CLICK GLOBAL
  // - data-modal-url => abre crear/editar
  // - js-ver-detalle => abre detalle
  // =========================
  document.body.addEventListener("click", async (e) => {
    // ---- CREAR/EDITAR (modal genérico) ----
    const trigger = e.target.closest("[data-modal-url]");
    if (trigger) {
      e.preventDefault();
      const url = trigger.getAttribute("data-modal-url");
      const title = trigger.getAttribute("data-modal-title") || "Formulario";
      await openFormModal(url, title);
      return;
    }

    // ---- DETALLE ----
    const btnDetalle = e.target.closest(".js-ver-detalle");
    if (btnDetalle) {
      e.preventDefault();

      if (!detalleModal || !detalleBodyEl) {
        console.error("Falta modal detalle (#modalDetalleCompra o #detalleCompraBody).");
        return;
      }

      const url = btnDetalle.getAttribute("data-url");
      if (!url) {
        console.error("El botón detalle no tiene data-url");
        return;
      }

      detalleBodyEl.innerHTML = `<div class="text-muted">Cargando...</div>`;
      detalleModal.show();

      try {
        const res = await fetch(url, {
          headers: { "X-Requested-With": "XMLHttpRequest" },
          credentials: "same-origin",
        });

        const data = await res.json();
        if (data.success && data.html) {
          detalleBodyEl.innerHTML = data.html;
        } else {
          detalleBodyEl.innerHTML = `<div class="alert alert-danger">No se pudo cargar el detalle.</div>`;
          console.log("Detalle response:", data);
        }
      } catch (err) {
        detalleBodyEl.innerHTML = `<div class="alert alert-danger">Error cargando detalle.</div>`;
        console.error(err);
      }
    }
  });

  // =========================
  // SUBMIT AJAX DEL FORM (CREAR/EDITAR)
  // =========================
  document.body.addEventListener("submit", async (e) => {
    const form = e.target.closest("#ajaxFormModal form");
    if (!form) return;

    e.preventDefault();

    const url = form.action;
    const formData = new FormData(form);
    const csrf = form.querySelector('input[name="csrfmiddlewaretoken"]')?.value;

    const result = await fetchSmart(url, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRFToken": csrf,
      },
    });

    if (result.type === "json") {
      if (result.data.success) {
        formModal.hide();
        window.location.reload();
        return;
      }

      formModalTitleEl.textContent = result.data.title || formModalTitleEl.textContent;
      formModalBodyEl.innerHTML =
        result.data.html || `<div class="alert alert-danger mb-0">No se pudo guardar.</div>`;
      return;
    }

    // por si devuelve HTML
    formModalBodyEl.innerHTML = result.data;
  });
});
document.addEventListener("DOMContentLoaded", function () {

  function toNumber(v) {
    if (!v) return 0;
    v = String(v).replace(",", ".");
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
  }

  function calcularTotal(scope) {
    // scope = modal o documento
    const root = scope || document;

    const totalInput =
      root.querySelector("#id_precio_total") ||
      root.querySelector('input[name="precio_total"]');

    if (!totalInput) return;

    let total = 0;

    // IMPORTANTE: estos names son los del inline formset:
    // detalles-0-cantidad / detalles-0-precio_unitario, etc
    const cantidadInputs = root.querySelectorAll('input[name$="-cantidad"]');

    cantidadInputs.forEach((inputCantidad) => {
      const base = inputCantidad.name.replace("cantidad", "");
      const inputPrecio = root.querySelector(`input[name="${base}precio_unitario"]`);

      const cantidad = toNumber(inputCantidad.value);
      const precio = toNumber(inputPrecio ? inputPrecio.value : 0);

      if (cantidad > 0 && precio >= 0) total += cantidad * precio;
    });

    totalInput.value = total.toFixed(2);
  }

  // Recalcular 
  document.addEventListener("input", function (e) {
    if (
      e.target.matches('input[name$="-cantidad"]') ||
      e.target.matches('input[name$="-precio_unitario"]')
    ) {
      
      const modal = e.target.closest(".modal");
      calcularTotal(modal || document);
    }
  });

  document.addEventListener("shown.bs.modal", function (e) {
    calcularTotal(e.target);
  });

});
document.addEventListener("DOMContentLoaded", () => {
  function getCSRFToken() {
    return document.querySelector('input[name="csrfmiddlewaretoken"]')?.value || "";
  }

  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest(".js-eliminar-compra");
    if (!btn) return;

    const url = btn.dataset.url;
    if (!url) return;

    const modalEl = btn.closest(".modal");
    const modal = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;

    const confirm = await Swal.fire({
      title: "Confirmar eliminación",
      text: "Esta acción no se puede deshacer.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
    });

    if (!confirm.isConfirmed) return;

    try {
      btn.disabled = true;

      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "X-CSRFToken": getCSRFToken(),
          "X-Requested-With": "XMLHttpRequest",
        },
      });

      // si el backend devuelve HTML por error, esto falla, por eso validamos
      const contentType = (res.headers.get("content-type") || "").toLowerCase();
      if (!contentType.includes("application/json")) {
        throw new Error("Respuesta no JSON");
      }

      const data = await res.json();

      if (data.status === "deleted") {
        if (modal) modal.hide();

        await Swal.fire({
          title: "Eliminada",
          text: "La compra fue eliminada correctamente.",
          icon: "success",
          confirmButtonColor: "#198754",
        });

        window.location.reload();
        return;
      }

      if (data.status === "protected") {
        if (modal) modal.hide();

        const lista = Array.isArray(data.relacionados) && data.relacionados.length
          ? `<ul class="text-start mb-0">
              ${data.relacionados.map(r => `<li><strong>${r.cantidad}</strong> ${r.modelo}</li>`).join("")}
            </ul>`
          : `<div>${data.detalle || "Tiene relaciones"}</div>`;

        await Swal.fire({
          title: "No se puede eliminar",
          html: `
            <div class="mb-2">Esta compra está relacionada con:</div>
            ${lista}
          `,
          icon: "info",
          confirmButtonText: "Entendido",
          confirmButtonColor: "#0d6efd",
        });

        return;
      }

      if (modal) modal.hide();
      await Swal.fire({
        title: "No se pudo eliminar",
        text: data.message || "Ocurrió un error.",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    } catch (err) {
      console.error(err);
      if (modal) modal.hide();

      Swal.fire({
        title: "Error",
        text: "No fue posible procesar la solicitud.",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
    } finally {
      btn.disabled = false;
    }
  });
});
