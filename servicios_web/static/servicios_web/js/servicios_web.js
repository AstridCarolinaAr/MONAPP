document.addEventListener("DOMContentLoaded", () => {
    const modalEl = document.getElementById("modalServicioWeb");
    const modalBody = document.getElementById("modalBodyContent");
    const modalTitle = document.getElementById("modalServicioWebLabel");

    let modalInstance = null;

    if (modalEl) {
        modalInstance = new bootstrap.Modal(modalEl);
    }

    function buildModalUrl(url) {
        const separator = url.includes("?") ? "&" : "?";
        return `${url}${separator}modal=1`;
    }

    async function abrirModalDesdeURL(url, titulo = "Servicio Web") {
        if (!modalEl || !modalBody) {
            console.warn("No existe el modal #modalServicioWeb o #modalBodyContent");
            return;
        }

        modalBody.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
        `;

        if (modalTitle) {
            modalTitle.innerHTML = `<i class="bi bi-plus-circle me-2"></i> ${titulo}`;
        }

        modalInstance.show();

        try {
            const response = await fetch(buildModalUrl(url), {
                headers: {
                    "X-Requested-With": "XMLHttpRequest"
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const html = await response.text();
            modalBody.innerHTML = html;

            bindModalForm();
        } catch (error) {
            console.error("Error cargando el formulario:", error);
            modalBody.innerHTML = `
                <div class="alert alert-danger m-3">
                    No se pudo cargar el formulario.
                </div>
            `;
        }
    }

    function bindModalForm() {
        const form = modalBody.querySelector("form");
        if (!form) return;

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const formData = new FormData(form);

            try {
                const response = await fetch(form.action + "?modal=1", {
                    method: "POST",
                    body: formData,
                    headers: {
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                const data = await response.json();

                if (data.success) {
                    modalInstance.hide();
                    window.location.reload();
                    return;
                }

                if (data.errors) {
                    const errorBox = document.createElement("div");
                    errorBox.className = "alert alert-danger m-3";
                    errorBox.innerHTML = "<strong>Revisa los campos del formulario.</strong>";
                    modalBody.prepend(errorBox);
                }
            } catch (error) {
                console.error("Error enviando formulario:", error);
                alert("No se pudo guardar el servicio.");
            }
        });
    }

    const btnCrear = document.getElementById("btnOpenCrearServicioWeb");
    if (btnCrear) {
        btnCrear.addEventListener("click", () => {
            const url = btnCrear.dataset.url;
            abrirModalDesdeURL(url, "Nuevo Servicio Web");
        });
    }

    const btnCrear2 = document.getElementById("btnOpenCrearServicioWeb2");
    if (btnCrear2) {
        btnCrear2.addEventListener("click", () => {
            const url = btnCrear2.dataset.url;
            abrirModalDesdeURL(url, "Nuevo Servicio Web");
        });
    }

    document.querySelectorAll(".btn-edit-servicioweb").forEach((btn) => {
        btn.addEventListener("click", () => {
            const url = btn.dataset.url;
            abrirModalDesdeURL(url, "Editar Servicio Web");
        });
    });

    document.querySelectorAll(".btn-delete-servicioweb").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const url = btn.dataset.url;
            const nombre = btn.dataset.nombre || "este servicio";

            const confirmar = confirm(`¿Deseas eliminar ${nombre}?`);
            if (!confirmar) return;

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "X-CSRFToken": getCSRFToken()
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                window.location.reload();
            } catch (error) {
                console.error("Error eliminando servicio:", error);
                alert("No se pudo eliminar el servicio.");
            }
        });
    });

    document.querySelectorAll(".toggle-activo-servicioweb").forEach((btn) => {
        btn.addEventListener("click", async () => {
            const url = btn.dataset.url;

            try {
                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "X-Requested-With": "XMLHttpRequest",
                        "X-CSRFToken": getCSRFToken()
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                window.location.reload();
            } catch (error) {
                console.error("Error cambiando estado:", error);
                alert("No se pudo cambiar el estado del servicio.");
            }
        });
    });

    function getCSRFToken() {
        const cookieValue = document.cookie
            .split("; ")
            .find(row => row.startsWith("csrftoken="));

        return cookieValue ? cookieValue.split("=")[1] : "";
    }
});