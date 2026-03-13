(() => {
  "use strict";

  // =========================
  // Helpers DOM
  // =========================
  const qs = (root, sel) => (root || document).querySelector(sel);
  const qsa = (root, sel) => Array.from((root || document).querySelectorAll(sel));

  // =========================
  // CSRF
  // =========================
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  }
  function csrfFromCookie() {
    return getCookie("csrftoken") || "";
  }

  // =========================
  // Fetch helper
  // =========================
  async function fetchSmart(url, options = {}) {
    const res = await fetch(url, options);
    const contentType = (res.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return { type: "json", ok: res.ok, status: res.status, data, res };
    }
    const text = await res.text();
    return { type: "html", ok: res.ok, status: res.status, data: text, res };
  }

  // =========================
  // Numbers / COP
  // =========================
  function toNumber(v) {
    if (v === null || v === undefined || v === "") return 0;
    const s = String(v).replace(/\./g, "").replace(",", ".").trim();
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
  }

  function formatCOPNumber(value) {
    const n = Math.round(Number(value) || 0);
    return n.toLocaleString("es-CO");
  }

  function unformatCOP(value) {
    return String(value || "").replace(/\D/g, "");
  }

  function formatCOPDigitsOnly(value) {
    const digits = String(value || "").replace(/\D/g, "");
    const n = parseInt(digits || "0", 10);
    return n.toLocaleString("es-CO");
  }

  function attachCOPMask(input) {
    if (!input || input.dataset.copMask === "1") return;
    input.dataset.copMask = "1";

    input.addEventListener("input", () => {
      input.value = formatCOPDigitsOnly(input.value);
      input.setSelectionRange(input.value.length, input.value.length);
    });

    if (input.value) input.value = formatCOPDigitsOnly(input.value);
  }

  // =========================
  // Total
  // =========================
  function calcularTotal(scope) {
    const root = scope || document;
    const totalInput = qs(root, "#id_precio_total");
    if (!totalInput) return;

    let total = 0;

    qsa(root, ".detalle-item").forEach((item) => {
      const del = qs(item, 'input[name$="-DELETE"]');
      if (del && del.checked) return;
      if (item.classList.contains("d-none")) return;

      const cantidadInput = qs(item, 'input[name$="-cantidad"]');
      const precioInput = qs(item, 'input[name$="-precio_unitario"]');
      if (!cantidadInput || !precioInput) return;

      const cantidad = toNumber(cantidadInput.value);
      const precio = toNumber(precioInput.value);

      if (cantidad > 0 && precio >= 0) total += cantidad * precio;
    });

    totalInput.value = formatCOPNumber(total);
  }

  // =========================
  // Formset renumerar (si borras nodos)
  // =========================
  function renumerarForms(container, prefix) {
    const items = Array.from(container.querySelectorAll(".detalle-item"));
    items.forEach((item, newIndex) => {
      item.querySelectorAll("input, select, textarea, label").forEach((el) => {
        if (el.name) {
          el.name = el.name.replace(new RegExp(`^${prefix}-(\\d+)-`), `${prefix}-${newIndex}-`);
        }
        if (el.id) {
          el.id = el.id.replace(new RegExp(`^id_${prefix}-(\\d+)-`), `id_${prefix}-${newIndex}-`);
        }
        const f = el.getAttribute?.("for");
        if (f) {
          el.setAttribute("for", f.replace(new RegExp(`^id_${prefix}-(\\d+)-`), `id_${prefix}-${newIndex}-`));
        }
      });
    });
  }

  // =========================
  // Feedback bootstrap (rojo/verde)
  // =========================
  function hideGeneralErrors(form) {
    const box = qs(form, "#compraErroresGenerales");
    if (!box) return;
    box.classList.add("d-none");
    box.innerHTML = "";
  }

  function ensureFeedback(input) {
    if (!input) return null;
    const inputGroup = input.closest(".input-group");
    const anchor = inputGroup || input;

    let fb = anchor.parentElement?.querySelector(".invalid-feedback");
    if (!fb) {
      fb = document.createElement("div");
      fb.className = "invalid-feedback";
      anchor.insertAdjacentElement("afterend", fb);
    }
    return fb;
  }

  function markInvalid(input, msg) {
    if (!input) return;
    input.classList.add("is-invalid");
    input.classList.remove("is-valid");
    const fb = ensureFeedback(input);
    if (fb) fb.textContent = msg || "Campo inválido";
  }

  function markValid(input) {
    if (!input) return;
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    const fb = ensureFeedback(input);
    if (fb) fb.textContent = "";
  }

  function clearState(input) {
    if (!input) return;
    input.classList.remove("is-invalid", "is-valid");
    const fb = ensureFeedback(input);
    if (fb) fb.textContent = "";
  }

  // =========================
  // Validación principal
  // =========================
  function validateCompraForm(scope) {
    const root = scope || document;
    const form =
      root?.tagName === "FORM" ? root : qs(root, "#formCompra") || qs(document, "#formCompra");
    if (!form) return true;

    hideGeneralErrors(form);

    const btnGuardar = qs(form, "#btnGuardarCompra");
    const errores = [];

    const items = Array.from(form.querySelectorAll(".detalle-item"));
    const itemsActivos = items.filter((item) => {
      if (item.classList.contains("d-none")) return false;
      const del = item.querySelector('input[name$="-DELETE"]');
      if (del && del.checked) return false;
      return true;
    });

    const modo = form.dataset.modo || "crear";

    // proveedor
    const proveedor = qs(form, "#id_proveedor");
    if (proveedor) {
      if (!proveedor.value) {
        errores.push("Selecciona un proveedor.");
        markInvalid(proveedor, "Proveedor obligatorio");
      } else {
        markValid(proveedor);
      }
    }

    // validar filas
    const usados = new Map();
    let hayProductoReal = false;

    itemsActivos.forEach((item, idx) => {
      const productoSel = qs(item, 'select[name$="-producto"]');
      const cantidadInp = qs(item, 'input[name$="-cantidad"]');
      const precioInp = qs(item, 'input[name$="-precio_unitario"]');

      const productoVal = (productoSel?.value || "").trim();
      const cantidadRaw = (cantidadInp?.value || "").trim();
      const precioRaw = (precioInp?.value || "").trim();

      const filaVacia = !productoVal && !cantidadRaw && !precioRaw;
      if (filaVacia) {
        clearState(productoSel);
        clearState(cantidadInp);
        clearState(precioInp);
        return;
      }

      if (productoVal) hayProductoReal = true;

      if (!productoVal) {
        errores.push(`Producto requerido en la fila ${idx + 1}.`);
        markInvalid(productoSel, "Selecciona un producto");
      } else {
        markValid(productoSel);
        usados.set(productoVal, (usados.get(productoVal) || 0) + 1);
      }

      const cantidadVal = toNumber(cantidadRaw);
      if (cantidadVal <= 0) {
        errores.push(`La cantidad debe ser mayor que 0 (fila ${idx + 1}).`);
        markInvalid(cantidadInp, "Mayor que 0");
      } else {
        markValid(cantidadInp);
      }

      const precioVal = toNumber(precioRaw);
      if (precioVal <= 0) {
        errores.push(`El precio unitario debe ser mayor que 0 (fila ${idx + 1}).`);
        markInvalid(precioInp, "Mayor que 0");
      } else {
        markValid(precioInp);
      }
    });

    if (modo === "crear" && !hayProductoReal) {
      errores.push("Debes agregar al menos un producto.");
    }

    for (const [prodId, count] of usados.entries()) {
      if (count > 1) {
        errores.push("No puedes repetir el mismo producto en la compra.");
        qsa(form, 'select[name$="-producto"]').forEach((sel) => {
          if (sel.value === prodId) markInvalid(sel, "Producto duplicado");
        });
        break;
      }
    }

    const ok = errores.length === 0;
    if (btnGuardar) btnGuardar.disabled = !ok;
    return ok;
  }

  // =========================
  // Modales bootstrap
  // =========================
  let formModal = null;
  const formModalEl = document.getElementById("ajaxFormModal");
  const formModalTitleEl = document.getElementById("ajaxFormModalTitle");
  const formModalBodyEl = document.getElementById("ajaxFormModalBody");
  if (formModalEl) formModal = new bootstrap.Modal(formModalEl);

  let detalleModal = null;
  const detalleModalEl = document.getElementById("modalDetalleCompra");
  const detalleBodyEl = document.getElementById("detalleCompraBody");
  if (detalleModalEl) detalleModal = new bootstrap.Modal(detalleModalEl);

  async function openFormModal(url, title) {
    if (!formModal || !formModalTitleEl || !formModalBodyEl) return;

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

    formModalBodyEl.innerHTML =
      result.type === "json"
        ? result.data.html || `<div class="alert alert-danger">No se pudo cargar.</div>`
        : result.data;

    qsa(formModalEl, 'input[name$="-precio_unitario"]').forEach(attachCOPMask);
    calcularTotal(formModalEl);
    validateCompraForm(formModalEl);
  }

  // =========================
  // Click global
  // =========================
  document.body.addEventListener("click", async (e) => {
    // =========================
    // Toggle del buscador de compras
    // =========================
    const btnBusquedaToggle = e.target.closest("#btnBusquedaToggle");
    if (btnBusquedaToggle) {
      e.preventDefault();

      const wrapperBusqueda = document.getElementById("busquedaComprasWrapper");
      const boxBusqueda = document.getElementById("busquedaComprasBox");
      const inputBusqueda = document.getElementById("busquedaComprasInput");

      if (!wrapperBusqueda || !boxBusqueda || !inputBusqueda) {
        console.warn("Buscador de compras: no se encontraron los elementos.");
        return;
      }

      const estaAbierto = boxBusqueda.classList.contains("is-open");

      const abrirBuscador = () => {
        wrapperBusqueda.classList.add("is-open");
        boxBusqueda.classList.add("is-open");
        btnBusquedaToggle.setAttribute("aria-expanded", "true");

        setTimeout(() => {
          inputBusqueda.focus();
          const len = inputBusqueda.value.length;
          inputBusqueda.setSelectionRange(len, len);
        }, 180);
      };

      const cerrarBuscador = () => {
        wrapperBusqueda.classList.remove("is-open");
        boxBusqueda.classList.remove("is-open");
        btnBusquedaToggle.setAttribute("aria-expanded", "false");
      };

      if (estaAbierto) {
        if (inputBusqueda.value.trim()) {
          inputBusqueda.focus();
          return;
        }

        cerrarBuscador();
        return;
      }

      abrirBuscador();
      return;
    }
      // =========================
  // Cerrar buscador al hacer clic fuera o con Escape
  // =========================
  document.addEventListener("click", (e) => {
    const wrapperBusqueda = document.getElementById("busquedaComprasWrapper");
    const boxBusqueda = document.getElementById("busquedaComprasBox");
    const inputBusqueda = document.getElementById("busquedaComprasInput");
    const btnBusqueda = document.getElementById("btnBusquedaToggle");

    if (!wrapperBusqueda || !boxBusqueda || !inputBusqueda || !btnBusqueda) return;
    if (!boxBusqueda.classList.contains("is-open")) return;
    if (wrapperBusqueda.contains(e.target)) return;
    if (inputBusqueda.value.trim()) return;

    wrapperBusqueda.classList.remove("is-open");
    boxBusqueda.classList.remove("is-open");
    btnBusqueda.setAttribute("aria-expanded", "false");
  });

  document.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;

    const wrapperBusqueda = document.getElementById("busquedaComprasWrapper");
    const boxBusqueda = document.getElementById("busquedaComprasBox");
    const inputBusqueda = document.getElementById("busquedaComprasInput");
    const btnBusqueda = document.getElementById("btnBusquedaToggle");

    if (!wrapperBusqueda || !boxBusqueda || !inputBusqueda || !btnBusqueda) return;
    if (inputBusqueda.value.trim()) return;

    wrapperBusqueda.classList.remove("is-open");
    boxBusqueda.classList.remove("is-open");
    btnBusqueda.setAttribute("aria-expanded", "false");
  });

    // abrir modal crear/editar
    const trigger = e.target.closest("[data-modal-url]");
    if (trigger) {
      e.preventDefault();
      await openFormModal(
        trigger.getAttribute("data-modal-url"),
        trigger.getAttribute("data-modal-title") || "Formulario"
      );
      return;
    }

    // ver detalle
    const btnDetalle = e.target.closest(".js-ver-detalle");
    if (btnDetalle) {
      e.preventDefault();
      if (!detalleModal || !detalleBodyEl) return;

      const url = btnDetalle.getAttribute("data-url");
      if (!url) return;

      detalleBodyEl.innerHTML = `<div class="text-muted">Cargando...</div>`;
      detalleModal.show();

      try {
        const res = await fetch(url, {
          method: "GET",
          credentials: "same-origin",
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });
        const data = await res.json();
        detalleBodyEl.innerHTML =
          data.success && data.html
            ? data.html
            : `<div class="alert alert-danger">No se pudo cargar el detalle.</div>`;
      } catch (err) {
        console.error(err);
        detalleBodyEl.innerHTML = `<div class="alert alert-danger">Error cargando detalle.</div>`;
      }
      return;
    }

    // agregar producto
    const btnAdd = e.target.closest("#btnAgregarProducto");
    if (btnAdd) {
      e.preventDefault();

      const form = btnAdd.closest("form");
      if (!form) return;

      const container = qs(form, "#productosContainer");
      const template = qs(form, "#emptyFormTemplate");
      const totalForms = qs(form, 'input[name$="-TOTAL_FORMS"]');
      if (!container || !template || !totalForms) return;

      const index = parseInt(totalForms.value || "0", 10);
      const html = template.innerHTML.replace(/__prefix__/g, index);

      container.insertAdjacentHTML("beforeend", html);
      totalForms.value = index + 1;

      const newItem = container.lastElementChild;
      const newPrecio = qs(newItem, 'input[name$="-precio_unitario"]');
      attachCOPMask(newPrecio);

      calcularTotal(form);
      validateCompraForm(form);
      return;
    }

    // eliminar fila (marcar DELETE)
    const btnX = e.target.closest(".btn-eliminar-item");
    if (btnX) {
      e.preventDefault();

      const item = btnX.closest(".detalle-item");
      const form = btnX.closest("form");
      if (!item || !form) return;

      const container = qs(form, "#productosContainer");
      const totalForms = qs(form, 'input[name$="-TOTAL_FORMS"]');
      if (!container || !totalForms) return;

      const anyField = qs(item, "[name]");
      const m = anyField?.name?.match(/^([A-Za-z0-9_]+)-\d+-/);
      const prefix = m ? m[1] : null;

      const deleteInput = qs(item, 'input[name$="-DELETE"]');
      if (deleteInput) {
        deleteInput.checked = true;
        item.classList.add("d-none");
      } else {
        item.remove();
        totalForms.value = container.querySelectorAll(".detalle-item").length;
        if (prefix) renumerarForms(container, prefix);
      }

      calcularTotal(form);
      validateCompraForm(form);
      return;
    }

    // anular compra (AJAX)
    const btnAnular = e.target.closest(".js-anular-compra");
    if (btnAnular) {
      e.preventDefault();

      const url = btnAnular.getAttribute("data-url");
      const id = btnAnular.getAttribute("data-id");
      const proveedor = btnAnular.getAttribute("data-proveedor");
      if (!url) return;

      const confirm = await Swal.fire({
        title: "¿Anular compra?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, anular",
        cancelButtonText: "Cancelar",
      });
      if (!confirm.isConfirmed) return;

      try {
        const res = await fetch(url, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "X-CSRFToken": csrfFromCookie(),
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        const data = await res.json();

        if (data.success) {
          const fila = document.getElementById(`fila-compra-${id}`);
          if (fila) {
            fila.style.transition = "opacity .35s ease, transform .35s ease";
            fila.style.opacity = "0";
            fila.style.transform = "translateX(20px)";
            setTimeout(() => fila.remove(), 350);
          }
          await Swal.fire({
            icon: "success",
            title: "Compra anulada",
            timer: 1200,
            showConfirmButton: false,
          });
        } else {
          Swal.fire("Error", data.message || "No se pudo anular.", "error");
        }
      } catch (err) {
        console.error(err);
        Swal.fire("Error", "Error del servidor.", "error");
      }
      return;
    }
  });

  // =========================
  // Tiempo real (total + validación)
  // =========================
  document.addEventListener("input", (e) => {
    if (
      e.target.matches("#id_proveedor") ||
      e.target.matches('input[name$="-cantidad"]') ||
      e.target.matches('input[name$="-precio_unitario"]')
    ) {
      const form = e.target.closest("form") || document;
      calcularTotal(form);
      validateCompraForm(form);
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.matches('select[name$="-producto"]') || e.target.matches("#id_proveedor")) {
      const form = e.target.closest("form") || document;
      calcularTotal(form);
      validateCompraForm(form);
    }

    if (e.target.matches('input[name$="-precio_unitario"]')) {
      attachCOPMask(e.target);
      const form = e.target.closest("form") || document;
      calcularTotal(form);
      validateCompraForm(form);
    }
  });

  document.addEventListener("shown.bs.modal", (e) => {
    qsa(e.target, 'input[name$="-precio_unitario"]').forEach(attachCOPMask);
    calcularTotal(e.target);
    validateCompraForm(e.target);
  });

  // =========================
  // Submit AJAX del modal
  // =========================
  document.body.addEventListener("submit", async (e) => {
    const form = e.target.closest("#ajaxFormModal form");
    if (!form) return;

    e.preventDefault();
    if (!validateCompraForm(form)) return;

    // quitar formato COP antes de enviar
    qsa(form, 'input[name$="-precio_unitario"]').forEach((inp) => {
      inp.value = unformatCOP(inp.value);
    });

    const totalInp = qs(form, "#id_precio_total");
    if (totalInp) totalInp.value = unformatCOP(totalInp.value);

    const csrf = csrfFromCookie();
    if (!csrf) return;

    const result = await fetchSmart(form.action, {
      method: "POST",
      body: new FormData(form),
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRFToken": csrf,
      },
    });

    if (result.type === "json") {
      if (result.data.success) {
        formModal?.hide();
        await Swal.fire({
          title: "Éxito",
          text: result.data.message || "Guardado correctamente.",
          icon: "success",
          timer: 1400,
          showConfirmButton: false,
        });
        location.reload();
        return;
      }

      formModalBodyEl.innerHTML =
        result.data.html || `<div class="alert alert-danger">No se pudo guardar.</div>`;
      qsa(formModalEl, 'input[name$="-precio_unitario"]').forEach(attachCOPMask);
      calcularTotal(formModalEl);
      validateCompraForm(formModalEl);
      return;
    }

    // fallback HTML
    formModalBodyEl.innerHTML = result.data;
    qsa(formModalEl, 'input[name$="-precio_unitario"]').forEach(attachCOPMask);
    calcularTotal(formModalEl);
    validateCompraForm(formModalEl);
  });
})();
document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("modalComprobanteCompra");
  const modalBody = document.getElementById("comprobanteCompraBody");
  const btnDescargar = document.getElementById("btnDescargarComprobante");

  if (!modalEl || !modalBody || !btnDescargar) return;

  const comprobanteModal = new bootstrap.Modal(modalEl);

  let currentPdfUrl = null;
  let currentExcelUrl = null;

  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest(".js-ver-comprobante");
    if (!btn) return;

    e.preventDefault();

    const url = btn.getAttribute("data-url");
    currentPdfUrl = btn.getAttribute("data-pdf-url");
    currentExcelUrl = btn.getAttribute("data-excel-url");

    modalBody.innerHTML = `<div class="text-center py-5 text-muted">Cargando comprobante...</div>`;
    comprobanteModal.show();

    try {
      const res = await fetch(url, {
        method: "GET",
        credentials: "same-origin",
        headers: { "X-Requested-With": "XMLHttpRequest" }
      });

      const data = await res.json();
      modalBody.innerHTML = data.success
        ? data.html
        : `<div class="alert alert-danger">No se pudo cargar el comprobante.</div>`;
    } catch (err) {
      console.error(err);
      modalBody.innerHTML = `<div class="alert alert-danger">Error cargando comprobante.</div>`;
    }
  });

  btnDescargar.addEventListener("click", async () => {
    const result = await Swal.fire({
      title: "Descargar comprobante",
      text: "¿En qué formato quieres descargarlo?",
      icon: "question",
      showCancelButton: true,
      showDenyButton: true,
      confirmButtonText: "PDF",
      denyButtonText: "Excel",
      cancelButtonText: "Cancelar",
    });

    if (result.isConfirmed && currentPdfUrl) {
      window.open(currentPdfUrl, "_blank");
    } else if (result.isDenied && currentExcelUrl) {
      window.open(currentExcelUrl, "_blank");
    }
  });
});
