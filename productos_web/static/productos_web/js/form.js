document.addEventListener('DOMContentLoaded', () => {
    /* ── Validar imagen ── */
    function pwValidarImagen(input, errEl, previewEl) {
        const TIPOS  = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const MAX_MB = 5;
        errEl.textContent = '';
        errEl.classList.remove('visible');
        if (!input.files || !input.files[0]) return true;
        const f  = input.files[0];
        if (!TIPOS.includes(f.type)) {
            errEl.textContent = 'Solo se permiten imágenes JPG, PNG, WEBP o GIF.';
            errEl.classList.add('visible');
            input.value = '';
            if (previewEl) previewEl.classList.add('d-none');
            return false;
        }
        const mb = f.size / (1024 * 1024);
        if (mb > MAX_MB) {
            errEl.textContent = `La imagen pesa ${mb.toFixed(1)} MB. El máximo permitido es 5 MB.`;
            errEl.classList.add('visible');
            input.value = '';
            if (previewEl) previewEl.classList.add('d-none');
            return false;
        }
        if (previewEl) {
            const reader = new FileReader();
            reader.onload = e => {
                previewEl.src = e.target.result;
                previewEl.classList.remove('d-none');
            };
            reader.readAsDataURL(f);
        }
        return true;
    }

    const fileInput = document.querySelector('#dropzoneEditar input[type="file"]');
    const preview   = document.getElementById('previewEditar');
    const errImagen = document.getElementById('err_img_form');
    if (fileInput && preview) {
        fileInput.addEventListener('change', function () {
            pwValidarImagen(this, errImagen, preview);
        });
    }
    document.querySelectorAll('.pw-dropzone').forEach(zone => {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', () => zone.classList.remove('dragover'));
    });

    /* ══════════════════════════════════════════════════════
       VALIDACIONES EN TIEMPO REAL — Productos Web (form)
       - Nombre:      obligatorio · 2-200 chars · solo letras y caracteres permitidos
       - Precio:      COP · mín $100 · máx $99.999.999 · entero
       - Descripción: máx 500 chars · contador
    ══════════════════════════════════════════════════════ */

    /* ── Formato COP (es-CO, pesos enteros) ── */
    const fmtCOP = val =>
        new Intl.NumberFormat('es-CO', {
            style: 'currency', currency: 'COP',
            minimumFractionDigits: 0, maximumFractionDigits: 0,
        }).format(Math.round(val));

    /* ── Helper genérico set/clear error ── */
    function pwSetError(input, errEl, msg, validClass, invalidClass, iconEl) {
        if (msg) {
            input.classList.add(invalidClass);
            input.classList.remove(validClass);
            errEl.textContent = msg;
            errEl.classList.add('visible');
            if (iconEl) {
                iconEl.classList.remove('show', 'valid', 'invalid', 'bi-check-lg', 'bi-exclamation-lg');
                iconEl.classList.add('show', 'invalid', 'bi-exclamation-lg');
            }
        } else {
            input.classList.remove(invalidClass);
            input.classList.add(validClass);
            errEl.textContent = '';
            errEl.classList.remove('visible');
            if (iconEl) {
                iconEl.classList.remove('show', 'valid', 'invalid', 'bi-check-lg', 'bi-exclamation-lg');
                iconEl.classList.add('show', 'valid', 'bi-check-lg');
            }
        }
        return !msg;
    }

    /* ── Bloquear caracteres no permitidos en nombre (tiempo real) ── */
    function bloquearCaracteresNombre(e) {
        const permitidos = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s\.\,\-\(\)]$/;
        if (e.key.length > 1) return;
        const input = e.target;
        if (input.value.length >= 200 && input.selectionStart === input.selectionEnd) {
            e.preventDefault();
            input.style.animation = 'shake 0.3s';
            setTimeout(() => { input.style.animation = ''; }, 300);
            return;
        }
        if (!permitidos.test(e.key)) {
            e.preventDefault();
            input.style.animation = 'shake 0.3s';
            setTimeout(() => { input.style.animation = ''; }, 300);
        }
    }

    /* ── Validar nombre ── */
    function pwValidarNombre(input, errEl, iconEl) {
        const v = input.value.trim();
        const REG = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s\.\,\-\(\)]+$/;
        let msg = '';
        if (!v)                msg = 'El nombre es obligatorio.';
        else if (v.length < 2)     msg = 'Mínimo 2 caracteres.';
        else if (v.length > 200)   msg = 'Máximo 200 caracteres.';
        else if (!REG.test(v))     msg = 'Solo se permiten letras, espacios y los caracteres: . , - ( )';
        return pwSetError(input, errEl, msg, 'is-valid-name', 'is-invalid-name', iconEl);
    }

    /* ── Bloquear caracteres no numéricos en precio (tiempo real) ── */
    function bloquearCaracteresPrecio(e) {
        const permitidos = /^[0-9]$/;
        if (e.key.length > 1) return;
        const input = e.target;
        if (!permitidos.test(e.key)) {
            e.preventDefault();
            input.style.animation = 'shake 0.3s';
            setTimeout(() => { input.style.animation = ''; }, 300);
            return;
        }
        const selStart = input.selectionStart;
        const selEnd   = input.selectionEnd;
        const newVal   = input.value.substring(0, selStart) + e.key + input.value.substring(selEnd);
        if (parseInt(newVal, 10) > 99999999) {
            e.preventDefault();
            input.style.animation = 'shake 0.3s';
            setTimeout(() => { input.style.animation = ''; }, 300);
        }
    }

    /* ── Validar precio COP ── */
    function pwValidarPrecio(input, errEl, previewEl, iconEl) {
        const raw  = input.value.trim();
        const val  = parseFloat(raw);
        const decs = raw.includes('.') ? raw.split('.')[1].length : 0;
        let msg = '';
        if (!raw)              msg = 'El precio es obligatorio.';
        else if (isNaN(val))   msg = 'Ingresa un número válido.';
        else if (val < 100)    msg = 'El precio mínimo es $100 COP.';
        else if (val > 99999999) msg = 'El precio máximo es $99.999.999 COP.';
        else if (decs > 0)     msg = 'El precio debe ser un valor entero (sin centavos) en pesos colombianos.';
        const ok = pwSetError(input, errEl, msg, 'is-valid-price', 'is-invalid-price', iconEl);
        if (previewEl) {
            if (!msg && raw) {
                previewEl.textContent = fmtCOP(val);
                previewEl.classList.add('visible');
            } else {
                previewEl.textContent = '';
                previewEl.classList.remove('visible');
            }
        }
        return ok;
    }

    /* ── Contador descripción ── */
    function pwContador(textarea, contEl, max) {
        const len = textarea.value.length;
        if (len > max) textarea.value = textarea.value.substring(0, max);
        contEl.textContent = `${Math.min(len, max)}/${max} caracteres`;
        contEl.className = 'pw-char-count' +
            (len >= max        ? ' at-limit'   :
             len >= max * 0.85 ? ' near-limit' : '');
    }

    /* ── Bloquear escritura cuando descripción alcanza 500 chars ── */
    function bloquearDescripcion(e) {
        if (e.key.length > 1) return;
        const ta = e.target;
        if (ta.value.length >= 500 && ta.selectionStart === ta.selectionEnd) {
            e.preventDefault();
            ta.style.animation = 'shake 0.3s';
            setTimeout(() => { ta.style.animation = ''; }, 300);
        }
    }

    /* ── Conectar: Nombre ── */
    const nombreInput  = document.getElementById('id_nombre');
    const errNombre    = document.getElementById('err_nombre_form');
    const iconNombre   = document.getElementById('icon_nombre_form');
    if (nombreInput && errNombre) {
        nombreInput.addEventListener('keydown', bloquearCaracteresNombre);
        nombreInput.addEventListener('input', () => pwValidarNombre(nombreInput, errNombre, iconNombre));
        nombreInput.addEventListener('blur',  () => pwValidarNombre(nombreInput, errNombre, iconNombre));
        nombreInput.addEventListener('paste', function (e) {
            e.preventDefault();
            const texto = (e.clipboardData || window.clipboardData).getData('text');
            const limpio = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s\.\,\-\(\)]/g, '');
            document.execCommand('insertText', false, limpio);
        });
        nombreInput.addEventListener('input', function () {
            const pos = this.selectionStart;
            const original = this.value;
            const limpio = original.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s\.\,\-\(\)]/g, '');
            if (limpio !== original) {
                this.value = limpio;
                this.setSelectionRange(Math.min(pos, limpio.length), Math.min(pos, limpio.length));
            }
        });
    }

    /* ── Conectar: Precio ── */
    const precioInput  = document.getElementById('id_precio');
    const errPrecio    = document.getElementById('err_precio_form');
    const copPreview   = document.getElementById('cop_preview_form');
    const iconPrecio   = document.getElementById('icon_precio_form');
    if (precioInput && errPrecio) {
        precioInput.addEventListener('keydown', bloquearCaracteresPrecio);
        precioInput.addEventListener('input', () => pwValidarPrecio(precioInput, errPrecio, copPreview, iconPrecio));
        precioInput.addEventListener('blur',  () => pwValidarPrecio(precioInput, errPrecio, copPreview, iconPrecio));
    }

    /* ── Conectar: Descripción (contador) ── */
    const descInput = document.getElementById('id_descripcion');
    const charDesc  = document.getElementById('char_desc_form');
    if (descInput && charDesc) {
        pwContador(descInput, charDesc, 500);
        descInput.addEventListener('keydown', bloquearDescripcion);
        descInput.addEventListener('input', () => pwContador(descInput, charDesc, 500));
    }

    /* ── Validación al enviar ── */
    const formEl = document.querySelector('form');
    if (formEl) {
        formEl.addEventListener('submit', function(e) {
            let ok = true;
            if (nombreInput && errNombre && !pwValidarNombre(nombreInput, errNombre, iconNombre)) {
                ok = false;
                nombreInput.focus();
            }
            if (precioInput && errPrecio && !pwValidarPrecio(precioInput, errPrecio, copPreview, iconPrecio)) {
                if (ok) { precioInput.focus(); ok = false; }
            }
            if (fileInput && errImagen && !pwValidarImagen(fileInput, errImagen, preview)) {
                if (ok) ok = false;
            }
            if (!ok) e.preventDefault();
        });
    }
});
