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
            animarHaciaCaja(fila, {
              id,
              proveedor,
              // si tu backend lo devuelve, perfecto (si no, cae en defaults)
              fecha_anulada: data.fecha_anulada, // "YYYY-MM-DD"
              fecha_creacion: data.fecha_creacion, // "YYYY-MM-DD"
              usuario: data.usuario,
              total: data.total,
            });
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

// ======================================================
// Animación anular 
// ======================================================
function animarHaciaCaja(fila, dataCompra) {

  const filaRect = fila.getBoundingClientRect();

  const clon = fila.cloneNode(true);
  clon.style.position = "fixed";
  clon.style.left = filaRect.left + "px";
  clon.style.top = filaRect.top + "px";
  clon.style.width = filaRect.width + "px";
  clon.style.transition = "all 1.1s cubic-bezier(.2,.8,.2,1)";
  clon.style.zIndex = 10000;
  clon.style.background = "#f8d7da";
  clon.style.borderRadius = "10px";
  clon.style.boxShadow = "0 12px 30px rgba(0,0,0,.15)";

  document.body.appendChild(clon);

  requestAnimationFrame(() => {
    clon.style.opacity = "0";
    clon.style.transform = "translateY(30px) scale(0.92)";
    clon.style.filter = "blur(1px)";
  });

  setTimeout(() => {
    agregarAnulada(dataCompra);
    clon.remove();
    fila.remove();
  }, 1150);
}

function agregarAnulada(dataCompra) {
  // contador FAB
  const contador = document.querySelector("#contador-anuladas");
  if (contador) {
    const cur = parseInt(contador.textContent || "0", 10) || 0;
    contador.textContent = String(cur + 1);
  }

  const tbody = document.querySelector("#tbodyAnuladas");
  if (!tbody) return;

  // dataset.fecha debe ser fecha_anulada en Y-m-d para filtrar/ordenar
  const fechaAnuladaYMD = dataCompra.fecha_anulada || dataCompra.fecha || "";
  const fechaCreacionHuman = dataCompra.fecha_creacion_humana || dataCompra.fecha_creacion || "";
  const fechaAnuladaHuman = dataCompra.fecha_anulada_humana || dataCompra.fecha_anulada || "";
  const usuario = dataCompra.usuario || "";
  const proveedor = dataCompra.proveedor || "";
  const total = dataCompra.total || "";

  const tr = document.createElement("tr");
  tr.className = "anulada-row";
  tr.dataset.fecha = fechaAnuladaYMD;
  tr.dataset.id = String(dataCompra.id ?? "");
  tr.dataset.proveedor = String(proveedor).toLowerCase();
  tr.dataset.usuario = String(usuario).toLowerCase();
  tr.dataset.total = String(total);

  tr.innerHTML = `
    <td>${dataCompra.id ?? ""}</td>
    <td>${proveedor}</td>
    <td>${fechaCreacionHuman}</td>
    <td>${fechaAnuladaHuman}</td>
    <td>${usuario}</td>
    <td class="text-end">${total}</td>
  `;

  tbody.prepend(tr);
  tr.dataset.id = String(dataCompra.id ?? "");
  tr.dataset.proveedor = String(proveedor).toLowerCase();
  tr.dataset.usuario = String(usuario).toLowerCase();
  tr.dataset.total = String(total);

  // al agregar, si el modal está abierto, re-aplicamos paginado/filtros
  const modal = document.getElementById("modalAnuladas");
  if (modal && modal.classList.contains("show")) {
    modal.dispatchEvent(new Event("recalc-anuladas"));
  }
}

// ======================================================
// Modal anuladas: filtro + orden + búsqueda + SCROLL INFINITO + export + restaurar
// ======================================================
document.addEventListener("DOMContentLoaded", () => {
  const modal = document.getElementById("modalAnuladas");
  if (!modal) return;

  const desde = document.getElementById("anuladasDesde");
  const hasta = document.getElementById("anuladasHasta");
  const orden = document.getElementById("anuladasOrden");
  const tbody = document.getElementById("tbodyAnuladas");
  const wrap = document.getElementById("anuladasScrollWrap");
  const buscador = document.getElementById("anuladasBuscar") || document.getElementById("anuladasSearch");
if (buscador) {
  buscador.addEventListener("input", () => {
    visibles = 10;
    render();
    wrap.scrollTop = 0;
  });
}
  const vacio = document.getElementById("anuladasVacio");
  const btnReset = document.getElementById("btnResetAnuladas");
  const btnExcel = document.getElementById("btnExportExcel");
  const btnPDF = document.getElementById("btnExportPDF");

  if (!desde || !hasta || !orden || !tbody || !wrap) return;

  // ---- UI extra (buscador + contador)
  function ensureUI() {
    let search = document.getElementById("anuladasSearch");
    let counter = document.getElementById("anuladasCounter");

    if (!search) {
      const row = modal.querySelector(".row.g-2.align-items-end.mb-3");
      if (row) {
        const col = document.createElement("div");
        col.className = "col-12";
        col.innerHTML = `
          <label class="form-label mb-1">Buscar</label>
          <input id="anuladasSearch" class="form-control" placeholder="Buscar por #, proveedor o usuario..." />
          <div id="anuladasCounter" class="mt-1"></div>
        `;
        row.insertAdjacentElement("afterend", col);
        search = document.getElementById("anuladasSearch");
        counter = document.getElementById("anuladasCounter");
      }
    }

    if (search && !search.dataset.bound) {
      search.dataset.bound = "1";
      search.addEventListener("input", () => {
        visibles = 10;
        render();
        wrap.scrollTop = 0;
      });
    }

    if (counter) counter.classList.add("text-muted");
  }

  function parseYMD(s) {
    if (!s) return null;
    const [y, m, d] = s.split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  }

  function getRows() {
    return Array.from(tbody.querySelectorAll("tr.anulada-row"));
  }

function getSearch() {
  return(
    document.getElementById("anuladasSearch")?.value ||
    document.getElementById("anuladasBuscar")?.value ||
    ""
  ).trim().toLowerCase();
}



  // ---- estado paginado (scroll infinito)
  let visibles = 10;

  function applyFilterAndHide(rows) {
    const d1 = parseYMD(desde.value);
    const d2raw = parseYMD(hasta.value);
    const d2 = d2raw
      ? new Date(d2raw.getFullYear(), d2raw.getMonth(), d2raw.getDate(), 23, 59, 59, 999)
      : null;

    const q = getSearch();
    let count = 0;

    rows.forEach((tr) => {
      const f = parseYMD(tr.dataset.fecha);
      let ok = true;

      if (d1 && (!f || f < d1)) ok = false;
      if (d2 && (!f || f > d2)) ok = false;

     if (q) {
  const isNumber = /^\d+$/.test(q);

  if (isNumber) {
    const id = String(tr.dataset.id || "");
    if (id !== q) ok = false;
  } else {
    const prov = String(tr.dataset.proveedor || "");
    const user = String(tr.dataset.usuario || "");
    if (!prov.includes(q) && !user.includes(q)) ok = false;
  }
}

      tr.classList.toggle("d-none", !ok);
      if (ok) count++;
    });

    if (vacio) vacio.classList.toggle("d-none", count !== 0);
    return count;
  }

  function applyOrder(rows) {
    const visiblesRows = rows.filter((r) => !r.classList.contains("d-none"));
    visiblesRows.sort((a, b) => {
      const fa = parseYMD(a.dataset.fecha)?.getTime() ?? 0;
      const fb = parseYMD(b.dataset.fecha)?.getTime() ?? 0;
      return orden.value === "old" ? fa - fb : fb - fa;
    });

    const ocultas = rows.filter((r) => r.classList.contains("d-none"));
    [...visiblesRows, ...ocultas].forEach((r) => tbody.appendChild(r));
  }

  function applyInfinite(rows, countVisibles) {
    const counter = document.getElementById("anuladasCounter");
    const visiblesRows = rows.filter((r) => !r.classList.contains("d-none"));

    visiblesRows.forEach((tr, idx) => {
      tr.style.display = idx < visibles ? "" : "none";
    });
    rows.filter((r) => r.classList.contains("d-none")).forEach((r) => (r.style.display = "none"));

    if (counter) {
      const showing = Math.min(visibles, visiblesRows.length);
      counter.textContent = `Mostrando ${showing} de ${visiblesRows.length} (total: ${rows.length})`;
    }
  }

  function currentQueryParams() {
    // para export y para consistencia
    const params = new URLSearchParams();
    if (desde.value) params.set("desde", desde.value);
    if (hasta.value) params.set("hasta", hasta.value);
    if (orden.value) params.set("orden", orden.value);
    const q = getSearch();
    if (q) params.set("q", q);
    return params;
  }

  function updateExportLinks() {
    if (!btnExcel || !btnPDF) return;
    const params = currentQueryParams().toString();
    btnExcel.href = `/compras/anuladas/export/excel/?${params}`;
    btnPDF.href = `/compras/anuladas/export/pdf/?${params}`;
  }

  function render() {
    ensureUI();
    const rows = getRows();
    const countVisibles = applyFilterAndHide(rows);
    applyOrder(rows);
    applyInfinite(rows, countVisibles);
    updateExportLinks();
  }

  // ---- eventos filtros
  ["change", "input"].forEach((evt) => {
    desde.addEventListener(evt, () => {
      visibles = 10;
      render();
      wrap.scrollTop = 0;
    });
    hasta.addEventListener(evt, () => {
      visibles = 10;
      render();
      wrap.scrollTop = 0;
    });
  });

  orden.addEventListener("change", () => {
    visibles = 10;
    render();
    wrap.scrollTop = 0;
  });

  if (btnReset) {
    btnReset.addEventListener("click", () => {
      desde.value = "";
      hasta.value = "";
      orden.value = "new";
      const search = document.getElementById("anuladasSearch");
      if (search) search.value = "";
      visibles = 10;
      render();
      wrap.scrollTop = 0;
    });
  }

  // ---- scroll infinito: cuando llegue casi al fondo => +10
  wrap.addEventListener("scroll", () => {
    const nearBottom = wrap.scrollTop + wrap.clientHeight >= wrap.scrollHeight - 60;
    if (!nearBottom) return;

    const visiblesRows = getRows().filter((r) => !r.classList.contains("d-none"));
    if (visibles < visiblesRows.length) {
      visibles += 10;
      render();
    }
  });

  // al abrir modal siempre arranca en 10
  modal.addEventListener("shown.bs.modal", () => {
    visibles = 10;
    render();
    wrap.scrollTop = 0;
  });

  // ======================================================
  // Restaurar (AJAX)
  // ======================================================
  document.body.addEventListener("click", async (e) => {
    const btn = e.target.closest(".js-restaurar-compra");
    if (!btn) return;

    e.preventDefault();
    const url = btn.getAttribute("data-url");
    if (!url) return;

    const tr = btn.closest("tr.anulada-row");
    const id = tr?.dataset?.id;

    const confirm = await Swal.fire({
      title: "¿Restaurar compra?",
      text: "Se reactivará la compra y volverá a afectar stock.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, restaurar",
      cancelButtonText: "Cancelar",
    });
    if (!confirm.isConfirmed) return;

    try {
      btn.disabled = true;

      const res = await fetch(url, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "X-Requested-With": "XMLHttpRequest",
          "X-CSRFToken": (document.cookie.match(/csrftoken=([^;]+)/) || [])[1] || "",
        },
      });
      const data = await res.json();

      if (!data.success) {
        btn.disabled = false;
        Swal.fire("Error", data.message || "No se pudo restaurar.", "error");
        return;
      }

      // quitar fila del modal
      if (tr) tr.remove();

      // bajar contador
      const contador = document.getElementById("contador-anuladas");
      if (contador) {
        const cur = parseInt(contador.textContent || "0", 10) || 0;
        contador.textContent = String(Math.max(0, cur - 1));
      }

      // opcional: recargar para que aparezca en tabla principal
      await Swal.fire({
        icon: "success",
        title: "Compra restaurada",
        timer: 1100,
        showConfirmButton: false,
      });

      location.reload();
    } catch (err) {
      console.error(err);
      btn.disabled = false;
      Swal.fire("Error", "Error del servidor.", "error");
    }
    
  });

});
function actualizarCountAnuladas() {
  const rows = [...document.querySelectorAll("#tbodyAnuladas tr.anulada-row")];
  const visibles = rows.filter(r => !r.classList.contains("d-none")).length;
  document.getElementById("anuladasCount").textContent = `Mostrando ${visibles}`;
}