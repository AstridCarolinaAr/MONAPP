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

        const isEdit = form.dataset.isEdit === "1";
        const servicioId = form.dataset.servicioId || "";

        const nombreInput = form.querySelector('input[name="nombre"]');
        const descripcionInput = form.querySelector('textarea[name="descripcion"]');
        const precioInput = form.querySelector('input[name="precio"]');
        const imagenInput = form.querySelector('input[name="imagen"]');
        const videoInput = form.querySelector('input[name="video"]');
        const btnGuardar = form.querySelector("#btnGuardarServicioWeb");

        let nombreTimer = null;
        let videoDurationValida = true;

        function setButtonState(enabled) {
            if (!btnGuardar) return;
            btnGuardar.disabled = !enabled;
            btnGuardar.classList.toggle("btn-secondary", !enabled);
            btnGuardar.classList.toggle("btn-primary", enabled);
        }

        function getFeedbackElement(input) {
            if (!input) return null;

            if (input.closest(".input-group")) {
                const group = input.closest(".input-group");
                const next = group.nextElementSibling;
                if (next && next.classList.contains("invalid-feedback")) return next;
            }

            let next = input.nextElementSibling;
            while (next) {
                if (next.classList && next.classList.contains("invalid-feedback")) return next;
                next = next.nextElementSibling;
            }

            return null;
        }

        function setInvalid(input, message) {
            if (!input) return;
            input.classList.remove("is-valid");
            input.classList.add("is-invalid");

            const feedback = getFeedbackElement(input);
            if (feedback) feedback.textContent = message || "";
        }

        function setValid(input) {
            if (!input) return;
            input.classList.remove("is-invalid");
            input.classList.add("is-valid");

            const feedback = getFeedbackElement(input);
            if (feedback) feedback.textContent = "";
        }

        function clearState(input) {
            if (!input) return;
            input.classList.remove("is-invalid", "is-valid");

            const feedback = getFeedbackElement(input);
            if (feedback) feedback.textContent = "";
        }

        async function validarNombre() {
            const valor = (nombreInput.value || "").trim();

            if (!valor) {
                setInvalid(nombreInput, "El nombre es obligatorio.");
                updateSubmitState();
                return false;
            }

            if (valor.length < 3) {
                setInvalid(nombreInput, "Debe tener al menos 3 caracteres.");
                updateSubmitState();
                return false;
            }

            if (!/^[A-Za-zÁÉÍÓÚáéíóúÑñ0-9\s().,\-]+$/.test(valor)) {
                setInvalid(nombreInput, "Contiene caracteres no permitidos.");
                updateSubmitState();
                return false;
            }

            return new Promise((resolve) => {
                if (nombreTimer) clearTimeout(nombreTimer);

                nombreTimer = setTimeout(async () => {
                    try {
                        const url = `/servicios_web/validar-nombre/?nombre=${encodeURIComponent(valor)}&servicio_id=${encodeURIComponent(servicioId)}`;
                        const response = await fetch(url, {
                            headers: { "X-Requested-With": "XMLHttpRequest" }
                        });
                        const data = await response.json();

                        if (data.valido) {
                            setValid(nombreInput);
                            updateSubmitState();
                            resolve(true);
                        } else {
                            setInvalid(nombreInput, data.mensaje || "Nombre no válido.");
                            updateSubmitState();
                            resolve(false);
                        }
                    } catch (error) {
                        console.error("Error validando nombre:", error);
                        setInvalid(nombreInput, "No se pudo validar el nombre.");
                        updateSubmitState();
                        resolve(false);
                    }
                }, 400);
            });
        }

        function validarDescripcion() {
            const valor = (descripcionInput.value || "").trim();

            if (!valor) {
                setInvalid(descripcionInput, "La descripción es obligatoria.");
                return false;
            }

            if (valor.length < 10) {
                setInvalid(descripcionInput, "Debe tener al menos 10 caracteres.");
                return false;
            }

            setValid(descripcionInput);
            return true;
        }

        function validarPrecio() {
            const valor = (precioInput.value || "").trim();

            if (!valor) {
                setInvalid(precioInput, "El precio es obligatorio.");
                return false;
            }

            const numero = parseFloat(valor);

            if (Number.isNaN(numero)) {
                setInvalid(precioInput, "Ingresa un precio válido.");
                return false;
            }

            if (numero <= 0) {
                setInvalid(precioInput, "Debe ser mayor a 0.");
                return false;
            }

            setValid(precioInput);
            return true;
        }

        function validarImagen() {
            if (!imagenInput) return true;

            const file = imagenInput.files[0];
            if (!file) {
                clearState(imagenInput);
                return true;
            }

            if (!file.type.startsWith("image/")) {
                setInvalid(imagenInput, "Debes seleccionar una imagen válida.");
                return false;
            }

            setValid(imagenInput);
            return true;
        }

        async function validarVideo() {
            if (!videoInput) return true;

            const file = videoInput.files[0];
            if (!file) {
                clearState(videoInput);
                videoDurationValida = true;
                return true;
            }

            const tiposPermitidos = ["video/mp4", "video/webm", "video/ogg", "video/quicktime"];
            if (!tiposPermitidos.includes(file.type)) {
                setInvalid(videoInput, "Formato de video no permitido.");
                videoDurationValida = false;
                return false;
            }

            const maxSizeMB = 25;
            if (file.size > maxSizeMB * 1024 * 1024) {
                setInvalid(videoInput, `El video no puede superar ${maxSizeMB} MB.`);
                videoDurationValida = false;
                return false;
            }

            return new Promise((resolve) => {
                const video = document.createElement("video");
                video.preload = "metadata";

                video.onloadedmetadata = () => {
                    URL.revokeObjectURL(video.src);

                    if (video.duration > 20) {
                        setInvalid(videoInput, "El video no puede durar más de 20 segundos.");
                        videoDurationValida = false;
                        resolve(false);
                        return;
                    }

                    setValid(videoInput);
                    videoDurationValida = true;
                    resolve(true);
                };

                video.onerror = () => {
                    URL.revokeObjectURL(video.src);
                    setInvalid(videoInput, "No se pudo leer la duración del video.");
                    videoDurationValida = false;
                    resolve(false);
                };

                video.src = URL.createObjectURL(file);
            });
        }

        function isInputValid(input) {
            if (!input) return true;
            return input.classList.contains("is-valid") && !input.classList.contains("is-invalid");
        }

        function updateSubmitState() {
            const nombreOk = isInputValid(nombreInput);
            const descripcionOk = isInputValid(descripcionInput);
            const precioOk = isInputValid(precioInput);

            const imagenOk = !imagenInput || !imagenInput.classList.contains("is-invalid");
            const videoOk = !videoInput || (!videoInput.classList.contains("is-invalid") && videoDurationValida);

            setButtonState(nombreOk && descripcionOk && precioOk && imagenOk && videoOk);
        }

        nombreInput?.addEventListener("input", () => {
            validarNombre();
        });

        descripcionInput?.addEventListener("input", () => {
            validarDescripcion();
            updateSubmitState();
        });

        precioInput?.addEventListener("input", () => {
            validarPrecio();
            updateSubmitState();
        });

        imagenInput?.addEventListener("change", () => {
            validarImagen();
            updateSubmitState();
        });

        videoInput?.addEventListener("change", async () => {
            await validarVideo();
            updateSubmitState();
        });

        if ((nombreInput.value || "").trim()) validarNombre();
        if ((descripcionInput.value || "").trim()) validarDescripcion();
        if ((precioInput.value || "").trim()) validarPrecio();
        updateSubmitState();

        form.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nombreOk = await validarNombre();
            const descripcionOk = validarDescripcion();
            const precioOk = validarPrecio();
            const imagenOk = validarImagen();
            const videoOk = await validarVideo();

            updateSubmitState();

            if (!(nombreOk && descripcionOk && precioOk && imagenOk && videoOk)) {
                Swal.fire({
                    icon: "warning",
                    title: "Formulario incompleto",
                    text: "Corrige los campos marcados antes de guardar."
                });
                return;
            }

            const tieneImagenNueva = imagenInput && imagenInput.files && imagenInput.files.length > 0;
            const tieneVideoNuevo = videoInput && videoInput.files && videoInput.files.length > 0;

            if (!isEdit && !tieneImagenNueva && !tieneVideoNuevo) {
                const result = await Swal.fire({
                    title: "¿Guardar servicio sin multimedia?",
                    html: `
                        <div style="font-size: 15px;">
                            Este servicio web <strong>no tiene imagen ni video</strong>.<br><br>
                            Si continúas, se mostrará en la página web <strong>sin contenido multimedia</strong>.<br><br>
                            ¿Deseas guardarlo de todas formas?
                        </div>
                    `,
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#2b2b2b",
                    cancelButtonColor: "#6c757d",
                    confirmButtonText: "Sí, guardar servicio",
                    cancelButtonText: "Cancelar",
                    reverseButtons: true
                });

                if (!result.isConfirmed) return;
            }

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

                    await Swal.fire({
                        icon: "success",
                        title: "Servicio guardado",
                        text: data.message || "El servicio web fue guardado correctamente.",
                        timer: 1600,
                        showConfirmButton: false
                    });

                    window.location.reload();
                    return;
                }

                Swal.fire({
                    icon: "error",
                    title: "No se pudo guardar",
                    text: "Revisa los datos del formulario."
                });
            } catch (error) {
                console.error("Error enviando formulario:", error);

                Swal.fire({
                    icon: "error",
                    title: "No se pudo guardar",
                    text: "Ocurrió un error al guardar el servicio."
                });
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

    function getCSRFToken() {
        const cookieValue = document.cookie
            .split("; ")
            .find(row => row.startsWith("csrftoken="));

        return cookieValue ? cookieValue.split("=")[1] : "";
    }

    const cards = document.querySelectorAll(".sq-card");

    function prepareVideo(video) {
        if (!video) return;

        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        video.setAttribute("preload", "metadata");
    }

    function closeVideo(card, video) {
        if (!card || !video) return;

        card.classList.remove("playing");

        try {
            video.pause();
            video.currentTime = 0;
        } catch (err) {
            console.warn("No se pudo cerrar el video:", err);
        }
    }

    function closeAllVideos(exceptCard = null) {
        document.querySelectorAll(".sq-card.playing").forEach((openCard) => {
            if (exceptCard && openCard === exceptCard) return;

            const openVideo = openCard.querySelector("video.sq-video");
            closeVideo(openCard, openVideo);
        });
    }

    async function openVideo(card, video) {
        if (!card || !video) return;

        closeAllVideos(card);
        prepareVideo(video);

        try {
            video.pause();
            video.currentTime = 0;
        } catch (err) {
            console.warn("No se pudo reiniciar el video:", err);
        }

        try {
            const playPromise = video.play();

            if (playPromise && typeof playPromise.then === "function") {
                await playPromise;
            }

            card.classList.add("playing");
        } catch (err) {
            console.warn("Error al reproducir video:", err);
        }
    }

    cards.forEach((card) => {
        const video = card.querySelector("video.sq-video");

        if (video) {
            prepareVideo(video);

            video.addEventListener("click", (e) => {
                e.stopPropagation();
            });

            video.addEventListener("ended", () => {
                closeVideo(card, video);
            });

            video.addEventListener("error", () => {
                console.warn("El video no pudo cargarse:", video.currentSrc || video.src);
            });

            video.addEventListener("loadeddata", () => {
                card.classList.add("video-loaded");
            });
        }

        card.addEventListener("click", async (e) => {
            if (
                e.target.closest(".actions-overlay") ||
                e.target.closest(".btn-action") ||
                e.target.closest("button") ||
                e.target.closest("a")
            ) {
                return;
            }

            if (!video) return;

            if (card.classList.contains("playing")) {
                closeVideo(card, video);
                return;
            }

            await openVideo(card, video);
        });
    });

    document.querySelectorAll(".btn-edit-servicioweb").forEach((btn) => {
        btn.addEventListener("click", (e) => {
            e.stopPropagation();
            const url = btn.dataset.url;
            abrirModalDesdeURL(url, "Editar Servicio Web");
        });
    });

    document.querySelectorAll(".btn-delete-servicioweb").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();

            const url = btn.dataset.url;
            const nombre = btn.dataset.nombre || "este servicio";

            const result = await Swal.fire({
                title: "¿Eliminar servicio web?",
                html: `
                    <div style="font-size: 15px;">
                        Vas a eliminar <strong>${nombre}</strong>.<br><br>
                        Esta acción no se puede deshacer.
                    </div>
                `,
                icon: "warning",
                showCancelButton: true,
                confirmButtonColor: "#dc3545",
                cancelButtonColor: "#6c757d",
                confirmButtonText: "Sí, eliminar",
                cancelButtonText: "Cancelar",
                reverseButtons: true,
                focusCancel: true
            });

            if (!result.isConfirmed) return;

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

                await Swal.fire({
                    icon: "success",
                    title: "Servicio eliminado",
                    text: `El servicio "${nombre}" fue eliminado correctamente.`,
                    timer: 1500,
                    showConfirmButton: false
                });

                window.location.reload();
            } catch (error) {
                console.error("Error eliminando servicio:", error);

                Swal.fire({
                    icon: "error",
                    title: "No se pudo eliminar",
                    text: "Ocurrió un error al eliminar el servicio web."
                });
            }
        });
    });

    document.querySelectorAll(".toggle-activo-servicioweb").forEach((btn) => {
        btn.addEventListener("click", async (e) => {
            e.stopPropagation();

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

    const serviciosWebView = document.getElementById("serviciosWebView");
    const viewButtons = document.querySelectorAll(".sw-view-btn");

    function aplicarVista(view) {
        if (!serviciosWebView) return;

        serviciosWebView.dataset.view = view;
        localStorage.setItem("servicios_web_view_mode", view);

        viewButtons.forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.view === view);
        });
    }

    viewButtons.forEach((btn) => {
        btn.addEventListener("click", () => {
            aplicarVista(btn.dataset.view);
        });
    });

    const vistaGuardada = localStorage.getItem("servicios_web_view_mode") || "grid-2";
    aplicarVista(vistaGuardada);

    const previewModalEl = document.getElementById("modalPreviewMedia");
    const previewModalBody = document.getElementById("modalPreviewMediaBody");
    const previewModalLabel = document.getElementById("modalPreviewMediaLabel");
    const previewModal = previewModalEl ? new bootstrap.Modal(previewModalEl) : null;

    let lastPreviewServicioId = null;
    let lastPreviewMode = "image";

    function renderPreviewMedia({ nombre, imagen, video, mode }) {
        if (!previewModalBody || !previewModalLabel) return;

        previewModalLabel.textContent = nombre || "Vista previa";

        let content = "";

        if (mode === "video" && video) {
            content = `
                <div class="sw-preview-container"
                    data-preview-nombre="${nombre || ''}"
                    data-preview-imagen="${imagen || ''}"
                    data-preview-video="${video || ''}"
                    data-preview-mode="video">
                    <div class="sw-preview-help">Vista de video</div>
                    <video class="sw-preview-media sw-preview-video"
                        src="${video}"
                        controls
                        autoplay
                        playsinline
                        preload="metadata">
                        Tu navegador no soporta video.
                    </video>
                </div>
            `;
        } else if (imagen) {
            content = `
                <div class="sw-preview-container sw-preview-clickable"
                    data-preview-nombre="${nombre || ''}"
                    data-preview-imagen="${imagen || ''}"
                    data-preview-video="${video || ''}"
                    data-preview-mode="image">
                    ${video ? '<div class="sw-preview-help">Haz click en la imagen para mostrar el video</div>' : ''}
                    <img src="${imagen}" alt="${nombre}" class="sw-preview-media sw-preview-image">
                </div>
            `;
        } else if (video) {
            content = `
                <div class="sw-preview-container"
                    data-preview-nombre="${nombre || ''}"
                    data-preview-imagen="${imagen || ''}"
                    data-preview-video="${video || ''}"
                    data-preview-mode="video">
                    <div class="sw-preview-help">Vista de video</div>
                    <video class="sw-preview-media sw-preview-video"
                        src="${video}"
                        controls
                        autoplay
                        playsinline
                        preload="metadata">
                        Tu navegador no soporta video.
                    </video>
                </div>
            `;
        } else {
            content = `
                <div class="sw-preview-empty">
                    <i class="bi bi-image" style="font-size: 3rem;"></i>
                    <p class="mt-3 mb-0">Este servicio no tiene imagen ni video.</p>
                </div>
            `;
        }

        previewModalBody.innerHTML = content;

        const videoEl = previewModalBody.querySelector("video");
        if (videoEl) {
            videoEl.play().catch((err) => {
                console.warn("No se pudo reproducir automáticamente el video del modal:", err);
            });
        }

        const clickableImageContainer = previewModalBody.querySelector(".sw-preview-clickable");
        if (clickableImageContainer) {
            clickableImageContainer.addEventListener("click", () => {
                const nextNombre = clickableImageContainer.dataset.previewNombre || "";
                const nextImagen = clickableImageContainer.dataset.previewImagen || "";
                const nextVideo = clickableImageContainer.dataset.previewVideo || "";

                if (!nextVideo) return;

                renderPreviewMedia({
                    nombre: nextNombre,
                    imagen: nextImagen,
                    video: nextVideo,
                    mode: "video"
                });

                lastPreviewMode = "video";
            });
        }
    }

    document.querySelectorAll(".sw-media-trigger").forEach((btn) => {
        btn.addEventListener("click", () => {
            const servicioId = btn.dataset.servicioId;
            const nombre = btn.dataset.nombre || "Vista previa";
            const imagen = btn.dataset.imagen || "";
            const video = btn.dataset.video || "";

            let mode = "image";

            if (!imagen && video) {
                mode = "video";
            } else if (lastPreviewServicioId === servicioId) {
                if (lastPreviewMode === "image" && video) {
                    mode = "video";
                } else {
                    mode = "image";
                }
            }

            renderPreviewMedia({ nombre, imagen, video, mode });

            lastPreviewServicioId = servicioId;
            lastPreviewMode = mode;

            if (previewModal) {
                previewModal.show();
            }
        });
    });

    if (previewModalEl) {
        previewModalEl.addEventListener("hidden.bs.modal", () => {
            if (previewModalBody) {
                previewModalBody.innerHTML = "";
            }
            lastPreviewServicioId = null;
            lastPreviewMode = "image";
        });
    }
/* =========================
   ORDENAR TABLA POR COLUMNAS
========================= */
    const tablaServicios = document.querySelector(".services-table-wrapper table tbody");
    const sortableHeaders = document.querySelectorAll(".sw-sortable");

    const sortState = {};

    function normalizarNumero(valor) {
        if (valor === null || valor === undefined) return 0;
        const limpio = String(valor).replace(/[^0-9.-]+/g, "");
        const numero = parseFloat(limpio);
        return Number.isNaN(numero) ? 0 : numero;
    }

    function actualizarIconosOrden(headerActivo, direction) {
        sortableHeaders.forEach((th) => {
            const icon = th.querySelector("i");
            if (!icon) return;

            if (th !== headerActivo) {
                icon.className = "bi bi-arrow-down-up ms-1";
                th.classList.remove("sorted-asc", "sorted-desc");
                return;
            }

            th.classList.remove("sorted-asc", "sorted-desc");

            if (direction === "asc") {
                icon.className = "bi bi-sort-down ms-1";
                th.classList.add("sorted-asc");
            } else {
                icon.className = "bi bi-sort-up ms-1";
                th.classList.add("sorted-desc");
            }
        });
    }

    sortableHeaders.forEach((header) => {
        header.addEventListener("click", () => {
            if (!tablaServicios) return;

            const key = header.dataset.sortKey;
            const type = header.dataset.sortType || "text";

            const rows = Array.from(tablaServicios.querySelectorAll("tr"));
            const currentDirection = sortState[key] === "asc" ? "desc" : "asc";
            sortState[key] = currentDirection;

            rows.sort((a, b) => {
                let valorA = a.dataset[key] || "";
                let valorB = b.dataset[key] || "";

                if (type === "number") {
                    valorA = normalizarNumero(valorA);
                    valorB = normalizarNumero(valorB);
                } else {
                    valorA = String(valorA).toLowerCase().trim();
                    valorB = String(valorB).toLowerCase().trim();
                }

                if (valorA < valorB) return currentDirection === "asc" ? -1 : 1;
                if (valorA > valorB) return currentDirection === "asc" ? 1 : -1;
                return 0;
            });

            rows.forEach((row) => tablaServicios.appendChild(row));
            actualizarIconosOrden(header, currentDirection);
        });
    });
/* =========================
BUSCADOR SERVICIOS WEB
========================= */
    const searchShell = document.getElementById("swSearchShell");
    const searchToggle = document.getElementById("swSearchToggle");
    const inputBuscarServicios = document.getElementById("swBuscarServicios");

    const cardsServicios = document.querySelectorAll(".sq-card");
    const filasServicios = document.querySelectorAll(".services-table-wrapper tbody tr");

    function normalizarTexto(texto) {
        return (texto || "")
            .toString()
            .toLowerCase()
            .trim();
    }

    function ejecutarBusquedaServicios() {
        const termino = normalizarTexto(inputBuscarServicios?.value);

        cardsServicios.forEach((card) => {
            const texto = normalizarTexto(card.dataset.search);
            const visible = termino === "" || texto.includes(termino);
            card.classList.toggle("sw-hidden", !visible);
        });

        filasServicios.forEach((fila) => {
            if (fila.querySelector("td[colspan]")) return;

            const texto = normalizarTexto(fila.dataset.search);
            const visible = termino === "" || texto.includes(termino);
            fila.classList.toggle("sw-hidden", !visible);
        });
    }

    function girarIconoBusqueda() {
        if (!searchToggle) return;

        searchToggle.classList.remove("is-rotating");
        void searchToggle.offsetWidth;
        searchToggle.classList.add("is-rotating");
    }

    function abrirBuscadorServicios() {
        if (!searchShell) return;

        searchShell.classList.add("is-open");
        girarIconoBusqueda();

        setTimeout(() => {
            inputBuscarServicios?.focus();
        }, 220);
    }

    function cerrarBuscadorServicios() {
        if (!searchShell || !inputBuscarServicios) return;

        inputBuscarServicios.value = "";
        ejecutarBusquedaServicios();
        searchShell.classList.remove("is-open");
    }

    if (searchShell && searchToggle && inputBuscarServicios) {
        searchToggle.addEventListener("click", (e) => {
            e.preventDefault();

            const abierto = searchShell.classList.contains("is-open");
            const termino = normalizarTexto(inputBuscarServicios.value);

            if (!abierto) {
                abrirBuscadorServicios();
                return;
            }

            girarIconoBusqueda();

            if (termino !== "") {
                ejecutarBusquedaServicios();
                inputBuscarServicios.focus();
            } else {
                cerrarBuscadorServicios();
            }
        });

        inputBuscarServicios.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                ejecutarBusquedaServicios();
            }
        });

        inputBuscarServicios.addEventListener("input", () => {
            if (normalizarTexto(inputBuscarServicios.value) === "") {
                ejecutarBusquedaServicios();
            }
        });

        searchToggle.addEventListener("animationend", () => {
            searchToggle.classList.remove("is-rotating");
        });
    }
});