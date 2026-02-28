(() => {
  // =========================
  // Helpers DOM
  // =========================
  const qs = (root, sel) => (root || document).querySelector(sel);

  // =========================
  // Modal AJAX genérico
  // =========================
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
        modalBodyEl.innerHTML =
          result.data.html || `<div class="alert alert-danger">No se pudo cargar.</div>`;
        return;
      }

      modalBodyEl.innerHTML = result.data;
      ProductoFormulario.init(modalEl);
    }

    document.addEventListener("click", (e) => {
      const trigger = e.target.closest("[data-modal-url]");
      if (!trigger) return;
      e.preventDefault();

      openModal(
        trigger.getAttribute("data-modal-url"),
        trigger.getAttribute("data-modal-title") || "Formulario"
      );
    });

    document.addEventListener("submit", async (e) => {
      const form = e.target.closest("#ajaxFormModal form");
      if (!form) return;

      e.preventDefault();

      const ok = ProductoFormulario.validate(form);
      if (!ok) return;

      const url = form.action;
      const formData = new FormData(form);
      const csrf = form.querySelector('input[name="csrfmiddlewaretoken"]')?.value || "";

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
        modalBodyEl.innerHTML =
          result.data.html || `<div class="alert alert-danger mb-0">No se pudo guardar.</div>`;

        ProductoFormulario.init(modalEl);
        return;
      }

      modalBodyEl.innerHTML = result.data;
      ProductoFormulario.init(modalEl);
    });
  });

  // =========================
  // UI: check verde dentro del input
  // =========================
  function ensureWrapper(input) {
    if (!input) return null;
    if (input.closest(".form-validated")) return input.closest(".form-validated");

    const inputGroup = input.closest(".input-group");
    const target = inputGroup || input;

    const parent = target.parentElement;
    if (!parent) return null;

    const wrapper = document.createElement("div");
    wrapper.className = "form-validated";

    parent.insertBefore(wrapper, target);
    wrapper.appendChild(target);

    const icon = document.createElement("span");
    icon.className = "valid-check";
    icon.innerHTML = `<i class="bi bi-check-circle-fill text-success"></i>`;
    wrapper.appendChild(icon);

    return wrapper;
  }

  function markValid(input) {
    if (!input) return;

    const isRequired = input.hasAttribute("required");
    const val = (input.value || "").trim();
    if (!isRequired && !val) {
      clearState(input);
      return;
    }

    input.classList.remove("is-invalid");
    input.classList.add("is-valid");

    const fb = input.parentElement?.querySelector(".invalid-feedback");
    if (fb) fb.textContent = "";

    const wrapper = ensureWrapper(input);
    if (wrapper) wrapper.classList.add("is-ok");
  }

  function markInvalid(input, msg) {
    if (!input) return;

    input.classList.remove("is-valid");
    input.classList.add("is-invalid");

    const wrapper = input.closest(".form-validated");
    if (wrapper) wrapper.classList.remove("is-ok");

    let fb = input.parentElement?.querySelector(".invalid-feedback");
    if (!fb) {
      fb = document.createElement("div");
      fb.className = "invalid-feedback";
      input.insertAdjacentElement("afterend", fb);
    }
    fb.textContent = msg || "Campo inválido";
  }

  function clearState(input) {
    if (!input) return;
    input.classList.remove("is-valid", "is-invalid");
    const wrapper = input.closest(".form-validated");
    if (wrapper) wrapper.classList.remove("is-ok");
    const fb = input.parentElement?.querySelector(".invalid-feedback");
    if (fb) fb.textContent = "";
  }

  // =========================
  // Preview imagen (file, url, o imagen inicial)
  // =========================
  function isValidUrl(url) {
    try {
      const u = new URL(url);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function isImageUrl(url) {
    return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(url.split("?")[0]);
  }

  function updatePreview(form) {
    const imgInput = qs(form, "#id_imagen");
    const urlInput = qs(form, "#id_imagen_url");
    const imgEl = qs(form, "#previewProductoImagen");
    const msgEl = qs(form, "#previewProductoImagenMsg");
    const emptyEl = qs(form, "#previewEmpty");
    const dzFilename = qs(form, "#dzFilename");
    const removeBtn = qs(form, "#imgPreviewRemove");

    if (!imgEl) return;

    const file = imgInput?.files?.[0];
    const url = (urlInput?.value || "").trim();
    const initialSrc = (imgEl.dataset.initialSrc || "").trim(); // ✅ FIX
    const clearCheckbox = qs(form, "#id_imagen-clear");
    const isCleared = clearCheckbox ? clearCheckbox.checked : false;

    // reset
    imgEl.style.display = "none";
    imgEl.removeAttribute("src");
    if (msgEl) msgEl.textContent = "";
    if (emptyEl) emptyEl.style.display = "block";
    if (dzFilename) dzFilename.textContent = "Ningún archivo seleccionado";
    if (removeBtn) removeBtn.classList.add("d-none");

    // 1) Archivo
    if (file) {
      if (!file.type.startsWith("image/")) {
        if (msgEl) msgEl.textContent = "El archivo seleccionado no es una imagen.";
        return;
      }

      if (clearCheckbox) clearCheckbox.checked = false;

      const blobUrl = URL.createObjectURL(file);
      imgEl.src = blobUrl;
      imgEl.style.display = "block";
      if (emptyEl) emptyEl.style.display = "none";
      if (dzFilename) dzFilename.textContent = file.name;
      if (msgEl) msgEl.textContent = file.name;
      if (removeBtn) removeBtn.classList.remove("d-none");

      imgEl.onload = () => URL.revokeObjectURL(blobUrl);
      return;
    }

    // 2) URL
    if (url) {
      if (!isValidUrl(url) || !isImageUrl(url)) {
        // No rompemos preview si URL es inválida; solo dejamos vacío
        if (msgEl) msgEl.textContent = "URL inválida o no parece imagen.";
        return;
      }

      imgEl.src = url;
      imgEl.style.display = "block";
      if (emptyEl) emptyEl.style.display = "none";
      if (msgEl) msgEl.textContent = "Vista previa desde URL";
      if (removeBtn) removeBtn.classList.remove("d-none");
      return;
    }

    // 3) Imagen inicial (editar)
    if (initialSrc && !isCleared) {
      imgEl.src = initialSrc;
      imgEl.style.display = "block";
      if (emptyEl) emptyEl.style.display = "none";
      if (msgEl) msgEl.textContent = "Imagen actual";
      if (removeBtn) removeBtn.classList.remove("d-none");
      return;
    }
  }

  // =========================
  // Validación del formulario Producto
  // =========================
  function showGeneralErrors(form, messages = []) {
    const box = qs(form, "#productoErroresGenerales");
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
        ${messages.map((m) => `<li>${m}</li>`).join("")}
      </ul>
    `;
  }

  const RE_SOLO_LETRAS = /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ\s]+$/;
  const RE_SOLO_NUMEROS = /^\d+$/;

  function validateProductoForm(scope) {
    const form =
      scope?.tagName === "FORM"
        ? scope
        : qs(scope, "form.producto-form") || qs(scope, "#productoForm") || qs(scope, "form");

    if (!form) return true;

    const errores = [];

    const marca = qs(form, "#id_marca");
    const nombre = qs(form, "#id_nombre");
    const precio = qs(form, "#id_precio");
    const unidad = qs(form, "#id_unidad_medida");
    const linea = qs(form, "#id_linea");
    const presentacion = qs(form, "#id_presentacion");

    const imgInput = qs(form, "#id_imagen");
    const urlInput = qs(form, "#id_imagen_url");

    if (nombre) {
      const v = (nombre.value || "").trim();
      if (!v) {
        errores.push("El nombre del producto es obligatorio.");
        markInvalid(nombre, "Nombre obligatorio");
      } else markValid(nombre);
    }

    if (marca) {
      const v = (marca.value || "").trim();
      if (!v) {
        errores.push("La marca es obligatoria.");
        markInvalid(marca, "Marca obligatoria");
      } else markValid(marca);
    }

    if (precio) {
      const raw = String(precio.value || "").replace(/\./g, "").replace(",", ".");
      const n = parseFloat(raw);
      if (!Number.isFinite(n) || n <= 0) {
        errores.push("El precio debe ser mayor que 0.");
        markInvalid(precio, "Mayor que 0");
      } else markValid(precio);
    }

    if (unidad && unidad.hasAttribute("required")) {
      if (!unidad.value) {
        errores.push("La unidad de medida es obligatoria.");
        markInvalid(unidad, "Obligatoria");
      } else markValid(unidad);
    } else if (unidad) {
      const v = (unidad.value || "").trim();
      if (v) markValid(unidad);
      else clearState(unidad);
    }

    if (linea) {
      const v = (linea.value || "").trim();
      if (v && !RE_SOLO_LETRAS.test(v)) {
        errores.push("La línea solo debe contener letras.");
        markInvalid(linea, "Solo letras");
      } else if (v) markValid(linea);
      else clearState(linea);
    }

    if (presentacion) {
      const v = (presentacion.value || "").trim();
      if (v && !RE_SOLO_NUMEROS.test(v)) {
        errores.push("La presentación solo debe contener numeros.");
        markInvalid(presentacion, "Solo numeros");
      } else if (v) markValid(presentacion);
      else clearState(presentacion);
    }

    if (urlInput) {
      const url = (urlInput.value || "").trim();
      if (url && (!isValidUrl(url) || !isImageUrl(url))) {
        errores.push("La URL de imagen no parece válida (http/https y termina en .jpg/.png/.webp/.gif).");
        markInvalid(urlInput, "URL inválida");
      } else if (url) markValid(urlInput);
      else clearState(urlInput);
    }

    if (imgInput?.files?.length) {
      const file = imgInput.files[0];
      if (!file.type.startsWith("image/")) {
        errores.push("El archivo seleccionado no es una imagen.");
        markInvalid(imgInput, "Archivo inválido");
      } else markValid(imgInput);
    } else if (imgInput) {
      clearState(imgInput);
    }

    showGeneralErrors(form, errores);

    const btn = qs(form, "#btnGuardarProducto") || qs(form, 'button[type="submit"]');
    if (btn) btn.disabled = errores.length > 0;

    return errores.length === 0;
  }

  function wireEvents(scope) {
    const root = scope || document;
    const form =
      qs(root, "form.producto-form") || qs(root, "#productoForm") || qs(root, "form");
    if (!form) return;

    // ✅ Evitar listeners duplicados al reabrir modal
    if (form.dataset.wired === "1") {
      updatePreview(form);
      validateProductoForm(form);
      return;
    }
    form.dataset.wired = "1";

    ["#id_nombre", "#id_marca", "#id_precio", "#id_unidad_medida", "#id_imagen_url", "#id_imagen", "#id_linea", "#id_presentacion"].forEach((sel) => {
      const el = qs(form, sel);
      if (el) ensureWrapper(el);
    });

    // ✅ botón X (quitar imagen)
    const removeBtn = qs(form, "#imgPreviewRemove");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        const imgEl = qs(form, "#previewProductoImagen");
        const imgInput = qs(form, "#id_imagen");
        const urlInput = qs(form, "#id_imagen_url");
        const clearCheckbox = qs(form, "#id_imagen-clear");

        if (imgInput) imgInput.value = "";
        if (urlInput) urlInput.value = "";
        if (clearCheckbox) clearCheckbox.checked = true;

        // ocultar imagen inicial en UI
        if (imgEl) imgEl.dataset.initialSrc = "";

        updatePreview(form);
        validateProductoForm(form);
      });
    }

    form.addEventListener("input", (e) => {
      const t = e.target;
      if (
        t.matches("#id_nombre") ||
        t.matches("#id_marca") ||
        t.matches("#id_precio") ||
        t.matches("#id_linea") ||
        t.matches("#id_presentacion") ||
        t.matches("#id_imagen_url")
      ) {
        validateProductoForm(form);
        if (t.matches("#id_imagen_url")) updatePreview(form);
      }
    });

    form.addEventListener("change", (e) => {
      const t = e.target;

      if (t.matches("#id_unidad_medida")) {
        validateProductoForm(form);
      }

      if (t.matches("#id_imagen")) {
        const urlInput = qs(form, "#id_imagen_url");
        const clearCheckbox = qs(form, "#id_imagen-clear");

        if (urlInput && t.files?.length) urlInput.value = "";
        if (clearCheckbox && t.files?.length) clearCheckbox.checked = false;

        updatePreview(form);
        validateProductoForm(form);
      }
    });

    updatePreview(form);
    validateProductoForm(form);
  }

  window.ProductoFormulario = {
    init(scope) {
      wireEvents(scope || document);
    },
    validate(scope) {
      return validateProductoForm(scope || document);
    },
  };

  document.addEventListener("DOMContentLoaded", () => ProductoFormulario.init(document));
  document.addEventListener("shown.bs.modal", (e) => ProductoFormulario.init(e.target));
})();