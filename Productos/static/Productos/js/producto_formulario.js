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
// static/productos/js/productoformulario.js
(function () {
  // =========================
  // Helpers UI
  // =========================
  function qs(root, sel) {
    return (root || document).querySelector(sel);
  }

  function qsa(root, sel) {
    return Array.from((root || document).querySelectorAll(sel));
  }

  function showGeneralErrors(root, messages = []) {
    const box = qs(root, "#productoErroresGenerales");
    if (!box) return;

    if (!messages.length) {
      box.classList.add("d-none");
      box.innerHTML = "";
      return;
    }

    box.classList.remove("d-none");
    box.innerHTML = `
      <strong>Revisa estos campos:</strong>
      <ul class="mb-0 mt-2">
        ${messages.map(m => `<li>${m}</li>`).join("")}
      </ul>
    `;
  }

  function markInvalid(input, msg) {
    if (!input) return;
    input.classList.add("is-invalid");

    // si es select2 o input-group podrías ajustar aquí, pero normal funciona:
    let fb = input.parentElement?.querySelector(".invalid-feedback");
    if (!fb) {
      fb = document.createElement("div");
      fb.className = "invalid-feedback";
      input.insertAdjacentElement("afterend", fb);
    }
    fb.textContent = msg || "Campo inválido";
  }

  function clearInvalid(input) {
    if (!input) return;
    input.classList.remove("is-invalid");

    const fb = input.parentElement?.querySelector(".invalid-feedback");
    if (fb) fb.textContent = "";
  }

  function isValidUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function isImageUrl(url) {
    // no perfecto, pero suficiente
    return /\.(png|jpg|jpeg|webp|gif)$/i.test(url.split("?")[0]);
  }

  function getSubmitButton(form) {
    // ajusta si tu botón tiene id específico
    return (
      qs(form, "#btnGuardarProducto") ||
      qs(form, 'button[type="submit"]')
    );
  }

  // =========================
  // Preview imagen
  // =========================
  function updatePreview(root) {
    const form = qs(root, "form.producto-form") || qs(root, "form");
    if (!form) return;

    const imgInput = qs(form, "#id_imagen");
    const urlInput = qs(form, "#id_imagen_url");

    const imgEl = qs(form, "#previewProductoImagen");
    const msgEl = qs(form, "#previewProductoImagenMsg");

    if (!imgEl) return;

    // prioridad: archivo > url
    const file = imgInput?.files?.[0];
    const url = (urlInput?.value || "").trim();

    // reset
    imgEl.style.display = "none";
    if (msgEl) msgEl.textContent = "";

    if (file) {
      // validar tipo rápido
      if (!file.type.startsWith("image/")) {
        if (msgEl) msgEl.textContent = "El archivo seleccionado no es una imagen.";
        return;
      }

      // preview con blob
      const blobUrl = URL.createObjectURL(file);
      imgEl.src = blobUrl;
      imgEl.style.display = "block";
      if (msgEl) msgEl.textContent = `${file.name}`;

      // liberar después (evita leaks)
      imgEl.onload = () => {
        URL.revokeObjectURL(blobUrl);
      };
      return;
    }

    if (url) {
      imgEl.src = url;
      imgEl.style.display = "block";
      if (msgEl) msgEl.textContent = "Vista previa desde URL";
      return;
    }
  }

  // =========================
  // Validaciones
  // =========================
  function validateProductoForm(root) {
    const form =
      qs(root, "form.producto-form") ||
      qs(root, "#productoForm") ||
      qs(root, "form");

    if (!form) return true;

    const errores = [];

    // Campos (ajusta IDs si difieren)
    const marca = qs(form, "#id_marca");
    const nombre = qs(form, "#id_nombre");
    const precio = qs(form, "#id_precio");
    const linea = qs(form, "#id_linea"); // si es opcional, quítalo
    const presentacion = qs(form, "#id_presentacion"); // opcional
    const unidad = qs(form, "#id_unidad_medida"); // opcional

    const imgInput = qs(form, "#id_imagen");
    const urlInput = qs(form, "#id_imagen_url");

    // nombre obligatorio
    if (nombre) {
      const v = (nombre.value || "").trim();
      if (!v) {
        errores.push("El nombre del producto es obligatorio.");
        markInvalid(nombre, "Nombre obligatorio");
      } else {
        clearInvalid(nombre);
      }
    }

    // marca (si es obligatorio)
    if (marca) {
      const v = (marca.value || "").trim();
      if (!v) {
        errores.push("La marca es obligatoria.");
        markInvalid(marca, "Marca obligatoria");
      } else {
        clearInvalid(marca);
      }
    }

    // precio > 0
    if (precio) {
      const raw = String(precio.value || "").replace(/\./g, "").replace(",", ".");
      const n = parseFloat(raw);
      if (!Number.isFinite(n) || n <= 0) {
        errores.push("El precio debe ser mayor que 0.");
        markInvalid(precio, "Mayor que 0");
      } else {
        clearInvalid(precio);
      }
    }

    // opcionales: si quieres obligar línea/unidad, activa
    if (linea && linea.hasAttribute("required")) {
      if (!linea.value) {
        errores.push("La línea es obligatoria.");
        markInvalid(linea, "Obligatoria");
      } else clearInvalid(linea);
    }

    if (unidad && unidad.hasAttribute("required")) {
      if (!unidad.value) {
        errores.push("La unidad de medida es obligatoria.");
        markInvalid(unidad, "Obligatoria");
      } else clearInvalid(unidad);
    }

    // Imagen: puede venir por archivo o por URL (opcionales)
    // Solo validamos si la llenan
    const file = imgInput?.files?.[0];
    const url = (urlInput?.value || "").trim();

    if (urlInput) {
      if (url && (!isValidUrl(url) || !isImageUrl(url))) {
        errores.push("La URL de imagen no parece válida (usa http/https y termina en .jpg/.png/.webp/.gif).");
        markInvalid(urlInput, "URL de imagen inválida");
      } else {
        clearInvalid(urlInput);
      }
    }

    if (imgInput && file) {
      if (!file.type.startsWith("image/")) {
        errores.push("El archivo de imagen no es válido.");
        markInvalid(imgInput, "Archivo inválido");
      } else {
        clearInvalid(imgInput);
      }
    }

    // Mensajes generales
    showGeneralErrors(form, errores);

    // Botón guardar
    const btn = getSubmitButton(form);
    if (btn) btn.disabled = errores.length > 0;

    return errores.length === 0;
  }

  // =========================
  // Init
  // =========================
  function wireEvents(root) {
    const form =
      qs(root, "form.producto-form") ||
      qs(root, "#productoForm") ||
      qs(root, "form");

    if (!form) return;

    // Validar al escribir / cambiar
    form.addEventListener("input", (e) => {
      const t = e.target;
      if (
        t.matches("#id_nombre") ||
        t.matches("#id_marca") ||
        t.matches("#id_precio") ||
        t.matches("#id_imagen_url")
      ) {
        validateProductoForm(form);
        if (t.matches("#id_imagen_url")) updatePreview(form);
      }
    });

    form.addEventListener("change", (e) => {
      const t = e.target;
      if (
        t.matches("#id_linea") ||
        t.matches("#id_presentacion") ||
        t.matches("#id_unidad_medida")
      ) {
        validateProductoForm(form);
      }

      if (t.matches("#id_imagen")) {
        // si eligió archivo, borra la URL para evitar confusión
        const urlInput = qs(form, "#id_imagen_url");
        if (urlInput && t.files?.length) urlInput.value = "";
        updatePreview(form);
        validateProductoForm(form);
      }
    });

    // Validación al enviar
    form.addEventListener("submit", (e) => {
      const ok = validateProductoForm(form);
      if (!ok) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    // Primera corrida
    updatePreview(form);
    validateProductoForm(form);
  }

  // API pública
  window.ProductoFormulario = {
    init(scope) {
      wireEvents(scope || document);
    },
    validate(scope) {
      return validateProductoForm(scope || document);
    },
    preview(scope) {
      return updatePreview(scope || document);
    }
  };

  // Auto init en páginas normales
  document.addEventListener("DOMContentLoaded", () => {
    window.ProductoFormulario.init(document);
  });

  // Auto init cuando se abre un modal (para formularios cargados por AJAX)
  document.addEventListener("shown.bs.modal", (e) => {
    window.ProductoFormulario.init(e.target);
  });
})();