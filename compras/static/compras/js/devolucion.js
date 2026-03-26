(() => {
  "use strict";

  const qs = (root, sel) => (root || document).querySelector(sel);
  const qsa = (root, sel) => Array.from((root || document).querySelectorAll(sel));

  function formatCOPNumber(value) {
    const n = Math.round(Number(value) || 0);
    return n.toLocaleString("es-CO");
  }

  const PATRON_TEXTO_PELIGROSO = /({{|}}|{%|%}|<\s*script|javascript\s*:|on\w+\s*=)/i;
  const MOTIVOS_VALIDOS = new Set([
    "defecto_fabrica",
    "producto_incorrecto",
    "producto_danado",
    "garantia",
    "otro",
  ]);

  function actualizarOpcionesDetalles(form, detalles) {
    const selects = qsa(
      form,
      'select[name$="-detalle_compra"], select[id$="-detalle_compra"]'
    );

    selects.forEach((select) => {
      const actual = select.value;
      select.replaceChildren(new Option("---------", ""));

      detalles.forEach((item) => {
        const option = new Option(String(item.texto || ""), String(item.id || ""));
        option.dataset.precio = String(item.precio_unitario || 0);
        option.dataset.disponible = String(item.disponible || 0);

        if (String(item.id) === String(actual)) {
          option.selected = true;
        }

        select.appendChild(option);
      });
    });
  }

  function sincronizarCantidadDisponible(form) {
    if (!form) return;

    qsa(form, ".detalle-item").forEach((item) => {
      if (item.classList.contains("d-none")) return;

      const del = qs(item, 'input[name$="-DELETE"]');
      if (del && del.checked) return;

      const detalleSelect = qs(item, 'select[name$="-detalle_compra"], select[id$="-detalle_compra"]');
      const cantidadInput = qs(item, 'input[name$="-cantidad"]');

      if (!detalleSelect || !cantidadInput) return;

      const option = detalleSelect.options[detalleSelect.selectedIndex];
      const disponible = Number(option?.dataset?.disponible || 0);

      if (disponible > 0) {
        cantidadInput.max = String(disponible);
        cantidadInput.dataset.disponible = String(disponible);

        const actual = Number(cantidadInput.value || 0);
        if (!actual || actual > disponible) {
          cantidadInput.value = String(disponible);
        }
      } else {
        cantidadInput.removeAttribute("max");
        delete cantidadInput.dataset.disponible;
      }
    });

    calcularTotalDevolucion(form);
  }

  function calcularTotalDevolucion(form) {
    if (!form) return;

    let total = 0;

    qsa(form, ".detalle-item").forEach((item) => {
      if (item.classList.contains("d-none")) return;

      const del = qs(item, 'input[name$="-DELETE"]');
      if (del && del.checked) return;

      const detalleSelect = qs(item, 'select[name$="-detalle_compra"], select[id$="-detalle_compra"]');
      const cantidadInput = qs(item, 'input[name$="-cantidad"]');

      if (!detalleSelect || !cantidadInput) return;

      const option = detalleSelect.options[detalleSelect.selectedIndex];
      const precio = Number(option?.dataset?.precio || 0);
      const cantidad = Number(cantidadInput.value || 0);

      if (precio > 0 && cantidad > 0) {
        total += precio * cantidad;
      }
    });

    const totalInput = qs(form, "#id_total_devolucion");
    if (totalInput) totalInput.value = formatCOPNumber(total);
  }

  async function cargarDetalles(form) {
    if (!form) return;

    const compraSelect = qs(form, "#id_compra");
    const url = form.getAttribute("data-detalles-url") || "/compras/ajax/cargar-detalles-compra/";

    if (!compraSelect || !compraSelect.value) {
      actualizarOpcionesDetalles(form, []);
      sincronizarCantidadDisponible(form);
      return;
    }

    try {
      const res = await fetch(`${url}?compra_id=${compraSelect.value}`, {
        method: "GET",
        credentials: "same-origin",
        headers: { "X-Requested-With": "XMLHttpRequest" },
      });

      const data = await res.json();
      actualizarOpcionesDetalles(form, data.detalles || []);
      sincronizarCantidadDisponible(form);
    } catch (error) {
      console.error("Error cargando detalles de compra:", error);
      actualizarOpcionesDetalles(form, []);
      sincronizarCantidadDisponible(form);
    }
  }

  function agregarFila(form) {
    const container = qs(form, "#detallesDevolucionContainer");
    const template = qs(form, "#emptyFormTemplateDevolucion");
    const totalForms = qs(form, "#id_detalles-TOTAL_FORMS");

    if (!container || !template || !totalForms) return;

    const index = parseInt(totalForms.value || "0", 10);
    const html = template.innerHTML.replace(/__prefix__/g, index);

    container.insertAdjacentHTML("beforeend", html);
    totalForms.value = index + 1;

    cargarDetalles(form);
  }

  function eliminarFila(item) {
    const deleteInput = qs(item, 'input[name$="-DELETE"]');

    if (deleteInput) {
      deleteInput.checked = true;
      item.classList.add("d-none");
    } else {
      item.remove();
    }
  }

  function validateDevolucionForm(form) {
    if (!form) return true;

    const compra = qs(form, "#id_compra");
    const motivo = qs(form, "#id_motivo");
    const observacion = qs(form, "#id_observacion");

    if (!compra || !compra.value) return false;
    if (!motivo || !motivo.value || !MOTIVOS_VALIDOS.has(motivo.value)) return false;

    if (PATRON_TEXTO_PELIGROSO.test((observacion?.value || "").trim())) return false;

    const items = qsa(form, ".detalle-item").filter((item) => {
      if (item.classList.contains("d-none")) return false;
      const del = qs(item, 'input[name$="-DELETE"]');
      return !(del && del.checked);
    });

    let hayDetalle = false;
    const usados = new Set();

    for (const item of items) {
      const detalle = qs(item, 'select[name$="-detalle_compra"], select[id$="-detalle_compra"]');
      const cantidad = qs(item, 'input[name$="-cantidad"]');

      const detalleVal = (detalle?.value || "").trim();
      const cantidadVal = Number(cantidad?.value || 0);
      const disponible = Number(
        detalle?.options?.[detalle.selectedIndex]?.dataset?.disponible || 0
      );

      const filaVacia = !detalleVal && !cantidadVal;
      if (filaVacia) continue;

      if (!detalleVal || !Number.isInteger(cantidadVal) || cantidadVal <= 0) {
        return false;
      }

      if (usados.has(detalleVal)) {
        return false;
      }

      if (disponible > 0 && cantidadVal > disponible) {
        return false;
      }

      usados.add(detalleVal);
      hayDetalle = true;
    }

    return hayDetalle;
  }

  window.validateDevolucionForm = validateDevolucionForm;

  window.initDevolucionForm = function (root = document) {
    const form = qs(root, "#formDevolucionCompra");
    if (!form) return;

    const compraSelect = qs(form, "#id_compra");

    if (compraSelect && !compraSelect.dataset.devolucionBound) {
      compraSelect.dataset.devolucionBound = "1";
      compraSelect.addEventListener("change", () => cargarDetalles(form));
    }

    if (!form.dataset.devolucionSubmitBound) {
      form.dataset.devolucionSubmitBound = "1";
      form.addEventListener("submit", (e) => {
        if (!validateDevolucionForm(form)) {
          e.preventDefault();
        }
      });
    }

    cargarDetalles(form);
  };

  document.addEventListener("input", (e) => {
    const form = e.target.closest("#formDevolucionCompra");
    if (!form) return;

    if (e.target.matches('input[name$="-cantidad"]')) {
      calcularTotalDevolucion(form);
    }
  });

  document.addEventListener("change", (e) => {
    const form = e.target.closest("#formDevolucionCompra");
    if (!form) return;

    if (
      e.target.matches('select[name$="-detalle_compra"]') ||
      e.target.matches('select[id$="-detalle_compra"]') ||
      e.target.matches('input[name$="-cantidad"]')
    ) {
      if (e.target.matches('select[name$="-detalle_compra"]') || e.target.matches('select[id$="-detalle_compra"]')) {
        sincronizarCantidadDisponible(form);
        return;
      }
      calcularTotalDevolucion(form);
    }
  });

  document.addEventListener("click", (e) => {
    const btnAdd = e.target.closest("#btnAgregarDetalleDevolucion");
    if (btnAdd) {
      e.preventDefault();
      const form = btnAdd.closest("#formDevolucionCompra");
      if (form) agregarFila(form);
      return;
    }

    const btnDelete = e.target.closest("#formDevolucionCompra .btn-eliminar-item");
    if (btnDelete) {
      e.preventDefault();
      const item = btnDelete.closest(".detalle-item");
      const form = btnDelete.closest("#formDevolucionCompra");

      if (item) eliminarFila(item);
      if (form) calcularTotalDevolucion(form);
    }
  });
})();

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".js-anular-devolucion");
  if (!btn) return;

  e.preventDefault();

  const url = btn.getAttribute("data-url");
  const id = btn.getAttribute("data-id");
  if (!url) return;

  const confirm = await Swal.fire({
    title: "¿Anular devolución?",
    text: "Esta acción restaurará el stock.",
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
        "X-CSRFToken": getCookie("csrftoken"),
        "X-Requested-With": "XMLHttpRequest",
      },
    });

    const data = await res.json();

    if (data.success) {
      const fila = document.getElementById(`fila-devolucion-${id}`);
      if (fila) {
        fila.style.transition = "opacity .35s ease, transform .35s ease";
        fila.style.opacity = "0";
        fila.style.transform = "translateX(20px)";
        setTimeout(() => location.reload(), 350);
      } else {
        location.reload();
      }
    } else {
      Swal.fire("Error", data.message || "No se pudo anular la devolución.", "error");
    }
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Error del servidor.", "error");
  }
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(";").shift();
  return "";
}
