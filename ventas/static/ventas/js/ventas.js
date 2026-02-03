console.log("JS ventas cargado");

document.addEventListener("DOMContentLoaded", () => {
    // ===============================
    // ELEMENTOS
    // ===============================
    const cliente = document.getElementById("id_cliente");
    const producto = document.getElementById("id_producto");
    const precio = document.getElementById("id_precio_unitario");
    const cantidad = document.getElementById("id_cantidad");
    const subtotal = document.getElementById("id_subtotal");

    const btnGuardar = document.getElementById("btnGuardarVenta");
    const btnAgregarItem = document.getElementById("btnAgregarItem");

    const stockInfo = document.getElementById("stockInfo");
    const cantidadError = document.getElementById("cantidadError");

    const tablaItems = document.querySelector("#tablaItems tbody");
    const totalVentaEl = document.getElementById("totalVenta");

    const tipoProducto = document.getElementById("tipo_producto");
    const tipoServicio = document.getElementById("tipo_servicio");

    const selectProducto = document.getElementById("id_producto");
    const selectServicio = document.getElementById("id_servicio");
    const selectPersonal = document.getElementById("id_personal");
        // Estado inicial
    selectProducto.disabled = true;
    selectServicio.disabled = true;
    selectPersonal.disabled = true;



    // ===============================
    // ESTADO
    // ===============================
    let stockDisponible = null;
    let itemsVenta = [];


    function resetCampos() {
    selectProducto.value = "";
    selectServicio.value = "";
    selectPersonal.value = "";
}


    // ===============================
    // UTILIDADES
    // ===============================
    function esNumeroValido(valor) {
        return !isNaN(valor) && Number(valor) > 0;
    }

    function calcularSubtotal() {
        const p = parseFloat(precio.value) || 0;
        const c = parseInt(cantidad.value) || 0;
        subtotal.value = (p * c).toFixed(2);
    }

    // ===============================
    // VALIDACIÓN FORMULARIO (GUARDAR)
    // ===============================
    function validarFormulario() {
        let valido = true;

        // reset visual
        cantidad.classList.remove("is-invalid");
        cantidadError.classList.add("d-none");

        if (!cliente.value) valido = false;
        if (!itemsVenta.length) valido = false;

        btnGuardar.disabled = !valido;
    }

    // ===============================
    // VALIDACIÓN ITEM (AGREGAR)
    // ===============================
    function validarItem() {
        let valido = true;

        if (!producto.value) valido = false;
        if (!esNumeroValido(precio.value)) valido = false;

        const cant = parseInt(cantidad.value || "0", 10);

        if (!esNumeroValido(cant)) valido = false;

        if (stockDisponible === null || cant > stockDisponible) {
            valido = false;
            if (cant > stockDisponible) {
                cantidad.classList.add("is-invalid");
                cantidadError.classList.remove("d-none");
            }
        }

        btnAgregarItem.disabled = !valido;
    }

    // ===============================
    // CAMBIO DE PRODUCTO
    // ===============================
    producto.addEventListener("change", function () {
        const option = this.options[this.selectedIndex];

        stockDisponible = option.dataset.stock
            ? parseInt(option.dataset.stock, 10)
            : null;

        precio.value = option.dataset.precio || "";
        cantidad.value = "";
        subtotal.value = "";

        if (stockDisponible !== null) {
            stockInfo.classList.remove("d-none");
            stockInfo.textContent = `Stock disponible: ${stockDisponible}`;

            if (stockDisponible <= 0) {
                stockInfo.classList.add("text-danger");
                cantidad.disabled = true;
            } else {
                stockInfo.classList.remove("text-danger");
                cantidad.disabled = false;
                cantidad.max = stockDisponible;
            }
        }

        validarItem();
    });

    // ===============================
    // CAMBIO TIPO DE ITEM
    // ===============================
    tipoProducto.addEventListener("change", () => {
        selectProducto.disabled = false;

        selectServicio.disabled = true;
        selectPersonal.disabled = true;

        selectServicio.value = "";
        selectPersonal.value = "";
    });

    tipoServicio.addEventListener("change", () => {
        selectProducto.disabled = true;
        selectServicio.disabled = false;
        selectPersonal.disabled = false;

        selectProducto.value = "";
    });


    // ===============================
    // CAMBIO DE CANTIDAD
    // ===============================
    cantidad.addEventListener("input", () => {
        calcularSubtotal();
        validarItem();
    });

    // ===============================
    // AGREGAR ITEM
    // ===============================
    btnAgregarItem.addEventListener("click", () => {
        const option = producto.options[producto.selectedIndex];
        const cant = parseInt(cantidad.value, 10);

        const item = {
            codigo: producto.value,
            nombre: option.textContent.trim(),
            precio: parseFloat(precio.value),
            cantidad: cant,
            subtotal: parseFloat(subtotal.value)
        };

        itemsVenta.push(item);

        // descontar stock temporal
        stockDisponible -= cant;
        option.dataset.stock = stockDisponible;

        renderItems();
        limpiarInputsItem();
        validarFormulario();
    });

    // ===============================
    // RENDER TABLA
    // ===============================
    function renderItems() {
        tablaItems.innerHTML = "";
        let total = 0;

        itemsVenta.forEach((item, index) => {
            total += item.subtotal;

            tablaItems.innerHTML += `
                <tr>
                    <td>${item.nombre}</td>
                    <td class="text-end">$${item.precio.toFixed(2)}</td>
                    <td class="text-center">${item.cantidad}</td>
                    <td class="text-end">$${item.subtotal.toFixed(2)}</td>
                    <td class="text-center">
                        <button class="btn btn-sm btn-danger" onclick="eliminarItem(${index})">
                            ✖
                        </button>
                    </td>
                </tr>
            `;
        });

        totalVentaEl.textContent = total.toFixed(2);
        document.getElementById("itemsInput").value = JSON.stringify(itemsVenta);

    }

    // ===============================
    // ELIMINAR ITEM
    // ===============================
    window.eliminarItem = function (index) {
        itemsVenta.splice(index, 1);
        renderItems();
        validarFormulario();
    };

    // ===============================
    // LIMPIAR INPUTS
    // ===============================
    function limpiarInputsItem() {
        producto.value = "";
        precio.value = "";
        cantidad.value = "";
        subtotal.value = "";
        stockInfo.classList.add("d-none");
        validarItem();
    }

    // ===============================
    // ESTADO INICIAL
    // ===============================
    btnGuardar.disabled = true;
    btnAgregarItem.disabled = true;
});

document.querySelectorAll(".btn-ver-detalle").forEach(btn => {
    btn.addEventListener("click", () => {
        const ventaId = btn.dataset.id;
        const contenedor = document.getElementById("contenidoDetalleVenta");

        contenedor.innerHTML = "Cargando detalle...";

        fetch(`/ventas/${ventaId}/detalle-modal/`)
            .then(res => res.text())
            .then(html => {
                contenedor.innerHTML = html;
            });
    });
});

