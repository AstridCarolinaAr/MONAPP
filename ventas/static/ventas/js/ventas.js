

document.addEventListener("DOMContentLoaded", function() {

  // Elementos
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

  let items = [];
  let stock = 0;

  // Función simple para habilitar/deshabilitar botón
  function actualizarBotones() {
    const tieneProducto = tipoProducto.checked;
    const tieneServicio = tipoServicio.checked;
    
    let puedeAgregar = false;

    if (tieneProducto) {
      const selecciono = selectProducto.selectedIndex > 0;  
      const tieneCantidad = inputCantidad.value > 0;
      const tienePrecio = inputPrecio.value > 0;
      puedeAgregar = selecciono && tieneCantidad && tienePrecio;
      console.log(`PRODUCTO: producto=${selecciono} (idx=${selectProducto.selectedIndex}), cantidad=${tieneCantidad}, precio=${tienePrecio} => ${puedeAgregar}`);
    }

    if (tieneServicio) {
      const selecciono = selectServicio.selectedIndex > 0; 
      const personal = selectPersonal.selectedIndex > 0;  
      const tienePrecio = inputPrecio.value > 0;
      puedeAgregar = selecciono && personal && tienePrecio;
      console.log(`SERVICIO: servicio=${selecciono}, personal=${personal}, precio=${tienePrecio} => ${puedeAgregar}`);
    }

    btnAgregarItem.disabled = !puedeAgregar;
    btnGuardarVenta.disabled = !(selectCliente.value && items.length > 0);
    console.log(`BOTONES: agregar=${!btnAgregarItem.disabled}, guardar=${!btnGuardarVenta.disabled}`);
  }

  // Tipo Producto
  tipoProducto.addEventListener("change", () => {
    console.log("✓ Tipo: PRODUCTO");
    grupoProducto.classList.remove("d-none");
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

  // Tipo Servicio
  tipoServicio.addEventListener("change", () => {
    console.log("✓ Tipo: SERVICIO");
    grupoProducto.classList.add("d-none");
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

  // Producto
  selectProducto.addEventListener("change", () => {
    const opt = selectProducto.options[selectProducto.selectedIndex];
    const precio = parseFloat(opt.dataset.precio) || 0;
    stock = parseInt(opt.dataset.stock) || 0;
    inputPrecio.value = precio.toFixed(2);
    inputCantidad.value = "";
    inputSubtotal.value = "";
    stockInfo.textContent = stock > 0 ? `📊 Stock: ${stock}` : "❌ Sin stock";
    stockInfo.classList.toggle("d-none", stock === 0);
    inputCantidad.disabled = stock === 0;
    console.log(`Producto: precio=${precio}, stock=${stock}`);
    actualizarBotones();
  });

  // Servicio
  selectServicio.addEventListener("change", () => {
    const opt = selectServicio.options[selectServicio.selectedIndex];
    const precio = parseFloat(opt.dataset.precio) || 0;
    inputPrecio.value = precio.toFixed(2);
    inputSubtotal.value = precio.toFixed(2);
    console.log(`Servicio: precio=${precio}`);
    actualizarBotones();
  });

  // Personal
  selectPersonal.addEventListener("change", actualizarBotones);

  // Cantidad
  inputCantidad.addEventListener("input", () => {
    const precio = parseFloat(inputPrecio.value) || 0;
    const cantidad = parseInt(inputCantidad.value) || 0;
    inputSubtotal.value = (precio * cantidad).toFixed(2);
    actualizarBotones();
  });

  // Cliente
  selectCliente.addEventListener("change", actualizarBotones);

  // Botón Agregar
  btnAgregarItem.addEventListener("click", (e) => {
    e.preventDefault();
    console.log("➕ AGREGAR");

    if (tipoProducto.checked) {
      const idx = selectProducto.selectedIndex;
      items.push({
        tipo: "producto",
        id: selectProducto.options[idx].value,
        nombre: selectProducto.options[idx].textContent.trim(),
        precio: parseFloat(inputPrecio.value),
        cantidad: parseInt(inputCantidad.value),
        subtotal: parseFloat(inputSubtotal.value)
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
          <button type="button" class="btn btn-sm btn-danger" onclick="eliminarItem(${i})">✖</button>
        </td>
      `;
      tablaItems.appendChild(tr);
    });
    totalVenta.textContent = total.toFixed(2);
  }

  window.eliminarItem = (i) => {
    items.splice(i, 1);
    renderTabla();
    syncInput();
    actualizarBotones();
  };

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
    stockInfo.classList.add("d-none");
    actualizarBotones();
  }

  console.log(" Listo");
  btnAgregarItem.disabled = true;
  btnGuardarVenta.disabled = true;
});
