document.addEventListener("DOMContentLoaded", function () {

  // =========================
  // 1) CREAR VENTA (TU CÓDIGO)
  // =========================

  const btnAgregarItem = document.getElementById("btnAgregarItem");
  const btnGuardarVenta = document.getElementById("btnGuardarVenta");
  const tipoProducto = document.getElementById("tipo_producto");
  const tipoServicio = document.getElementById("tipo_servicio");
  const selectCliente = document.getElementById("id_cliente");
  const selectProducto = document.getElementById("id_producto");
  const selectServicio = document.getElementById("id_servicio");
  const selectPersonal = document.getElementById("id_personal");
  const inputCantidad = document.getElementById("id_cantidad");
  const inputPrecio = document.getElementById("id_precio_unitario");
  const inputSubtotal = document.getElementById("id_subtotal");
  const grupoProducto = document.getElementById("grupoProducto");
  const grupoServicio = document.getElementById("grupoServicio");
  const grupoPersonal = document.getElementById("grupoPersonal");
  const stockInfo = document.getElementById("stockInfo");
  const tablaItems = document.querySelector("#tablaItems tbody");
  const totalVenta = document.getElementById("totalVenta");
  const itemsInput = document.getElementById("itemsInput");
  const errorCantidad = document.getElementById("cantidadError");

  // ⚠️ En tu código usas grupoCantidad pero no lo declaraste aquí.
  // Asegúrate que exista en el HTML con id="grupoCantidad"
  const grupoCantidad = document.getElementById("grupoCantidad");

  // Si este JS corre también en páginas donde NO existe el formulario de crear venta,
  // evitamos que reviente:
  const tieneModuloCrearVenta = !!btnAgregarItem && !!btnGuardarVenta && !!itemsInput;

  let stockActual = 0;
  let items = [];

  if (tieneModuloCrearVenta) {
    itemsInput.value = "[]";

    function actualizarBotones() {
      const tieneProducto = tipoProducto.checked;
      const tieneServicio = tipoServicio.checked;

      let puedeAgregar = false;

      if (tieneProducto) {
        const selecciono = selectProducto.selectedIndex > 0;
        const tieneCantidad = parseInt(inputCantidad.value || 0) > 0;
        const tienePrecio = parseFloat(inputPrecio.value || 0) > 0;
        puedeAgregar = selecciono && tieneCantidad && tienePrecio;
      }

      if (tieneServicio) {
        const selecciono = selectServicio.selectedIndex > 0;
        const personal = selectPersonal.selectedIndex > 0;
        const tienePrecio = parseFloat(inputPrecio.value || 0) > 0;
        puedeAgregar = selecciono && personal && tienePrecio;
      }

      btnAgregarItem.disabled = !puedeAgregar;
      btnGuardarVenta.disabled = !(selectCliente.value && items.length > 0);
    }

    tipoProducto.addEventListener("change", () => {
      grupoProducto.classList.remove("d-none");
      if (grupoCantidad) grupoCantidad.classList.remove("d-none");
      grupoServicio.classList.add("d-none");
      grupoPersonal.classList.add("d-none");

      selectProducto.disabled = false;
      selectServicio.disabled = true;
      selectPersonal.disabled = true;

      selectServicio.value = "";
      selectPersonal.value = "";
      inputPrecio.value = "";
      inputCantidad.value = "";
      inputSubtotal.value = "";
      actualizarBotones();
    });

    tipoServicio.addEventListener("change", () => {
      grupoProducto.classList.add("d-none");
      if (grupoCantidad) grupoCantidad.classList.add("d-none");
      grupoServicio.classList.remove("d-none");
      grupoPersonal.classList.remove("d-none");

      selectProducto.disabled = true;
      selectServicio.disabled = false;
      selectPersonal.disabled = false;

      selectProducto.value = "";
      inputPrecio.value = "";
      inputCantidad.value = "1";
      inputSubtotal.value = "";
      actualizarBotones();
    });

    function validarCantidad() {
      const cantidad = parseInt(inputCantidad.value || 0);
      const precio = parseFloat(inputPrecio.value || 0);

      if (cantidad <= 0 || cantidad > stockActual) {
        if (errorCantidad) errorCantidad.classList.remove("d-none");
        btnAgregarItem.disabled = true;
        inputSubtotal.value = "";
        return;
      }

      if (errorCantidad) errorCantidad.classList.add("d-none");
      inputSubtotal.value = (precio * cantidad).toFixed(2);

      actualizarBotones();
    }

    selectProducto.addEventListener("change", () => {
      const opt = selectProducto.options[selectProducto.selectedIndex];
      if (selectProducto.selectedIndex === 0) return;

      stockActual = parseInt(opt.dataset.stock) || 0;
      const precio = parseFloat(opt.dataset.precio) || 0;

      inputPrecio.value = precio.toFixed(2);
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
    });

    selectServicio.addEventListener("change", () => {
      const opt = selectServicio.options[selectServicio.selectedIndex];
      const precio = parseFloat(opt.dataset.precio) || 0;
      inputPrecio.value = precio.toFixed(2);
      inputSubtotal.value = precio.toFixed(2);
      actualizarBotones();
    });

    selectPersonal.addEventListener("change", actualizarBotones);
    inputCantidad.addEventListener("input", validarCantidad);
    selectCliente.addEventListener("change", actualizarBotones);

    btnAgregarItem.addEventListener("click", (e) => {
      e.preventDefault();

      if (tipoProducto.checked) {
        if (selectProducto.selectedIndex === 0) {
          alert("Debes seleccionar un producto");
          return;
        }

        const codigoProducto = parseInt(selectProducto.value);
        if (isNaN(codigoProducto)) return;

        const nombreProducto = selectProducto.options[selectProducto.selectedIndex].textContent.trim();
        const cantidad = parseInt(inputCantidad.value);
        const precio = parseFloat(inputPrecio.value);
        const subtotal = parseFloat(inputSubtotal.value);

        if (!cantidad || cantidad <= 0 || cantidad > stockActual) {
          alert("Cantidad inválida o superior al stock disponible");
          return;
        }

        items.push({
          tipo: "producto",
          id: codigoProducto,
          nombre: nombreProducto,
          precio: precio,
          cantidad: cantidad,
          subtotal: subtotal
        });
      }

      if (tipoServicio.checked) {
        const idx = selectServicio.selectedIndex;
        items.push({
          tipo: "servicio",
          id_servicio: selectServicio.options[idx].value,
          id_personal: selectPersonal.options[selectPersonal.selectedIndex].value,
          nombre: selectServicio.options[idx].textContent.trim(),
          precio: parseFloat(inputPrecio.value),
          cantidad: 1,
          subtotal: parseFloat(inputPrecio.value)
        });
      }

      renderTabla();
      syncInput();
      limpiar();
    });

    function renderTabla() {
      tablaItems.innerHTML = "";
      let total = 0;

      items.forEach((item, i) => {
        total += item.subtotal;
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${item.nombre}</td>
          <td class="text-end">$${item.precio.toFixed(2)}</td>
          <td class="text-center">${item.cantidad}</td>
          <td class="text-end">$${item.subtotal.toFixed(2)}</td>
          <td class="text-center">
            <button type="button" class="btn btn-sm btn-danger" data-index="${i}">✖</button>
          </td>
        `;
        tablaItems.appendChild(tr);
      });

      totalVenta.textContent = total.toFixed(2);
    }

    // Delegación para eliminar (evita window.eliminarItem)
    tablaItems.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-index]");
      if (!btn) return;
      const i = parseInt(btn.dataset.index);
      if (isNaN(i)) return;

      items.splice(i, 1);
      renderTabla();
      syncInput();
      actualizarBotones();
    });

    function syncInput() {
      itemsInput.value = JSON.stringify(items);
    }

    function limpiar() {
      selectProducto.value = "";
      selectServicio.value = "";
      selectPersonal.value = "";
      inputPrecio.value = "";
      inputCantidad.value = "";
      inputSubtotal.value = "";
      if (stockInfo) stockInfo.classList.add("d-none");
      actualizarBotones();
    }

    btnAgregarItem.disabled = true;
    btnGuardarVenta.disabled = true;
  }

  // =====================================
  // 2) MODALES: DETALLE + EDITAR (LISTA)
  // =====================================

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

        cont.innerHTML = `
          <div class="row g-3">
            <div class="col-md-6"><strong>Código venta:</strong> ${v.codigo_venta || "-"}</div>
            <div class="col-md-6"><strong>Fecha:</strong> ${v.fecha || "-"}</div>
            <div class="col-md-6"><strong>Cliente:</strong> ${v.cliente || "-"}</div>
            <div class="col-md-6"><strong>Estado:</strong> ${v.estado || "-"}</div>
            <div class="col-md-6"><strong>Cód. producto/servicio:</strong> ${v.codigo_producto || "-"}</div>
            <div class="col-md-6"><strong>Precio unitario:</strong> $ ${v.precio_unitario || "-"}</div>
            <div class="col-md-6"><strong>Cantidad:</strong> ${v.cantidad || "-"}</div>
            <div class="col-md-6"><strong>Subtotal:</strong> $ ${v.subtotal || "-"}</div>
            ${v.observaciones ? `<div class="col-12"><strong>Observaciones:</strong><br>${v.observaciones}</div>` : ""}
          </div>
        `;
      } catch (err) {
        cont.innerHTML = `<div class="alert alert-danger mb-0">No se pudo cargar el detalle: ${err.message}</div>`;
      }

      return; // para no seguir con editar
    }

    // ---- EDITAR (CARGA FORM HTML EN MODAL) ----
    const btnEditar = e.target.closest(".btn-editar");
    if (btnEditar) {
      const url = btnEditar.dataset.url;
      const cont = document.getElementById("contenidoEditarVenta");
      if (!cont) return;

      cont.innerHTML = `<div class="text-center text-muted py-4">Cargando...</div>`;

      try {
        const res = await fetch(url, { headers: { "X-Requested-With": "XMLHttpRequest" } });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const html = await res.text();
        cont.innerHTML = html;
      } catch (err) {
        cont.innerHTML = `<div class="alert alert-danger mb-0">No se pudo cargar el formulario: ${err.message}</div>`;
      }
    }
  });

  function toNum(v) {
  const n = parseFloat(String(v).replace(",", "."));
  return isNaN(n) ? 0 : n;
}
function money(n) {
  return (Math.round(n * 100) / 100).toFixed(2);
}

// Recalcular PRODUCTOS
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

// Recalcular SERVICIOS (si cambia cantidad o servicio)
document.addEventListener("change", (e) => {
  const selServ = e.target.closest(".js-serv-servicio");
  if (!selServ) return;

  const id = selServ.dataset.detalle;
  const opt = selServ.options[selServ.selectedIndex];
  const precio = toNum(opt.dataset.precio);

  const precioInput = document.querySelector(`.js-serv-precio[data-detalle="${id}"]`);
  const cantInput = document.querySelector(`.js-serv-cant[data-detalle="${id}"]`);
  const subInput = document.querySelector(`.js-serv-subtotal[data-detalle="${id}"]`);

  if (precioInput) precioInput.value = money(precio);
  const subtotal = toNum(cantInput.value) * precio;
  if (subInput) subInput.value = money(subtotal);
});

document.addEventListener("input", (e) => {
  const cantServ = e.target.closest(".js-serv-cant");
  if (!cantServ) return;

  const id = cantServ.dataset.detalle;
  const selServ = document.querySelector(`.js-serv-servicio[data-detalle="${id}"]`);
  const opt = selServ.options[selServ.selectedIndex];
  const precio = toNum(opt.dataset.precio);

  const precioInput = document.querySelector(`.js-serv-precio[data-detalle="${id}"]`);
  const subInput = document.querySelector(`.js-serv-subtotal[data-detalle="${id}"]`);

  if (precioInput) precioInput.value = money(precio);
  const subtotal = toNum(cantServ.value) * precio;
  if (subInput) subInput.value = money(subtotal);
});

  // ---- SUBMIT FORM EDITAR (POST AJAX) ----
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
        headers: { "X-Requested-With": "XMLHttpRequest" }
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
        if (cont) cont.innerHTML = data.html || "<div class='alert alert-danger'>Formulario inválido.</div>";
      }
    } catch (err) {
      if (cont) cont.innerHTML = `<div class="alert alert-danger mb-0">Error al guardar: ${err.message}</div>`;
    }
  });

});