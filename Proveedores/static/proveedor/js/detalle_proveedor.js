console.log("JS PROVEEDOR CARGADO");
document.addEventListener("DOMContentLoaded", () => {



    const modal = document.getElementById("modalDetalleProveedor");
    if (!modal) {
        console.error(" Modal no encontrado");
        return;
    }

    modal.addEventListener("show.bs.modal", function (event) {

        const button = event.relatedTarget;
        if (!button) {
            console.error("Botón no encontrado");
            return;
        }

        const data = button.dataset;

        // DEBUG (puedes quitar luego)
        console.log("DATASET:", data);

        //  ASIGNAR DATOS (UNO A UNO, SIN INVENTAR)
        document.getElementById("p-nombre").textContent       = data.nombre || "—";
        document.getElementById("p-nit").textContent          = data.nit || "—";

        document.getElementById("p-telefono").textContent     = data.telefono || "—";
        document.getElementById("p-correo").textContent       = data.correo || "—";
        document.getElementById("p-estado").textContent       = data.estado || "—";
        document.getElementById("p-direccion").textContent    = data.direccion || "—";


    });
    document.getElementById('detalleDireccion').textContent =
    this.dataset.direccion;


});
