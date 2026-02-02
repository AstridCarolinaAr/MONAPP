document.addEventListener("DOMContentLoaded", () => {

    document.querySelectorAll(".btn-eliminar-cliente").forEach(btn => {

        btn.addEventListener("click", function () {

            const esAdmin = this.dataset.esAdmin === "true";
            const modalId = this.dataset.modalId;

            if (!esAdmin) {
                const modalPermiso = document.getElementById("modalAccionNoPermitida");
                if (modalPermiso) {
                    new bootstrap.Modal(modalPermiso).show();
                }
                return;
            }

            const modal = document.getElementById(modalId);
            if (modal) {
                new bootstrap.Modal(modal).show();
            }

        });

    });

});
