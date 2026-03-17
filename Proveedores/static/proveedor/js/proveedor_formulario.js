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
        if (result.data.redirect_url) {
          window.location.href = result.data.redirect_url;
        } else {
          window.location.reload();
        }
        return;
      }
      modalTitleEl.textContent = result.data.title || modalTitleEl.textContent;
      modalBodyEl.innerHTML = result.data.html || `<div class="alert alert-danger mb-0">No se pudo guardar.</div>`;
      return;
    }
    modalBodyEl.innerHTML = result.data;
  });
});

(() => {
  "use strict";

  const qs = (root, sel) => (root || document).querySelector(sel);

  // Solo el trazo del chulo — sin icono de Bootstrap, sin circulo, sin relleno
  const CHULO_SVG = `<svg width="15" height="15" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style="display:block;">
    <polyline points="2,8 6.5,13 14,3.5" stroke="#2ecc71" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;

  function ensureWrapper(input) {
    if (!input) return null;

    const existing = input.closest(".form-validated");
    if (existing) return existing;

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
    icon.innerHTML = CHULO_SVG;
    wrapper.appendChild(icon);

    return wrapper;
  }

  function clearState(input) {
    if (!input) return;
    input.classList.remove("is-valid", "is-invalid");
    const wrapper = input.closest(".form-validated");
    if (wrapper) wrapper.classList.remove("is-ok");
    const fb = getFeedbackEl(input);
    if (fb) fb.textContent = "";
  }

  function getFeedbackEl(input) {
    if (!input) return null;
    const group = input.closest(".input-group");
    if (group) {
      let fb = group.parentElement?.querySelector(":scope > .invalid-feedback");
      if (!fb) {
        fb = document.createElement("div");
        fb.className = "invalid-feedback";
        group.insertAdjacentElement("afterend", fb);
      }
      return fb;
    }
    let fb = input.parentElement?.querySelector(":scope > .invalid-feedback");
    if (!fb) {
      fb = document.createElement("div");
      fb.className = "invalid-feedback";
      input.insertAdjacentElement("afterend", fb);
    }
    return fb;
  }

  function markValid(input) {
    if (!input) return;
    const required = input.hasAttribute("required");
    const v = (input.value || "").trim();
    if (!required && !v) { clearState(input); return; }
    input.classList.remove("is-invalid");
    input.classList.add("is-valid");
    const fb = getFeedbackEl(input);
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
    const fb = getFeedbackEl(input);
    if (fb) fb.textContent = msg || "Campo inválido";
  }

  const RE_NIT = /^[0-9]{5,20}$/;
  const RE_TEL = /^[0-9+\s()-]{7,20}$/;
  const RE_DIR = /^.{5,200}$/;

  function isEmailValid(input) {
    if (!input) return true;
    if (typeof input.checkValidity === "function") return input.checkValidity();
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((input.value || "").trim());
  }

  function getSubmitButton(form) {
    return qs(form, "#btnGuardarProveedor") || qs(form, 'button[type="submit"]');
  }

  function validateProveedorForm(scope) {
    const form = scope?.tagName === "FORM"
      ? scope
      : qs(scope, "#proveedorForm") || qs(scope, "form");
    if (!form) return true;

    const errores = [];
    const nit    = qs(form, "#id_nit");
    const nombre = qs(form, "#id_nombre_proveedor");
    const tel    = qs(form, "#id_telefono_proveedor");
    const correo = qs(form, "#id_correo_proveedor");
    const dir    = qs(form, "#id_direccion_proveedor");
    const estado = qs(form, "#id_estado");

    if (nit) {
      const v = (nit.value || "").trim();
      if (!v)                   { errores.push("NIT obligatorio.");          markInvalid(nit, "NIT obligatorio"); }
      else if (!RE_NIT.test(v)) { errores.push("NIT: solo números (5-20)."); markInvalid(nit, "Solo números (5-20)"); }
      else markValid(nit);
    }
    if (nombre) {
      const v = (nombre.value || "").trim();
      if (!v)              { errores.push("Nombre obligatorio."); markInvalid(nombre, "Nombre obligatorio"); }
      else if (v.length < 3) { errores.push("Nombre muy corto.");  markInvalid(nombre, "Mínimo 3 letras"); }
      else markValid(nombre);
    }
    if (tel) {
      const v = (tel.value || "").trim();
      if (!v)                   { errores.push("Teléfono obligatorio."); markInvalid(tel, "Teléfono obligatorio"); }
      else if (!RE_TEL.test(v)) { errores.push("Teléfono inválido.");    markInvalid(tel, "Teléfono inválido"); }
      else markValid(tel);
    }
    if (correo) {
      const v = (correo.value || "").trim();
      if (!v)                      { errores.push("Correo obligatorio."); markInvalid(correo, "Correo obligatorio"); }
      else if (!isEmailValid(correo)) { errores.push("Correo inválido.");   markInvalid(correo, "Correo inválido"); }
      else markValid(correo);
    }
    if (dir) {
      const v = (dir.value || "").trim();
      if (!v)                   { errores.push("Dirección obligatoria."); markInvalid(dir, "Dirección obligatoria"); }
      else if (!RE_DIR.test(v)) { errores.push("Dirección muy corta.");   markInvalid(dir, "Mínimo 5 caracteres"); }
      else markValid(dir);
    }
    if (estado) {
      const v = (estado.value || "").trim();
      if (!v) { errores.push("Selecciona un estado."); markInvalid(estado, "Obligatorio"); }
      else markValid(estado);
    }

    const btn = getSubmitButton(form);
    if (btn) btn.disabled = errores.length > 0;
    return errores.length === 0;
  }

  function wire(scope) {
    const root = scope || document;
    const form = qs(root, "#proveedorForm") || qs(root, "form");
    if (!form) return;
    if (form.dataset.wiredProveedor === "1") return;
    form.dataset.wiredProveedor = "1";

    ["#id_nit", "#id_nombre_proveedor", "#id_telefono_proveedor",
     "#id_correo_proveedor", "#id_direccion_proveedor", "#id_estado"]
      .forEach((sel) => { const el = qs(form, sel); if (el) ensureWrapper(el); });

    form.addEventListener("input", (e) => {
      if (e.target.matches("#id_nit, #id_nombre_proveedor, #id_telefono_proveedor, #id_correo_proveedor, #id_direccion_proveedor")) {
        validateProveedorForm(form);
      }
    });
    form.addEventListener("change", (e) => {
      if (e.target.matches("#id_estado")) validateProveedorForm(form);
    });
    form.addEventListener("submit", (e) => {
      if (!validateProveedorForm(form)) { e.preventDefault(); e.stopPropagation(); }
    });

    validateProveedorForm(form);
  }

  window.ProveedorFormulario = {
    init(scope)     { wire(scope || document); },
    validate(scope) { return validateProveedorForm(scope || document); },
  };

  document.addEventListener("DOMContentLoaded", () => wire(document));
  document.addEventListener("shown.bs.modal", (e) => wire(e.target));
})();