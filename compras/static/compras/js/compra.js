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

  // ---------- helpers ----------
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

  function getCSRFToken(scope) {
    return (
      scope?.querySelector?.('input[name="csrfmiddlewaretoken"]')?.value ||
      document.querySelector('input[name="csrfmiddlewaretoken"]')?.value ||
      ""
    );
  }

  function toNumber(v) {
    if (v === null || v === undefined || v === "") return 0;
    const s = String(v).replace(",", ".");
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  function calcularTotal(scope) {
    const root = scope || document;

    const totalInput =
      root.querySelector("#id_precio_total") ||
      root.querySelector('input[name="precio_total"]');

    if (!totalInput) return;

    let total = 0;

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

  function isCreateMode(form) {
    const action = (form?.action || "").toLowerCase();
    return action.includes("/crear");
  }

  function isEditMode(form) {
    const action = (form?.action || "").toLowerCase();
    return action.includes("/editar");
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
      // recalcular total por si ya hay items
      calcularTotal(formModalEl);
      return;
    }

    // por si devuelve HTML directo
    formModalBodyEl.innerHTML = result.data;
    calcularTotal(formModalEl);
  }

  // =========================
  // CLICK GLOBAL
  // - data-modal-url => abre crear/editar
  // - js-ver-detalle => abre detalle
  // - js-eliminar-compra => eliminar (sweetalert)
  // - btnAgregarProducto => agregar item formset
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
      return;
    }

    // ---- ELIMINAR COMPRA ----
    const btnEliminar = e.target.closest(".js-eliminar-compra");
    if (btnEliminar) {
      e.preventDefault();

      const url = btnEliminar.dataset.url;
      if (!url) return;

      const modalEl = btnEliminar.closest(".modal");
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
        btnEliminar.disabled = true;

        const res = await fetch(url, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "X-CSRFToken": getCSRFToken(document),
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        const contentType = (res.headers.get("content-type") || "").toLowerCase();
        if (!contentType.includes("application/json")) {
          throw new Error("Respuesta no JSON");
        }

        const data = await res.json();

        if (data.status === "deleted") {
          if (modal) modal.hide();

          await Swal.fire({
            title: "Eliminado",
            text: data.message || "La compra se eliminó correctamente.",
            icon: "success",
            timer: 1600,
            showConfirmButton: false,
          });

          location.reload();
          return;
        }

        if (data.status === "protected") {
          if (modal) modal.hide();

          const lista = Array.isArray(data.relacionados) && data.relacionados.length
            ? `<ul class="text-start mb-0">
                ${data.relacionados
                  .map((r) => `<li><strong>${r.cantidad}</strong> ${r.modelo}</li>`)
                  .join("")}
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
        btnEliminar.disabled = false;
      }

      return;
    }

    // ---- AGREGAR PRODUCTO (FORMSET) ----
    const btnAdd = e.target.closest("#btnAgregarProducto");
    if (btnAdd) {
      e.preventDefault();

      const form = btnAdd.closest("form");
      if (!form) return;

      const container = form.querySelector("#productosContainer");
      const template = form.querySelector("#emptyFormTemplate");
      const totalForms = form.querySelector('input[name$="-TOTAL_FORMS"]');

      if (!container || !template || !totalForms) {
        console.error("Faltan #productosContainer, #emptyFormTemplate o TOTAL_FORMS.");
        return;
      }

      const index = parseInt(totalForms.value || "0", 10);
      const html = template.innerHTML.replace(/__prefix__/g, index);

      container.insertAdjacentHTML("beforeend", html);
      totalForms.value = index + 1;

      // recalcula total al agregar
      const modal = btnAdd.closest(".modal");
      calcularTotal(modal || document);
      return;
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

    const result = await fetchSmart(url, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRFToken": getCSRFToken(form),
      },
    });

    // Si backend responde JSON (lo ideal)
    if (result.type === "json") {
      if (result.data.success) {
        formModal?.hide();

        const msg =
          result.data.message ||
          (isCreateMode(form) ? "Compra registrada correctamente." : "Se editó correctamente.");

        await Swal.fire({
          title: "Éxito",
          text: msg,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });

        location.reload();
        return;
      }

      // errores: pinta el html con errores en el modal
      formModalTitleEl.textContent = result.data.title || formModalTitleEl.textContent;
      formModalBodyEl.innerHTML =
        result.data.html || `<div class="alert alert-danger mb-0">No se pudo guardar.</div>`;

      // recalcula por si volvió con datos
      calcularTotal(formModalEl);
      return;
    }

    // Si devolvió HTML directo (fallback)
    formModalBodyEl.innerHTML = result.data;
    calcularTotal(formModalEl);

    await Swal.fire({
      title: "No se pudo guardar",
      text: "Revisa el formulario.",
      icon: "error",
      confirmButtonColor: "#dc3545",
    });
  });

  // =========================
  // RECALCULAR TOTAL (inputs)
  // =========================
  document.addEventListener("input", (e) => {
    if (
      e.target.matches('input[name$="-cantidad"]') ||
      e.target.matches('input[name$="-precio_unitario"]')
    ) {
      const modal = e.target.closest(".modal");
      calcularTotal(modal || document);
    }
  });

  document.addEventListener("shown.bs.modal", (e) => {
    calcularTotal(e.target);
  });
});