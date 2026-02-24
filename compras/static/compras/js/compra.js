document.addEventListener("DOMContentLoaded", () => {
  // =========================
  // HELPERS
  // =========================
    // =========================
  // ELIMINAR ITEM (X) - FORMSET
  // =========================

  function renumerarForms(container, prefix) {
    const items = Array.from(container.querySelectorAll(".detalle-item"));

    items.forEach((item, newIndex) => {
      item.querySelectorAll("input, select, textarea, label").forEach((el) => {
        // name="detalles-3-cantidad" -> detalles-0-cantidad
        if (el.name) {
          el.name = el.name.replace(
            new RegExp(`^${prefix}-(\\d+)-`),
            `${prefix}-${newIndex}-`
          );
        }

        // id="id_detalles-3-cantidad" -> id_detalles-0-cantidad
        if (el.id) {
          el.id = el.id.replace(
            new RegExp(`^id_${prefix}-(\\d+)-`),
            `id_${prefix}-${newIndex}-`
          );
        }

        // for="id_detalles-3-cantidad"
        const f = el.getAttribute?.("for");
        if (f) {
          el.setAttribute(
            "for",
            f.replace(
              new RegExp(`^id_${prefix}-(\\d+)-`),
              `id_${prefix}-${newIndex}-`
            )
          );
        }
      });
    });
  }

  // 👇 OJO: este listener debe ser GLOBAL y no romper tu otro click handler
  // Por eso NO reemplazamos el tuyo: solo añadimos este "if" dentro del MISMO click global
  // Si prefieres: pega este "if" dentro de tu document.body.addEventListener("click", async (e) => { ... })
  // justo antes del "AGREGAR PRODUCTO".
  document.body.addEventListener("click", (e) => {
    const btnX = e.target.closest(".btn-eliminar-item");
    if (!btnX) return;

    e.preventDefault();

    const item = btnX.closest(".detalle-item");
    const form = btnX.closest("form");
    if (!item || !form) return;

    const container = form.querySelector("#productosContainer");
    const totalForms = form.querySelector('input[name$="-TOTAL_FORMS"]');
    if (!container || !totalForms) return;

    // detectar prefix del formset (ej: detalles-0-producto)
    const anyField = item.querySelector("[name]");
    const m = anyField?.name?.match(/^([A-Za-z0-9_]+)-\d+-/);
    const prefix = m ? m[1] : null;

    // si existe DELETE => estamos en formset can_delete (editar o incluso crear)
    const deleteInput = item.querySelector('input[name$="-DELETE"]');

    if (deleteInput) {
        deleteInput.checked = true;
      item.classList.add("d-none");

      // recalcular total
      calcularTotal(form);
      // validar (si tienes validación en tiempo real)
      if (typeof validateCompraForm === "function") validateCompraForm(form);
      return;
    }


    item.remove();

    totalForms.value = container.querySelectorAll(".detalle-item").length;

    if (prefix) renumerarForms(container, prefix);

    calcularTotal(form);
    if (typeof validateCompraForm === "function") validateCompraForm(form);
  });
  function getCookie(name) {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  }

  function csrfFromCookie() {
    return getCookie("csrftoken") || "";
  }

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

  function toNumber(v) {
    if (v === null || v === undefined || v === "") return 0;
    const s = String(v).replace(/\./g, "").replace(",", "."); // quita miles, soporta coma decimal
    const n = parseFloat(s);
    return Number.isFinite(n) ? n : 0;
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
    const start = input.selectionStart || 0;
    const before = input.value;

    input.value = formatCOPDigitsOnly(before);

    // cursor al final (simple y estable)
    input.setSelectionRange(input.value.length, input.value.length);
  });

  input.addEventListener("focus", () => {
    if (!input.value) input.value = "";
  });

  // formatea si viene con valor
  if (input.value) input.value = formatCOPDigitsOnly(input.value);
}

  // Calcula total recorriendo tus .detalle-item (NO tbody)
  function calcularTotal(scope) {
    const root = scope || document;

    const totalInput = root.querySelector("#id_precio_total");
    if (!totalInput) return;

    let total = 0;

    // recorre todos los items de productos
    root.querySelectorAll(".detalle-item").forEach((item) => {
      const cantidadInput = item.querySelector('input[name$="-cantidad"]');
      const precioInput = item.querySelector('input[name$="-precio_unitario"]');

      if (!cantidadInput || !precioInput) return;

      const cantidad = toNumber(cantidadInput.value);
      const precio = toNumber(precioInput.value);

      if (cantidad > 0 && precio >= 0) total += cantidad * precio;
    });

    // total en formato COP
    totalInput.value = formatCOPNumber(total);
  }

  function isCreateMode(form) {
    return (form?.action || "").toLowerCase().includes("/crear");
  }

  // =========================
  // MODAL FORM (CREAR/EDITAR)
  // =========================
  const formModalEl = document.getElementById("ajaxFormModal");
  const formModalTitleEl = document.getElementById("ajaxFormModalTitle");
  const formModalBodyEl = document.getElementById("ajaxFormModalBody");
  const formModal = formModalEl ? new bootstrap.Modal(formModalEl) : null;

  // =========================
  // MODAL DETALLE
  // =========================
  const detalleModalEl = document.getElementById("modalDetalleCompra");
  const detalleBodyEl = document.getElementById("detalleCompraBody");
  const detalleModal = detalleModalEl ? new bootstrap.Modal(detalleModalEl) : null;

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
    } else {
      formModalBodyEl.innerHTML = result.data;
    }

    // aplicar máscara COP a precios dentro del modal
    formModalEl.querySelectorAll('input[name$="-precio_unitario"]').forEach(attachCOPMask);
    calcularTotal(formModalEl);
  }

  // =========================
  // CLICK GLOBAL (UNA SOLA VEZ)
  // =========================
  document.body.addEventListener("click", async (e) => {
    // CREAR/EDITAR
    const trigger = e.target.closest("[data-modal-url]");
    if (trigger) {
      e.preventDefault();
      const url = trigger.getAttribute("data-modal-url");
      const title = trigger.getAttribute("data-modal-title") || "Formulario";
      await openFormModal(url, title);
      return;
    }

    // VER DETALLE
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
          method: "GET",
          credentials: "same-origin",
          headers: { "X-Requested-With": "XMLHttpRequest" },
        });

        const data = await res.json();
        if (data.success && data.html) {
          detalleBodyEl.innerHTML = data.html;
        } else {
          detalleBodyEl.innerHTML = `<div class="alert alert-danger">No se pudo cargar el detalle.</div>`;
        }
      } catch (err) {
        detalleBodyEl.innerHTML = `<div class="alert alert-danger">Error cargando detalle.</div>`;
        console.error(err);
      }
      return;
    }

    // ANULAR COMPRA
    const btnAnular = e.target.closest(".js-anular-compra");
    if (btnAnular) {
      e.preventDefault();

      const url = btnAnular.dataset.url;
      if (!url) return;

      const confirm = await Swal.fire({
        title: "Anular compra",
        text: "Esto revertirá el stock ingresado por esta compra. ¿Deseas continuar?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, anular",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#ffc107",
        cancelButtonColor: "#6c757d",
      });

      if (!confirm.isConfirmed) return;

      const csrf = csrfFromCookie();
      if (!csrf || csrf.length < 20) {
        await Swal.fire({
          title: "CSRF no encontrado",
          text: "Recarga la página e inicia sesión de nuevo.",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
        return;
      }

      try {
        btnAnular.disabled = true;

        const res = await fetch(url, {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "X-CSRFToken": csrf,
            "X-Requested-With": "XMLHttpRequest",
          },
        });

        const contentType = (res.headers.get("content-type") || "").toLowerCase();
        if (!contentType.includes("application/json")) {
          const txt = await res.text();
          console.error("Respuesta no JSON:", res.status, txt);
          throw new Error(`Respuesta no JSON (status ${res.status})`);
        }

        const data = await res.json();

        if (data.status === "ok") {
          await Swal.fire({
            title: "Anulada",
            text: data.message || "Compra anulada y stock revertido.",
            icon: "success",
            timer: 1600,
            showConfirmButton: false,
          });
          location.reload();
          return;
        }

        if (data.status === "already") {
          await Swal.fire({
            title: "Ya anulada",
            text: data.message || "Esta compra ya estaba anulada.",
            icon: "info",
            confirmButtonColor: "#0d6efd",
          });
          return;
        }

        await Swal.fire({
          title: "No se pudo anular",
          text: data.message || "Ocurrió un error.",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      } catch (err) {
        console.error(err);
        await Swal.fire({
          title: "Error",
          text: "No fue posible procesar la solicitud.",
          icon: "error",
          confirmButtonColor: "#dc3545",
        });
      } finally {
        btnAnular.disabled = false;
      }
      return;
    }

    // AGREGAR PRODUCTO (FORMSET)
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

      // aplicar mask al nuevo input precio
      const newItem = container.lastElementChild;
      const newPrecio = newItem?.querySelector('input[name$="-precio_unitario"]');
      attachCOPMask(newPrecio);

      calcularTotal(form);
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

    //  IMPORTANTE: antes de enviar, limpiar puntos de miles
    form.querySelectorAll('input[name$="-precio_unitario"]').forEach((inp) => {
      inp.value = unformatCOP(inp.value);
    });
    // total readonly también
    const totalInp = form.querySelector("#id_precio_total");
    if (totalInp) totalInp.value = unformatCOP(totalInp.value);

    const url = form.action;
    const formData = new FormData(form);

    const csrf = csrfFromCookie();
    if (!csrf || csrf.length < 20) {
      await Swal.fire({
        title: "CSRF no encontrado",
        text: "Recarga la página e inicia sesión de nuevo.",
        icon: "error",
        confirmButtonColor: "#dc3545",
      });
      return;
    }

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
        formModal?.hide();

        const msg =
          result.data.message ||
          (isCreateMode(form)
            ? "Compra registrada correctamente."
            : "Se editó correctamente.");

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

      formModalTitleEl.textContent = result.data.title || formModalTitleEl.textContent;
      formModalBodyEl.innerHTML =
        result.data.html || `<div class="alert alert-danger mb-0">No se pudo guardar.</div>`;

      // re-aplicar mask porque el backend devolvió el form con errores
      formModalEl.querySelectorAll('input[name$="-precio_unitario"]').forEach(attachCOPMask);
      calcularTotal(formModalEl);
      return;
    }

    formModalBodyEl.innerHTML = result.data;
    await Swal.fire({
      title: "No se pudo guardar",
      text: "Revisa el formulario.",
      icon: "error",
      confirmButtonColor: "#dc3545",
    });
  });

  // =========================
  // RECALCULAR TOTAL 
  // =========================
  document.addEventListener("input", (e) => {
    if (
      e.target.matches('input[name$="-cantidad"]') ||
      e.target.matches('input[name$="-precio_unitario"]')
    ) {
      const scope = e.target.closest("form") || document;
      calcularTotal(scope);
    }
  });

  document.addEventListener("shown.bs.modal", (e) => {
    const modal = e.target;
    modal.querySelectorAll('input[name$="-precio_unitario"]').forEach(attachCOPMask);
    calcularTotal(modal);
  });

  document.querySelectorAll('input[name$="-precio_unitario"]').forEach(attachCOPMask);
  calcularTotal(document);
});
// =========================
// VALIDACIONES EN TIEMPO REAL (COMPRAS)
// =========================
function showGeneralErrors(messages = []) {
  const box = document.getElementById("compraErroresGenerales");
  if (!box) return;

  if (!messages.length) {
    box.classList.add("d-none");
    box.innerHTML = "";
    return;
  }

  box.classList.remove("d-none");
  box.innerHTML = `
    <strong>Revisa estos campos:</strong>
    <ul class="mb-0 mt-2">
      ${messages.map(m => `<li>${m}</li>`).join("")}
    </ul>
  `;
}

function markInvalid(input, msg) {
  if (!input) return;
  input.classList.add("is-invalid");

  // crea/actualiza feedback
  let fb = input.parentElement?.querySelector(".invalid-feedback");
  if (!fb) {
    fb = document.createElement("div");
    fb.className = "invalid-feedback";
    // si está dentro de input-group, pon el feedback después del input-group
    if (input.closest(".input-group")) {
      input.closest(".input-group").insertAdjacentElement("afterend", fb);
    } else {
      input.insertAdjacentElement("afterend", fb);
    }
  }
  fb.textContent = msg || "Campo inválido";
}

function clearInvalid(input) {
  if (!input) return;
  input.classList.remove("is-invalid");

  // NO borramos el feedback siempre, pero lo ocultamos si quieres:
  const fb = input.parentElement?.querySelector(".invalid-feedback");
  if (fb) fb.textContent = "";
}

function validateCompraForm(scope) {
  const root = scope || document;
  const form = root.querySelector("#formCompra") || root.closest("#formCompra") || document.querySelector("#formCompra");
  if (!form) return true;

  const btnGuardar = form.querySelector("#btnGuardarCompra");
  const errores = [];

  // --- proveedor obligatorio ---
  const proveedor = form.querySelector("#id_proveedor");
  if (proveedor) {
    if (!proveedor.value) {
      errores.push("Selecciona un proveedor.");
      markInvalid(proveedor, "Proveedor obligatorio");
    } else {
      clearInvalid(proveedor);
    }
  }

  // --- validar items y duplicados ---
  const usados = new Map();
  form.querySelectorAll(".detalle-item").forEach((item, idx) => {
    const productoSel = item.querySelector('select[name$="-producto"]');
    const cantidadInp = item.querySelector('input[name$="-cantidad"]');
    const precioInp = item.querySelector('input[name$="-precio_unitario"]');

    // producto obligatorio
    if (productoSel) {
      if (!productoSel.value) {
        errores.push(`Producto requerido en la fila ${idx + 1}.`);
        markInvalid(productoSel, "Selecciona un producto");
      } else {
        clearInvalid(productoSel);
        usados.set(productoSel.value, (usados.get(productoSel.value) || 0) + 1);
      }
    }

    // cantidad > 0
    if (cantidadInp) {
      const c = toNumber(cantidadInp.value);
      if (c <= 0) {
        errores.push(`La cantidad debe ser mayor que 0 (fila ${idx + 1}).`);
        markInvalid(cantidadInp, "Debe ser mayor que 0");
      } else {
        clearInvalid(cantidadInp);
      }
    }

    // precio > 0
    if (precioInp) {
      const p = toNumber(precioInp.value);
      if (p <= 0) {
        errores.push(`El precio unitario debe ser mayor que 0 (fila ${idx + 1}).`);
        markInvalid(precioInp, "Debe ser mayor que 0");
      } else {
        clearInvalid(precioInp);
      }
    }
  });

  // --- duplicados ---
  for (const [prodId, count] of usados.entries()) {
    if (count > 1) {
      errores.push("No puedes repetir el mismo producto en la compra.");
      // marcar todos los selects duplicados como invalid
      form.querySelectorAll('select[name$="-producto"]').forEach(sel => {
        if (sel.value === prodId) markInvalid(sel, "Producto duplicado");
      });
      break;
    }
  }

  // mensajes generales
  showGeneralErrors(errores);

  // habilitar/deshabilitar botón
  const ok = errores.length === 0;
  if (btnGuardar) btnGuardar.disabled = !ok;

  return ok;
}

// Validar al escribir/cambiar
document.addEventListener("input", (e) => {
  if (
    e.target.matches("#id_proveedor") ||
    e.target.matches('input[name$="-cantidad"]') ||
    e.target.matches('input[name$="-precio_unitario"]')
  ) {
    const scope = e.target.closest("form") || document;
    validateCompraForm(scope);
  }
});

document.addEventListener("change", (e) => {
  if (e.target.matches('select[name$="-producto"]') || e.target.matches("#id_proveedor")) {
    const scope = e.target.closest("form") || document;
    validateCompraForm(scope);
  }
});

// Validar cuando abre el modal 
document.addEventListener("shown.bs.modal", (e) => {
  validateCompraForm(e.target);
});

// Validar una vez al cargar
validateCompraForm(document);

document.addEventListener("submit", (e) => {
  const form = e.target.closest("#formCompra");
  if (!form) return;

  const ok = validateCompraForm(form);
  if (!ok) {
    e.preventDefault();
    e.stopPropagation();
  }
});