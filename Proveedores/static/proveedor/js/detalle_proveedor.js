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
        document.getElementById("p-idventa").textContent      = data.idventa || "—";
        document.getElementById("p-codigomarca").textContent  = data.codigomarca || "—";
        document.getElementById("p-fecha").textContent        = data.fecha || "—";

        document.getElementById("p-cc").textContent           = data.cc || "—";
        document.getElementById("p-encargado").textContent    = data.encargado || "—";
        document.getElementById("p-vehiculo").textContent     = data.vehiculo || "—";
        document.getElementById("p-placa").textContent        = data.placa || "—";

        document.getElementById("p-telefono").textContent     = data.telefono || "—";
        document.getElementById("p-correo").textContent       = data.correo || "—";
        document.getElementById("p-estado").textContent       = data.estado || "—";

    });

});
