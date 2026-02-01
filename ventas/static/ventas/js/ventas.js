console.log("JS ventas cargado");

document.addEventListener("DOMContentLoaded", () => {
    const cliente = document.getElementById("id_cliente");
    const producto = document.getElementById("id_producto");
    const precio = document.getElementById("id_precio_unitario");
    const cantidad = document.getElementById("id_cantidad");
    const subtotal = document.getElementById("id_subtotal");
    const btnGuardar = document.getElementById("btnGuardarVenta");

    function esNumeroValido(valor) {
        return !isNaN(valor) && Number(valor) > 0;
    }

    function validarFormulario() {
        let valido = true;

        // Cliente
        if (!cliente.value) valido = false;

        // Producto
        if (!producto.value) valido = false;

        // Precio
        if (!esNumeroValido(precio.value)) valido = false;

        // Cantidad
        if (!esNumeroValido(cantidad.value)) valido = false;

        // Subtotal
        if (!esNumeroValido(subtotal.value)) valido = false;

        btnGuardar.disabled = !valido;
    }

    function calcularSubtotal() {
        const p = parseFloat(precio.value) || 0;
        const c = parseInt(cantidad.value) || 0;
        subtotal.value = (p * c).toFixed(2);
    }

    // Eventos
    [cliente, producto, precio, cantidad].forEach(el => {
        el.addEventListener("change", validarFormulario);
        el.addEventListener("keyup", validarFormulario);
    });

    cantidad.addEventListener("input", () => {
        calcularSubtotal();
        validarFormulario();
    });

    precio.addEventListener("input", () => {
        calcularSubtotal();
        validarFormulario();
    });

    // Estado inicial
    btnGuardar.disabled = true;
});
