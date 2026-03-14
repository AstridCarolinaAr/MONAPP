/* ============================================================
   ventas.js (COMPLETO)
   - Crear venta (página + modal)
   - Modales detalle / editar
   - Toggle estado con confirmación SweetAlert
   ============================================================ */

console.log("ventas.js cargado");

// ---------------------------
// Utils
// ---------------------------
function esAjaxRequestHeaders() {
  return { "X-Requested-With": "XMLHttpRequest" };
}
function toNum(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function money(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

// ============================================================
// 1) INIT CREAR VENTA (REUTILIZABLE: página y modal)
// ============================================================
function initCrearVenta(scope = document) {
  // Buscar el FORM (si no existe, salir)
  const form =
    scope.querySelector("#formCrearVenta") || scope.querySelector("form");
  if (!form) return;

  // Evitar duplicar listeners si abres el modal varias veces
  if (form.dataset.initCrearVenta === "1") return;
  form.dataset.initCrearVenta = "1";

  // Elementos
  const btnAgregarItem = form.querySelector("#btnAgregarItem");
  const btnGuardarVenta = form.querySelector("#btnGuardarVenta");
  const tipoProducto = form.querySelector("#tipo_producto");
  const tipoServicio = form.querySelector("#tipo_servicio");
  const selectCliente = form.querySelector("#id_cliente");
  const selectProducto = form.querySelector("#id_producto");
  const selectServicio = form.querySelector("#id_servicio");
  const selectPersonal = form.querySelector("#id_personal");

  const inputCantidad = form.querySelector("#id_cantidad");
  const inputPrecio = form.querySelector("#id_precio_unitario");
  const inputSubtotal = form.querySelector("#id_subtotal");

  const grupoProducto = form.querySelector("#grupoProducto");
  const grupoServicio = form.querySelector("#grupoServicio");
  const grupoPersonal = form.querySelector("#grupoPersonal");
  const grupoCantidad = form.querySelector("#grupoCantidad");

  const stockInfo = form.querySelector("#stockInfo");
  const tablaItemsBody = form.querySelector("#tablaItems tbody");
  const totalVenta = form.querySelector("#totalVenta");
  const itemsInput = form.querySelector("#itemsInput");
  const errorCantidad = form.querySelector("#cantidadError");

  // Si faltan piezas críticas, salir sin romper
  const tieneModuloCrearVenta =
    !!btnAgregarItem &&
    !!btnGuardarVenta &&
    !!tipoProducto &&
    !!tipoServicio &&
    !!selectCliente &&
    !!itemsInput &&
    !!inputCantidad &&
    !!inputPrecio &&
    !!inputSubtotal &&
    !!tablaItemsBody;

  if (!tieneModuloCrearVenta) return;

  // Estado
  let stockActual = 0;
  let items = [];

  // Inicializar input hidden
  itemsInput.value = "[]";

  // ---------------------------
  // Helpers internos
  // ---------------------------
  function syncInput() {
    itemsInput.value = JSON.stringify(items);
  }

  function renderTabla() {
    tablaItemsBody.innerHTML = "";
    let total = 0;

    items.forEach((item, i) => {
      total += item.subtotal;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.nombre}</td>
        <td class="text-end">$${money(item.precio)}</td>
        <td class="text-center">${item.cantidad}</td>
        <td class="text-end">$${money(item.subtotal)}</td>
        <td class="text-center">
          <button type="button" class="btn btn-sm btn-danger" data-index="${i}">✖</button>
        </td>
      `;
      tablaItemsBody.appendChild(tr);
    });

    if (totalVenta) totalVenta.textContent = money(total);
  }

  function actualizarBotones() {
    const tieneProducto = tipoProducto.checked;
    const tieneServicio = tipoServicio.checked;

    let puedeAgregar = false;

    if (tieneProducto) {
      const selecciono = selectProducto && selectProducto.selectedIndex > 0;
      const tieneCantidad = parseInt(inputCantidad.value || 0) > 0;
      const tienePrecio = toNum(inputPrecio.value) > 0;
      puedeAgregar = selecciono && tieneCantidad && tienePrecio;
    }

    if (tieneServicio) {
      const selecciono = selectServicio && selectServicio.selectedIndex > 0;
      const personalSel = selectPersonal && selectPersonal.selectedIndex > 0;
      const tienePrecio = toNum(inputPrecio.value) > 0;
      puedeAgregar = selecciono && personalSel && tienePrecio;
    }

    btnAgregarItem.disabled = !puedeAgregar;
    btnGuardarVenta.disabled = !(selectCliente.value && items.length > 0);
  }

  function limpiar() {
    if (selectProducto) selectProducto.value = "";
    if (selectServicio) selectServicio.value = "";
    if (selectPersonal) selectPersonal.value = "";

    inputPrecio.value = "";
    inputCantidad.value = "";
    inputSubtotal.value = "";

    if (stockInfo) stockInfo.classList.add("d-none");

    actualizarBotones();
  }

  function validarCantidad() {
    const cantidadStr = String(inputCantidad.value || "").trim();

    //  Si está vacío (todavía no han escrito), NO mostrar error
    if (cantidadStr === "") {
      if (errorCantidad) errorCantidad.classList.add("d-none");
      inputSubtotal.value = "";
      actualizarBotones();
      return;
    }

    const cantidad = parseInt(cantidadStr, 10);
    const precio = toNum(inputPrecio.value);

    //  Si no es número válido, tampoco mostramos error agresivo
    if (isNaN(cantidad) || cantidad <= 0) {
      if (errorCantidad) errorCantidad.classList.add("d-none");
      inputSubtotal.value = "";
      actualizarBotones();
      return;
    }

    //  Si se pasa del stock, ahí sí mostramos el error
    if (cantidad > stockActual) {
      if (errorCantidad) errorCantidad.classList.remove("d-none");
      btnAgregarItem.disabled = true;
      inputSubtotal.value = "";
      return;
    }

    // Caso correcto
    if (errorCantidad) errorCantidad.classList.add("d-none");
    inputSubtotal.value = money(precio * cantidad);
    actualizarBotones();
  }
  // ---------------------------
  // Eventos: seleccionar tipo
  // ---------------------------
  tipoProducto.addEventListener("change", () => {
    if (grupoProducto) grupoProducto.classList.remove("d-none");
    if (grupoCantidad) grupoCantidad.classList.remove("d-none");
    if (grupoServicio) grupoServicio.classList.add("d-none");
    if (grupoPersonal) grupoPersonal.classList.add("d-none");

    if (selectProducto) selectProducto.disabled = false;
    if (selectServicio) selectServicio.disabled = true;
    if (selectPersonal) selectPersonal.disabled = true;

    if (selectServicio) selectServicio.value = "";
    if (selectPersonal) selectPersonal.value = "";

    inputPrecio.value = "";
    inputCantidad.value = "";
    inputSubtotal.value = "";
    if (stockInfo) stockInfo.classList.add("d-none");

    actualizarBotones();
    actualizarTextoBoton();
  });

  tipoServicio.addEventListener("change", () => {
    if (grupoProducto) grupoProducto.classList.add("d-none");
    if (grupoCantidad) grupoCantidad.classList.add("d-none");
    if (grupoServicio) grupoServicio.classList.remove("d-none");
    if (grupoPersonal) grupoPersonal.classList.remove("d-none");

    if (selectProducto) selectProducto.disabled = true;
    if (selectServicio) selectServicio.disabled = false;
    if (selectPersonal) selectPersonal.disabled = false;

    if (selectProducto) selectProducto.value = "";

    inputPrecio.value = "";
    inputCantidad.value = "1";
    inputSubtotal.value = "";
    if (stockInfo) stockInfo.classList.add("d-none");

    actualizarBotones();
    actualizarTextoBoton();
  });

  // ---------------------------
  // Producto seleccionado
  // ---------------------------
  if (selectProducto) {
    selectProducto.addEventListener("change", () => {
      const opt = selectProducto.options[selectProducto.selectedIndex];
      if (selectProducto.selectedIndex === 0) return;

      stockActual = parseInt(opt.dataset.stock) || 0;
      const precio = toNum(opt.dataset.precio);

      inputPrecio.value = money(precio);
      inputCantidad.value = "";
      inputSubtotal.value = "";

      if (stockInfo) {
        stockInfo.classList.remove("d-none");
        if (stockActual > 0) {
          stockInfo.textContent = ` Disponible: ${stockActual} unidades`;
          stockInfo.className = "text-success small";
        } else {
          stockInfo.textContent = " Sin stock disponible";
          stockInfo.className = "text-danger small";
        }
      }

      validarCantidad();
      actualizarBotones();
    });
  }

  // ---------------------------
  // Servicio seleccionado
  // ---------------------------
  if (selectServicio) {
    selectServicio.addEventListener("change", () => {
      const opt = selectServicio.options[selectServicio.selectedIndex];
      if (selectServicio.selectedIndex === 0) return;

      const precio = toNum(opt.dataset.precio);
      inputPrecio.value = money(precio);
      inputSubtotal.value = money(precio);
      actualizarBotones();
    });
  }

  if (selectPersonal)
    selectPersonal.addEventListener("change", actualizarBotones);
  if (selectCliente)
    selectCliente.addEventListener("change", actualizarBotones);
  if (inputCantidad) inputCantidad.addEventListener("input", validarCantidad);

  // ---------------------------
  // Agregar item
  // ---------------------------
  btnAgregarItem.addEventListener("click", (e) => {
    e.preventDefault();

    if (tipoProducto.checked) {
      if (!selectProducto || selectProducto.selectedIndex === 0) {
        Swal?.fire?.({
          icon: "warning",
          title: "Debes seleccionar un producto",
        });
        return;
      }

      const codigoProducto = parseInt(selectProducto.value);
      if (isNaN(codigoProducto)) return;

      const nombreProducto =
        selectProducto.options[selectProducto.selectedIndex].textContent.trim();
      const cantidad = parseInt(inputCantidad.value || 0);
      const precio = toNum(inputPrecio.value);
      const subtotal = toNum(inputSubtotal.value);

      if (!cantidad || cantidad <= 0 || cantidad > stockActual) {
        Swal?.fire?.({
          icon: "warning",
          title: "Cantidad inválida o superior al stock disponible",
        });
        return;
      }

      items.push({
        tipo: "producto",
        id: codigoProducto,
        nombre: nombreProducto,
        precio,
        cantidad,
        subtotal,
      });
    }

    if (tipoServicio.checked) {
      if (!selectServicio || selectServicio.selectedIndex === 0) {
        Swal?.fire?.({
          icon: "warning",
          title: "Debes seleccionar un servicio",
        });
        return;
      }
      if (!selectPersonal || selectPersonal.selectedIndex === 0) {
        Swal?.fire?.({
          icon: "warning",
          title: "Selecciona la persona que realizó el servicio",
        });
        return;
      }

      const idx = selectServicio.selectedIndex;
      const precio = toNum(inputPrecio.value);

      items.push({
        tipo: "servicio",
        id_servicio: selectServicio.options[idx].value,
        id_personal: selectPersonal.options[selectPersonal.selectedIndex].value,
        nombre: selectServicio.options[idx].textContent.trim(),
        precio,
        cantidad: 1,
        subtotal: precio,
      });
    }

    renderTabla();
    syncInput();
    limpiar();
  });

  // ---------------------------
  // Eliminar item (delegación)
  // ---------------------------
  tablaItemsBody.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-index]");
    if (!btn) return;

    const i = parseInt(btn.dataset.index);
    if (isNaN(i)) return;

    items.splice(i, 1);
    renderTabla();
    syncInput();
    actualizarBotones();
  });

  // Init botones
  btnAgregarItem.disabled = true;
  btnGuardarVenta.disabled = true;
  actualizarTextoBoton();
  function actualizarTextoBoton() {
    if (!btnAgregarItem) return;

    if (tipoProducto.checked) {
      btnAgregarItem.innerHTML = "➕ Agregar producto";
    } else if (tipoServicio.checked) {
      btnAgregarItem.innerHTML = "➕ Agregar servicio";
    } else {
      btnAgregarItem.innerHTML = "➕ Agregar producto / servicio";
    }
  }

  if (selectProducto && !selectProducto.tomselect) {
    new TomSelect(selectProducto, {
      create: false,
      sortField: {
        field: "text",
        direction: "asc",
      },
    });
  }

  if (selectServicio && !selectServicio.tomselect) {
    new TomSelect(selectServicio, {
      create: false,
      sortField: {
        field: "text",
        direction: "asc",
      },
    });
  }
  // ================================
  // Tom Select: quitar azul nativo
  // ================================
  function applyTomSelect(sel) {
    if (!sel) return;
    if (sel.tomselect) return; // ya aplicado
    new TomSelect(sel, {
      create: false,
      allowEmptyOption: true,
      sortField: { field: "text", direction: "asc" },
    });
  }

  applyTomSelect(selectCliente);
  applyTomSelect(selectProducto);
  applyTomSelect(selectServicio);
  applyTomSelect(selectPersonal);
}

// Init al cargar cualquier página
document.addEventListener("DOMContentLoaded", () => {
  initCrearVenta(document);
});

// ============================================================
// 2) MODAL NUEVA VENTA (ABRIR + GUARDAR POR AJAX)
// ============================================================
document.addEventListener("click", async function (e) {
  const btnNueva = e.target.closest("#btnNuevaVenta");
  if (!btnNueva) return;

  const url = btnNueva.dataset.url;

  const modalEl = document.getElementById("modalNuevaVenta");
  const contenido = document.getElementById("contenidoNuevaVenta");

  if (!modalEl || !contenido) {
    console.error(
      "No existe #modalNuevaVenta o #contenidoNuevaVenta en el HTML",
    );
    return;
  }

  const modal = new bootstrap.Modal(modalEl);

  contenido.innerHTML = `<div class="text-center text-muted py-4">Cargando…</div>`;

  try {
    const res = await fetch(url, { headers: esAjaxRequestHeaders() });
    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();
    contenido.innerHTML = data.html || "";

    // ✅ activar lógica del formulario dentro del modal
    initCrearVenta(modalEl);

    modal.show();
  } catch (err) {
    console.error("Error cargando Nueva venta:", err);
    contenido.innerHTML = `<div class="alert alert-danger mb-0">No se pudo cargar: ${err.message}</div>`;
  }
});

// Submit del form crear venta dentro del modal (AJAX)
document.addEventListener("submit", async function (e) {
  const form = e.target;
  if (!form.matches("#formCrearVenta")) return;

  // Solo si está dentro del modal
  const modalEl = form.closest("#modalNuevaVenta");
  if (!modalEl) return;

  e.preventDefault();

  // El form NO tiene action en tu parcial, entonces usamos el data-url del botón
  const btnNueva = document.getElementById("btnNuevaVenta");
  const url = btnNueva ? btnNueva.dataset.url : window.location.href;

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: esAjaxRequestHeaders(),
      body: new FormData(form),
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();

    if (data.success === true) {
      // cerrar modal
      const modal = bootstrap.Modal.getInstance(modalEl);
      if (modal) modal.hide();

      await Swal.fire({
        icon: "success",
        title: "Venta registrada",
        timer: 1400,
        showConfirmButton: false,
      });

      location.reload();
    } else {
      // Re-render con errores
      const contenido = document.getElementById("contenidoNuevaVenta");
      contenido.innerHTML =
        data.html ||
        "<div class='alert alert-danger'>Error en formulario.</div>";

      // volver a enganchar listeners
      initCrearVenta(modalEl);
    }
  } catch (err) {
    Swal?.fire?.({
      icon: "error",
      title: "Error al guardar",
      text: err.message,
    });
  }
});

// ============================================================
// 3) MODALES LISTA: DETALLE (JSON) + EDITAR (HTML)
// ============================================================
document.addEventListener("click", async function (e) {
  // ---- DETALLE ----
  const btnDetalle = e.target.closest(".btn-ver-detalle");
  if (btnDetalle) {
    const url = btnDetalle.dataset.url;
    const cont = document.getElementById("contenidoDetalleVenta");
    if (!cont) return;

    cont.innerHTML = `<div class="text-center text-muted py-4">Cargando...</div>`;

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error("HTTP " + res.status);

      const v = await res.json();

      const filas = (v.detalles || [])
        .map(
          (d) => `
        <tr>
          <td>${d.tipo || "-"}</td>
          <td>${d.nombre || "-"}</td>
          <td class="text-center">${d.cantidad || 0}</td>
          <td class="text-end">$${d.precio_unitario || "0.00"}</td>
          <td class="text-end">$${d.subtotal || "0.00"}</td>
        </tr>
      `,
        )
        .join("");

      cont.innerHTML = `
        <div class="row g-2 mb-3">
          <div class="col-md-6"><strong>Código venta:</strong> ${v.codigo_venta || "-"}</div>
          <div class="col-md-6"><strong>Fecha:</strong> ${v.fecha || "-"}</div>
          <div class="col-md-6"><strong>Cliente:</strong> ${v.cliente || "-"}</div>
          <div class="col-md-6"><strong>Estado:</strong> ${v.estado || "-"}</div>
        </div>

        <div class="table-responsive">
          <table class="table table-sm align-middle">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Nombre</th>
                <th class="text-center">Cantidad</th>
                <th class="text-end">Precio</th>
                <th class="text-end">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${filas || `<tr><td colspan="5" class="text-center text-muted">Sin detalles</td></tr>`}
            </tbody>
          </table>
        </div>

        <div class="text-end fw-bold mt-2">
          Total: $${v.total || "0.00"}
        </div>
      `;
    } catch (err) {
      cont.innerHTML = `<div class="alert alert-danger mb-0">No se pudo cargar el detalle: ${err.message}</div>`;
    }

    return;
  }

  // ---- EDITAR ----
  const btnEditar = e.target.closest(".btn-editar");
  if (btnEditar) {
    const url = btnEditar.dataset.url;
    const cont = document.getElementById("contenidoEditarVenta");
    if (!cont) return;

    cont.innerHTML = `<div class="text-center text-muted py-4">Cargando...</div>`;

    try {
      const res = await fetch(url, { headers: esAjaxRequestHeaders() });
      if (!res.ok) throw new Error("HTTP " + res.status);

      const html = await res.text();
      cont.innerHTML = html;
    } catch (err) {
      cont.innerHTML = `<div class="alert alert-danger mb-0">No se pudo cargar el formulario: ${err.message}</div>`;
    }
  }
});

// Recalcular PRODUCTOS (editar)
document.addEventListener("input", (e) => {
  const cant = e.target.closest(".js-prod-cant");
  const precio = e.target.closest(".js-prod-precio");
  if (!cant && !precio) return;

  const id = (cant || precio).dataset.detalle;
  const c = document.querySelector(`.js-prod-cant[data-detalle="${id}"]`);
  const p = document.querySelector(`.js-prod-precio[data-detalle="${id}"]`);
  const s = document.querySelector(`.js-prod-subtotal[data-detalle="${id}"]`);

  const subtotal = toNum(c.value) * toNum(p.value);
  if (s) s.value = money(subtotal);
});

// Recalcular SERVICIOS (editar)
document.addEventListener("change", (e) => {
  const selServ = e.target.closest(".js-serv-servicio");
  if (!selServ) return;

  const id = selServ.dataset.detalle;
  const opt = selServ.options[selServ.selectedIndex];
  const precio = toNum(opt.dataset.precio);

  const precioInput = document.querySelector(
    `.js-serv-precio[data-detalle="${id}"]`,
  );
  const cantInput = document.querySelector(
    `.js-serv-cant[data-detalle="${id}"]`,
  );
  const subInput = document.querySelector(
    `.js-serv-subtotal[data-detalle="${id}"]`,
  );

  if (precioInput) precioInput.value = money(precio);
  const subtotal = toNum(cantInput.value) * precio;
  if (subInput) subInput.value = money(subtotal);
});

document.addEventListener("input", (e) => {
  const cantServ = e.target.closest(".js-serv-cant");
  if (!cantServ) return;

  const id = cantServ.dataset.detalle;
  const selServ = document.querySelector(
    `.js-serv-servicio[data-detalle="${id}"]`,
  );
  const opt = selServ.options[selServ.selectedIndex];
  const precio = toNum(opt.dataset.precio);

  const precioInput = document.querySelector(
    `.js-serv-precio[data-detalle="${id}"]`,
  );
  const subInput = document.querySelector(
    `.js-serv-subtotal[data-detalle="${id}"]`,
  );

  if (precioInput) precioInput.value = money(precio);
  const subtotal = toNum(cantServ.value) * precio;
  if (subInput) subInput.value = money(subtotal);
});

// Submit EDITAR (AJAX)
document.addEventListener("submit", async function (e) {
  const form = e.target;
  if (!form.matches("#formEditarVenta")) return;

  e.preventDefault();

  const url = form.action;
  const cont = document.getElementById("contenidoEditarVenta");
  const body = new FormData(form);

  try {
    const res = await fetch(url, {
      method: "POST",
      body,
      headers: esAjaxRequestHeaders(),
    });

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();

    if (data.ok) {
      const modalEl = document.getElementById("modalEditarVenta");
      if (modalEl && window.bootstrap) {
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();
      }
      location.reload();
    } else {
      if (cont)
        cont.innerHTML =
          data.html ||
          "<div class='alert alert-danger'>Formulario inválido.</div>";
    }
  } catch (err) {
    if (cont)
      cont.innerHTML = `<div class="alert alert-danger mb-0">Error al guardar: ${err.message}</div>`;
  }
});

// ============================================================
// 4) CONFIRMAR CAMBIO DE ESTADO (SWITCH) - CAPTURA
// ============================================================
document.addEventListener(
  "change",
  function (e) {
    const chk = e.target;
    if (!chk.classList.contains("toggle-estado")) return;

    if (typeof Swal === "undefined") {
      console.error(
        "❌ SweetAlert2 no está cargado. Revisa el orden de scripts.",
      );
      return;
    }

    e.stopImmediatePropagation();

    const form = chk.closest("form");
    if (!form) return;

    const estadoAntes = chk.getAttribute("data-estado"); // activa/anulada
    const vaAActivar = estadoAntes === "anulada";

    const titulo = vaAActivar
      ? "¿Seguro de activar nuevamente la venta?"
      : "¿Seguro de anular la venta?";

    const texto = vaAActivar
      ? "La venta quedará ACTIVA nuevamente."
      : "La venta quedará ANULADA.";

    const confirmText = vaAActivar ? "Sí, activar" : "Sí, anular";

    Swal.fire({
      title: titulo,
      text: texto,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: "Cancelar",
      reverseButtons: true,
    }).then((r) => {
      if (r.isConfirmed) {
        form.submit();
      } else {
        chk.checked = !chk.checked;
      }
    });
  },
  true,
);
let chartPreviewPrincipal = null;

function destruirChartsReporte() {
  if (chartPreviewPrincipal) {
    chartPreviewPrincipal.destroy();
    chartPreviewPrincipal = null;
  }
}

function normalizarTipoGrafica(tipo) {
  if (tipo === "funnel") return "bar";
  return tipo || "bar";
}

function construirDatasetFunnel(data) {
  const max = Math.max(...data, 0);
  if (max <= 0) return data;

  return data.map((valor, index) => {
    const factor = 1 - (index * 0.12);
    return Math.max(valor * factor, 0);
  });
}

function renderizarGraficaReporte(canvasId, datasets, labelsUnion, tipoGrafica) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return null;

  const tipoFinal = normalizarTipoGrafica(tipoGrafica);
  const colores = [
    { border: "#8d604a", bg: "rgba(141,96,74,0.25)" },
    { border: "#4a7c8d", bg: "rgba(74,124,141,0.25)" },
  ];

  const chartDatasets = datasets.map((ds, i) => {
    let dataFinal = tipoGrafica === "funnel" ? construirDatasetFunnel(ds.data) : [...ds.data];
    return {
      label: ds.label,
      data: dataFinal,
      borderColor: colores[i % colores.length].border,
      backgroundColor: tipoFinal === "line" ? colores[i % colores.length].bg : colores[i % colores.length].border,
      borderWidth: tipoFinal === "line" ? 2 : 1,
      tension: 0.3,
      fill: false,
      pointRadius: tipoFinal === "line" ? 4 : 0,
    };
  });

  return new Chart(canvas, {
    type: tipoFinal,
    data: {
      labels: labelsUnion,
      datasets: chartDatasets,
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: true },
        tooltip: { mode: "index", intersect: false },
      },
      scales: {
        x: { ticks: { maxRotation: 45 } },
        y: { beginAtZero: true },
      },
    },
  });
}
// ============================================================
// 5) REPORTE VENTAS: COMPARATIVO + VISTA PREVIA + EXPORTAR
// ============================================================
document.addEventListener("change", function (e) {
  const checkComparativo = e.target.closest("#checkComparativoVentas");
  if (!checkComparativo) return;

  const bloque = document.getElementById("bloqueComparativoVentas");
  if (!bloque) return;

  const inicioComp = bloque.querySelector('input[name="fecha_inicio_comp"]');
  const finComp = bloque.querySelector('input[name="fecha_fin_comp"]');

  if (checkComparativo.checked) {
    bloque.classList.remove("d-none");
    if (inicioComp) inicioComp.required = true;
    if (finComp) finComp.required = true;
  } else {
    bloque.classList.add("d-none");
    if (inicioComp) {
      inicioComp.required = false;
      inicioComp.value = "";
    }
    if (finComp) {
      finComp.required = false;
      finComp.value = "";
    }
  }
});

document.addEventListener("click", async function (e) {
  const btnPreview = e.target.closest("#btnVistaPreviaReporte");
  if (!btnPreview) return;

  const form = document.getElementById("formReporteVentas");
  const cont = document.getElementById("contenidoVistaPreviaReporte");
  const modalEl = document.getElementById("modalVistaPreviaReporte");

  if (!form || !cont || !modalEl) return;

  const columnas = form.querySelectorAll('input[name="columnas"]:checked');
  if (columnas.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Selecciona al menos una columna",
    });
    return;
  }

  const formData = new FormData(form);
  const params = new URLSearchParams(formData);

  cont.innerHTML = `<div class="text-center text-muted py-5">Generando vista previa...</div>`;

  try {
    const res = await fetch(
      `/ventas/reporte/vista-previa/?${params.toString()}`,
      {
        headers: esAjaxRequestHeaders(),
      },
    );

    if (!res.ok) throw new Error("HTTP " + res.status);

    const data = await res.json();

    destruirChartsReporte();
    cont.innerHTML =
      data.html ||
      "<div class='alert alert-danger'>No se pudo generar la vista previa.</div>";

    const modal = new bootstrap.Modal(modalEl);
    modal.show();

    requestAnimationFrame(() => {
      if (data.incluir_grafica) {
        const pLabels = data.grafica_principal_labels || [];
        const pData   = data.grafica_principal_data   || [];
        const cLabels = data.grafica_comp_labels || [];
        const cData   = data.grafica_comp_data   || [];

        function alinear(labels, vals, union) {
          return union.map(lbl => {
            const i = labels.indexOf(lbl);
            return i >= 0 ? vals[i] : null;
          });
        }

        const allLabels = data.comparativo
          ? [...new Set([...pLabels, ...cLabels])].sort()
          : pLabels;

        const datasets = [];

        if (pLabels.length) {
          datasets.push({
            label: data.comparativo
              ? "Principal (" + (data.fecha_inicio || "") + " — " + (data.fecha_fin || "") + ")"
              : "Ventas",
            data: data.comparativo ? alinear(pLabels, pData, allLabels) : pData,
          });
        }

        if (data.comparativo && cLabels.length) {
          datasets.push({
            label: "Comparativo (" + (data.fecha_inicio_comp || "") + " — " + (data.fecha_fin_comp || "") + ")",
            data: alinear(cLabels, cData, allLabels),
          });
        }

        chartPreviewPrincipal = renderizarGraficaReporte(
          "graficaPreviewPrincipal",
          datasets,
          allLabels,
          data.tipo_grafica || "bar",
        );
      }
    });
  } catch (err) {
    cont.innerHTML = `<div class="alert alert-danger mb-0">Error al generar la vista previa: ${err.message}</div>`;
    const modal = new bootstrap.Modal(modalEl);
    modal.show();
  }
});
document.addEventListener("submit", function (e) {
  const form = e.target;
  if (!form.matches("#formReporteVentas")) return;

  e.preventDefault();

  const columnas = form.querySelectorAll('input[name="columnas"]:checked');
  if (columnas.length === 0) {
    Swal.fire({
      icon: "warning",
      title: "Selecciona al menos una columna",
    });
    return;
  }

  const params = new URLSearchParams(new FormData(form));
  window.location.href = `/ventas/reporte/exportar/?${params.toString()}`;
});
document.addEventListener("change", function (e) {
  const checkGrafica = e.target.closest('input[name="incluir_grafica"]');
  if (!checkGrafica) return;

  const bloqueTipo = document.getElementById("bloqueTipoGraficaVentas");
  if (!bloqueTipo) return;

  if (checkGrafica.checked) {
    bloqueTipo.classList.remove("d-none");
  } else {
    bloqueTipo.classList.add("d-none");
  }
});