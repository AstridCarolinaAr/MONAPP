/* global bootstrap, Swal, ogl */

function getCookie(name) {
    const v = `; ${document.cookie}`;
    const parts = v.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
}

async function confirmarSinMediaSiAplica(form) {
    // Solo cuando es CREAR
    const isEdit = form.dataset.isEdit === "1";
    if (isEdit) return true;

    const img = form.querySelector('input[name="imagen"]');
    const vid = form.querySelector('input[name="video"]');

    const hasImg = img && img.files && img.files.length > 0;
    const hasVid = vid && vid.files && vid.files.length > 0;

    // Si tiene ambos, no molestamos
    if (hasImg && hasVid) return true;

    let detalle = "";
    if (!hasImg && !hasVid) detalle = "sin imagen ni video";
    else if (!hasImg) detalle = "sin imagen";
    else detalle = "sin video";

    const res = await Swal.fire({
        icon: "warning",
        title: "Faltan archivos",
        html: `Estás a punto de crear el servicio <b>${detalle}</b>.<br>
               <small>El usuario podría no visualizar correctamente el resultado del servicio.</small><br><br>
               ¿Deseas continuar?`,
        showCancelButton: true,
        confirmButtonText: "Sí, continuar",
        cancelButtonText: "Volver y agregar",
        confirmButtonColor: "#3a2a24"
    });

    return res.isConfirmed;
}

function limpiarErrores(form) {
    form.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
    form.querySelectorAll(".invalid-feedback").forEach(el => el.remove());
}

function pintarErrores(form, errors) {
    Object.keys(errors || {}).forEach(key => {
        const input = form.querySelector(`[name="${key}"]`);
        if (!input) return;
        input.classList.add("is-invalid");

        let feedback = input.nextElementSibling;
        if (!feedback || !feedback.classList.contains("invalid-feedback")) {
            feedback = document.createElement("div");
            feedback.classList.add("invalid-feedback");
            input.parentNode.appendChild(feedback);
        }
        feedback.innerText = (errors[key] || []).join(", ");
    });
}

function activarClickVideoEnCards() {
    const cards = document.querySelectorAll(
        ".sq-card.has-video, .servicio-card"
    );

    cards.forEach(card => {
        card.addEventListener("click", (e) => {
            if (e.target.closest(".actions-overlay")) return;
            if (e.target.closest(".btn-edit-servicioweb")) return;
            if (e.target.closest(".btn-delete-servicioweb")) return;
            if (e.target.closest(".toggle-activo-servicioweb")) return;

            const video = card.querySelector("video.sq-video, video.servicio-video");
            if (!video) return;

            document.querySelectorAll("video.sq-video, video.servicio-video").forEach(otherVideo => {
                if (otherVideo !== video) {
                    otherVideo.pause();
                    otherVideo.closest(".sq-card, .servicio-card")?.classList.remove("playing");
                }
            });

            if (video.paused) {
                video.play()
                    .then(() => {
                        card.classList.add("playing");
                    })
                    .catch(err => {
                        console.error("No se pudo reproducir el video:", err);
                    });
            } else {
                video.pause();
                card.classList.remove("playing");
            }
        });
    });
}

function activarConfirmacionEnFormularioPagina() {
    const form = document.getElementById("servicioWebForm");
    if (!form) return;

    // Solo en página (no modal)
    const dentroDeModal = !!form.closest(".modal");
    if (dentroDeModal) return;

    form.addEventListener("submit", async (e) => {
        const ok = await confirmarSinMediaSiAplica(form);
        if (!ok) {
            e.preventDefault();
        }
    });
}

function activarModalYAjaxSiExiste() {
    const modalEl = document.getElementById("modalServicioWeb");
    if (!modalEl) return;

    const modalBody = modalEl.querySelector("#modalBodyContent");
    const modalLabel = modalEl.querySelector("#modalServicioWebLabel");
    const modal = new bootstrap.Modal(modalEl);

    async function cargarEnModal(url, tituloHtml) {
        modalLabel.innerHTML = tituloHtml;
        modalBody.innerHTML = `
            <div class="text-center p-5">
                <div class="spinner-border text-primary" role="status"></div>
            </div>
        `;
        modal.show();

        const resp = await fetch(url, { credentials: "same-origin" });
        const html = await resp.text();
        modalBody.innerHTML = html;

        const form = modalBody.querySelector("form");
        if (form) activarSubmitAjax(form);
    }

    async function activarSubmitAjax(form) {
        form.addEventListener("submit", async (e) => {
            e.preventDefault();
            limpiarErrores(form);

            const ok = await confirmarSinMediaSiAplica(form);
            if (!ok) return;

            const formData = new FormData(form);

            const resp = await fetch(form.action, {
                method: "POST",
                body: formData,
                credentials: "same-origin",
                headers: {
                    "X-Requested-With": "XMLHttpRequest",
                    "X-CSRFToken": getCookie("csrftoken")
                }
            });

            const ct = (resp.headers.get("content-type") || "").toLowerCase();

            // Si tu backend responde JSON (recomendado)
            if (ct.includes("application/json")) {
                const data = await resp.json();

                if (data.success) {
                    modal.hide();
                    await Swal.fire({
                        icon: "success",
                        title: "¡Éxito!",
                        text: data.message || "Guardado correctamente",
                        confirmButtonColor: "#3a2a24"
                    });
                    location.reload();
                } else {
                    pintarErrores(form, data.errors || {});
                }
                return;
            }

            // Fallback: si responde HTML
            const html = await resp.text();
            modalBody.innerHTML = html;

            const newForm = modalBody.querySelector("form");
            if (newForm) activarSubmitAjax(newForm);
        });
    }

    // Botón CREAR
    const btnCrear = document.getElementById("btnOpenCrearServicioWeb");
    if (btnCrear) {
        btnCrear.addEventListener("click", () => {
            const url = btnCrear.dataset.url + "?modal=1";
            cargarEnModal(url, `<i class="bi bi-plus-circle me-2"></i> Nuevo Servicio Web`);
        });
    }

    // Botones EDITAR
    document.querySelectorAll(".btn-edit-servicioweb").forEach(btn => {
        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const url = btn.dataset.url + "?modal=1";
            cargarEnModal(url, `<i class="bi bi-pencil-square me-2"></i> Editar Servicio Web`);
        });
    });
}
function activarEliminarServicioWeb() {
    document.querySelectorAll(".btn-delete-servicioweb").forEach(btn => {
        btn.addEventListener("click", async (e) => {
            e.preventDefault();

            const url = btn.dataset.url;
            const nombre = btn.dataset.nombre || "este servicio";

            const res = await Swal.fire({
                title: "¿Eliminar servicio?",
                html: `¿Seguro que deseas eliminar <strong>${nombre}</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>`,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
                confirmButtonText: '<i class="bi bi-trash3"></i> Sí, eliminar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true
            });

            if (!res.isConfirmed) return;

            const form = document.createElement("form");
            form.method = "POST";
            form.action = url;

            const csrf = document.createElement("input");
            csrf.type = "hidden";
            csrf.name = "csrfmiddlewaretoken";
            csrf.value = getCookie("csrftoken");

            form.appendChild(csrf);
            document.body.appendChild(form);
            form.submit();
        });
    });
}
function activarToggleEstadoServicioWeb() {

    document.querySelectorAll(".toggle-activo-servicioweb").forEach(btn => {

        btn.addEventListener("click", async function () {

            const url = this.dataset.url;

            try {

                const response = await fetch(url, {
                    method: "POST",
                    headers: {
                        "X-CSRFToken": getCookie("csrftoken"),
                        "X-Requested-With": "XMLHttpRequest"
                    }
                });

                const data = await response.json();

                if (data.success) {

                    const icon = this.querySelector("i");

                    if (data.activo) {
                        icon.classList.remove("bi-toggle-off", "text-secondary");
                        icon.classList.add("bi-toggle-on", "text-success");
                    } else {
                        icon.classList.remove("bi-toggle-on", "text-success");
                        icon.classList.add("bi-toggle-off", "text-secondary");
                    }

                }

            } catch (error) {
                console.error("Error cambiando estado:", error);
            }

        });

    });

}

function activarBotonEmptyState() {
    const b2 = document.getElementById('btnOpenCrearServicioWeb2');
    const b1 = document.getElementById('btnOpenCrearServicioWeb');
    if (b2 && b1) b2.addEventListener('click', () => b1.click());
}

/* =========================
   DOMContentLoaded handlers
   ========================= */
document.addEventListener("DOMContentLoaded", () => {
    activarClickVideoEnCards();
    activarConfirmacionEnFormularioPagina();
    activarModalYAjaxSiExiste();
    activarBotonEmptyState();
    activarEliminarServicioWeb();
    activarToggleEstadoServicioWeb();
});

