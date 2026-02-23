document.addEventListener("DOMContentLoaded", () => {
  const modalEl = document.getElementById("ajaxFormModal");
  const modalTitleEl = document.getElementById("ajaxFormModalTitle");
  const modalBodyEl = document.getElementById("ajaxFormModalBody");
  if (!modalEl || !modalTitleEl || !modalBodyEl) return;

  const modal = new bootstrap.Modal(modalEl);

  async function fetchSmart(url, options = {}) {
    const res = await fetch(url, options);
    const contentType = (res.headers.get("content-type") || "").toLowerCase();

    if (contentType.includes("application/json")) {
      const data = await res.json();
      return { type: "json", ok: res.ok, status: res.status, data };
    }

    const text = await res.text();
    return { type: "html", ok: res.ok, status: res.status, data: text };
  }

  async function openModal(url, title) {
    modalTitleEl.textContent = title || "Formulario";
    modalBodyEl.innerHTML = `
      <div class="d-flex justify-content-center py-5">
        <div class="spinner-border" role="status" aria-hidden="true"></div>
      </div>
    `;
    modal.show();

    const result = await fetchSmart(url, {
      method: "GET",
      credentials: "same-origin",
      headers: { "X-Requested-With": "XMLHttpRequest" },
    });

    if (result.type === "json") {
      modalTitleEl.textContent = result.data.title || title || "Formulario";
      modalBodyEl.innerHTML = result.data.html || `<div class="alert alert-danger">No se pudo cargar.</div>`;
      return;
    }

    modalBodyEl.innerHTML = result.data;
  }

  document.addEventListener("click", (e) => {
    const trigger = e.target.closest("[data-modal-url]");
    if (!trigger) return;

    e.preventDefault();
    openModal(trigger.getAttribute("data-modal-url"), trigger.getAttribute("data-modal-title") || "Formulario");
  });

  document.addEventListener("submit", async (e) => {
    const form = e.target.closest("#ajaxFormModal form");
    if (!form) return;

    e.preventDefault();

    const url = form.action;
    const formData = new FormData(form);
    const csrf = form.querySelector('input[name="csrfmiddlewaretoken"]')?.value;

    const result = await fetchSmart(url, {
      method: "POST",
      body: formData,
      credentials: "same-origin",
      headers: {
        "X-Requested-With": "XMLHttpRequest",
        "X-CSRFToken": csrf,
      },
    });

    if (result.type === "json") {
      if (result.data.success) {
        modal.hide();
        window.location.reload();
        return;
      }

      modalTitleEl.textContent = result.data.title || modalTitleEl.textContent;
      modalBodyEl.innerHTML = result.data.html || `<div class="alert alert-danger mb-0">No se pudo guardar.</div>`;
      return;
    }

    modalBodyEl.innerHTML = result.data;
  });
});
window.initProductoImagenPreview = function (root) {
  const scope = root || document;

  const inputFile = scope.querySelector("#id_imagen");
  const inputUrl = scope.querySelector("#id_imagen_url");
  const img = scope.querySelector("#previewProductoImagen");
  const msg = scope.querySelector("#previewProductoImagenMsg");

  if (!img) return;

  function showMsg(text) {
    if (msg) msg.textContent = text || "";
  }

  function showPreview(src) {
    img.src = src;
    img.style.display = "block";
  }

  function hidePreview() {
    img.removeAttribute("src");
    img.style.display = "none";
  }

  function isLikelyImageUrl(url) {
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url.split("?")[0]);
  }

  function previewFile(file) {
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      hidePreview();
      showMsg("El archivo seleccionado no es una imagen.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      showPreview(e.target.result);
      showMsg("");
    };
    reader.readAsDataURL(file);
  }

  function previewUrl(url) {
    const clean = (url || "").trim();
    if (!clean) {
      if (!inputFile || !inputFile.files || inputFile.files.length === 0) {
        hidePreview();
        showMsg("");
      }
      return;
    }

    if (!isLikelyImageUrl(clean)) {
      showMsg("La URL no parece una imagen directa.");
    } else {
      showMsg("");
    }

    img.onerror = () => {
      hidePreview();
      showMsg("No se pudo cargar la imagen desde la URL.");
    };

    img.onload = () => showMsg("");

    showPreview(clean);
  }

  if (inputFile) {
    inputFile.addEventListener("change", () => {
      const file = inputFile.files && inputFile.files[0];
      if (file) {
        previewFile(file);
        return;
      }
      if (inputUrl) previewUrl(inputUrl.value);
    });
  }

  if (inputUrl) {
    const handler = () => {
      if (inputFile && inputFile.files && inputFile.files.length > 0) return;
      previewUrl(inputUrl.value);
    };

    inputUrl.addEventListener("input", handler);
    inputUrl.addEventListener("change", handler);
  }
};