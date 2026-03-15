(() => {
  "use strict";

  const qs = (root, sel) => (root || document).querySelector(sel);
  const qsa = (root, sel) => Array.from((root || document).querySelectorAll(sel));

  function formatCOPNumber(value) {
    const n = Math.round(Number(value) || 0);
    return n.toLocaleString("es-CO");
  }

  function construirOpciones(detalles, selectedValue = "") {
    let html = '<option value="">---------</option>';

    detalles.forEach((item) => {
      const selected = String(item.id) === String(selectedValue) ? "selected" : "";
      html += `<option value="${item.id}" data-precio="${item.precio_unitario || 0}" ${selected}>
        ${item.texto}
      </option>`;
    });

    return html;
  }

  function actualizarOpcionesDetalles(form, detalles) {
    const selects = qsa(
      form,
      'select[name$="-detalle_compra"], select[id$="-detalle_compra"]'
    );

    selects.forEach((select) => {
      const actual = select.value;
      select.innerHTML = construirOpciones(detalles, actual);
    });
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
    calcularTotalDevolucion(form);
    return;
  }

  try {
    const res = await fetch(`${url}?compra_id=${compraSelect.value}`, {
      method: "GET",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });

    const data = await res.json();
    console.log("DETALLES CARGADOS:", data);
    actualizarOpcionesDetalles(form, data.detalles || []);
    calcularTotalDevolucion(form);
  } catch (error) {
    console.error("Error cargando detalles de compra:", error);
    actualizarOpcionesDetalles(form, []);
    calcularTotalDevolucion(form);
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
    if (!compra || !compra.value) return false;

    const items = qsa(form, ".detalle-item").filter((item) => {
      if (item.classList.contains("d-none")) return false;
      const del = qs(item, 'input[name$="-DELETE"]');
      return !(del && del.checked);
    });

    let hayDetalle = false;

    for (const item of items) {
      const detalle = qs(item, 'select[name$="-detalle_compra"], select[id$="-detalle_compra"]');
      const cantidad = qs(item, 'input[name$="-cantidad"]');

      const detalleVal = (detalle?.value || "").trim();
      const cantidadVal = Number(cantidad?.value || 0);

      const filaVacia = !detalleVal && !cantidadVal;
      if (filaVacia) continue;

      if (detalleVal && cantidadVal > 0) {
        hayDetalle = true;
      } else {
        return false;
      }
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