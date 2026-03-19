(() => {
  "use strict";

  const qs = (root, sel) => (root || document).querySelector(sel);

  const RE_NIT = /^[0-9]{5,20}$/;
  const RE_TEL = /^[0-9+\s()-]{7,20}$/;
  const RE_DIR = /^.{5,200}$/;

  const FIELD_SELECTORS = [
    "#id_nit",
    "#id_nombre_proveedor",
    "#id_telefono_proveedor",
    "#id_correo_proveedor",
    "#id_direccion_proveedor",
    "#id_estado",
  ];

  function getForm(scope) {
    if (!scope) return document.getElementById("proveedorForm");
    if (scope.tagName === "FORM") return scope;
    return qs(scope, "#proveedorForm") || qs(scope, "form");
  }

  function getWrap(input) {
    return input?.closest(".proveedor-input-wrap") || null;
  }

  function getFeedbackEl(input) {
    const wrap = getWrap(input);
    if (!wrap) return null;

    let fb = wrap.parentElement?.querySelector(":scope > .proveedor-field-error");
    if (!fb) {
      fb = document.createElement("div");
      fb.className = "proveedor-field-error";
      wrap.insertAdjacentElement("afterend", fb);
    }
    return fb;
  }

  function clearState(input) {
    if (!input) return;

    input.classList.remove("is-valid", "is-invalid");

    const wrap = getWrap(input);
    if (wrap) {
      wrap.classList.remove("is-ok", "is-error", "has-error");
    }

    const fb = getFeedbackEl(input);
    if (fb) {
      fb.textContent = "";
      fb.classList.remove("is-visible");
    }
  }

  function markValid(input) {
    if (!input) return;

    clearState(input);
    input.classList.add("is-valid");

    const wrap = getWrap(input);
    if (wrap) {
      wrap.classList.add("is-ok");
    }
  }

  function markInvalid(input, message) {
    if (!input) return;

    clearState(input);
    input.classList.add("is-invalid");

    const wrap = getWrap(input);
    if (wrap) {
      wrap.classList.add("is-error");
    }

    const fb = getFeedbackEl(input);
    if (fb) {
      fb.textContent = message || "Campo inválido";
      fb.classList.add("is-visible");
    }
  }

  function isEmailValid(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  function validateField(input) {
    if (!input) return true;

    const value = (input.value || "").trim();
    let message = "";

    switch (input.id) {
      case "id_nit":
        if (!value) message = "NIT obligatorio";
        else if (!RE_NIT.test(value)) message = "Solo números de 5 a 20";
        break;

      case "id_nombre_proveedor":
        if (!value) message = "Nombre obligatorio";
        else if (value.length < 3) message = "Mínimo 3 letras";
        break;

      case "id_telefono_proveedor":
        if (!value) message = "Teléfono obligatorio";
        else if (!RE_TEL.test(value)) message = "Teléfono inválido";
        break;

      case "id_correo_proveedor":
        if (!value) message = "Correo obligatorio";
        else if (!isEmailValid(value)) message = "Correo inválido";
        break;

      case "id_direccion_proveedor":
        if (!value) message = "Dirección obligatoria";
        else if (!RE_DIR.test(value)) message = "Mínimo 5 caracteres";
        break;

      case "id_estado":
        if (!value) message = "Selecciona un estado";
        break;

      default:
        if (input.hasAttribute("required") && !value) {
          message = "Campo obligatorio";
        }
    }

    if (message) {
      markInvalid(input, message);
      return false;
    }

    markValid(input);
    return true;
  }

  function getSubmitButton(form) {
    return qs(form, "#btnGuardarProveedor") || qs(form, 'button[type="submit"]');
  }

  function validateProveedorForm(scope) {
    const form = getForm(scope);
    if (!form) return true;

    let isValid = true;

    FIELD_SELECTORS.forEach((selector) => {
      const field = qs(form, selector);
      if (field && !validateField(field)) {
        isValid = false;
      }
    });

    const btn = getSubmitButton(form);
    if (btn) btn.disabled = !isValid;

    return isValid;
  }

  function wire(scope) {
    const form = getForm(scope);
    if (!form) return;

    if (form.dataset.wiredProveedor === "1") {
      validateProveedorForm(form);
      return;
    }

    form.dataset.wiredProveedor = "1";

    FIELD_SELECTORS.forEach((selector) => {
      const field = qs(form, selector);
      if (!field) return;

      field.addEventListener("input", () => validateProveedorForm(form));
      field.addEventListener("change", () => validateProveedorForm(form));
      field.addEventListener("blur", () => validateProveedorForm(form));
    });

    form.addEventListener("submit", (e) => {
      if (!validateProveedorForm(form)) {
        e.preventDefault();
        e.stopPropagation();
      }
    });

    validateProveedorForm(form);
  }

  window.ProveedorFormulario = {
    init(scope) {
      wire(scope || document);
    },
    validate(scope) {
      return validateProveedorForm(scope || document);
    }
  };

  document.addEventListener("DOMContentLoaded", () => {
    wire(document);
  });

  document.addEventListener("shown.bs.modal", (e) => {
    wire(e.target);
  });
})();