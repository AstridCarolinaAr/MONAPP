/* ── Mensajes Django como Swal toast ── */
(function () {
    const raw = document.getElementById('promo-form-messages');
    if (!raw) return;
    const msgs = JSON.parse(raw.textContent || '[]');
    const MAP = {
        success: { icon: 'success', background: '#f0fdf4', color: '#166534' },
        error:   { icon: 'error',   background: '#fef2f2', color: '#991b1b' },
        warning: { icon: 'warning', background: '#fffbeb', color: '#92400e' },
        info:    { icon: 'info',    background: '#eff6ff', color: '#1e40af' },
    };
    msgs.forEach(m => {
        const key  = Object.keys(MAP).find(k => m.tags.includes(k)) || 'info';
        const opts = MAP[key];
        Swal.mixin({
            toast: true, position: 'top-end',
            showConfirmButton: false, timer: 3500, timerProgressBar: true,
            background: opts.background, color: opts.color,
        }).fire({ icon: opts.icon, title: m.text });
    });
})();

document.addEventListener('DOMContentLoaded', () => {
    const fileInput = document.querySelector('#dropzonePromo input[type="file"]');
    const preview   = document.getElementById('previewPromo');
    if (fileInput && preview) {
        fileInput.addEventListener('change', function () {
            if (this.files && this.files[0]) {
                const reader = new FileReader();
                reader.onload = e => {
                    preview.src = e.target.result;
                    preview.classList.remove('d-none');
                };
                reader.readAsDataURL(this.files[0]);
            }
        });
    }
    document.querySelectorAll('.promo-dropzone').forEach(zone => {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', () => zone.classList.remove('dragover'));
    });

    /* ══════════════════════════════════════════════════════
       VALIDACIONES EN TIEMPO REAL — Promociones (form)
       - Nombre:      obligatorio · 2-200 chars · solo letras y espacios
       - Descripción: máx 500 chars · contador
       - Descuento:   >0 · ≤100 · solo números
    ══════════════════════════════════════════════════════ */

    /* Helper: poner/quitar error en un campo con ícono */
    function promoErr(input, errEl, msg, iconEl) {
        if (msg) {
            input.classList.add('is-invalid-promo');
            input.classList.remove('is-valid-promo');
            errEl.textContent = msg;
            errEl.classList.add('visible');
            if (iconEl) {
                iconEl.classList.remove('show', 'valid', 'invalid', 'bi-check-lg', 'bi-exclamation-lg');
                iconEl.classList.add('show', 'invalid', 'bi-exclamation-lg');
            }
        } else {
            input.classList.remove('is-invalid-promo');
            input.classList.add('is-valid-promo');
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
        const permitidos = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]$/;
        if (e.key.length > 1) return;
        if (!permitidos.test(e.key)) {
            e.preventDefault();
            const input = e.target;
            input.style.animation = 'shake 0.3s';
            setTimeout(() => { input.style.animation = ''; }, 300);
        }
    }

    /* ── Bloquear caracteres no numéricos y valores > 100 en descuento (tiempo real) ── */
    function bloquearCaracteresDescuento(e) {
        const permitidos = /^[0-9]$/;
        if (e.key.length > 1) return;
        if (!permitidos.test(e.key)) {
            e.preventDefault();
            e.target.style.animation = 'shake 0.3s';
            setTimeout(() => { e.target.style.animation = ''; }, 300);
            return;
        }
        /* Simular el valor resultante y bloquearlo si supera 100 */
        const input = e.target;
        const start = input.selectionStart;
        const end   = input.selectionEnd;
        const next  = input.value.slice(0, start) + e.key + input.value.slice(end);
        if (parseFloat(next) > 100) {
            e.preventDefault();
            input.value = '100';
            input.style.animation = 'shake 0.3s';
            setTimeout(() => { input.style.animation = ''; }, 300);
        }
    }

    /* ── Validar nombre (solo letras y espacios) ── */
    const PROMO_REG = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]+$/;
    function validarNombrePromo(input, errEl, iconEl) {
        const v = input.value.trim();
        let msg = '';
        if (!v)                    msg = 'El nombre es obligatorio.';
        else if (v.length < 2)     msg = 'Mínimo 2 caracteres.';
        else if (v.length > 200)   msg = 'Máximo 200 caracteres.';
        else if (!PROMO_REG.test(v)) msg = 'Solo se permiten letras y espacios. No se admiten números ni caracteres especiales.';
        return promoErr(input, errEl, msg, iconEl);
    }

    /* ── Validar descuento ── */
    function validarDescuentoPromo(input, errEl, iconEl) {
        const raw = input.value.trim();
        const val = parseFloat(raw);
        let msg = '';
        if (!raw)               msg = 'El descuento es obligatorio.';
        else if (isNaN(val))    msg = 'Ingresa un número válido.';
        else if (val < 1)       msg = 'El descuento mínimo es 1%.';
        else if (val > 100)     msg = 'El descuento no puede superar el 100%.';
        return promoErr(input, errEl, msg, iconEl);
    }

    /* ── Contador descripción ── */
    function promoContador(textarea, contEl, max) {
        const len = textarea.value.length;
        if (len > max) textarea.value = textarea.value.substring(0, max);
        contEl.textContent = `${Math.min(len, max)}/${max} caracteres`;
        contEl.className = 'promo-char-count' +
            (len >= max        ? ' at-limit'   :
             len >= max * 0.85 ? ' near-limit' : '');
    }

    /* ── Fecha máxima de inicio: hoy + 12 meses ── */
    function promoMaxInicio() {
        const d = new Date();
        d.setMonth(d.getMonth() + 12);
        return d.toISOString().split('T')[0];
    }
    /* Fecha máxima de fin: 31/12 del año de promoMaxInicio */
    function promoMaxFin() {
        const year = new Date(promoMaxInicio()).getFullYear();
        return `${year}-12-31`;
    }

    /* ── Validar fechas (form independiente) ── */
    function validarFechasPromoForm(inEl, finEl, errInEl, errFinEl) {
        const maxInicio = promoMaxInicio();
        const maxFin    = promoMaxFin();
        let okIn = true, okFin = true;
        if (!inEl.value) {
            promoErr(inEl, errInEl, 'La fecha de inicio es obligatoria.');
            okIn = false;
        } else if (inEl.value > maxInicio) {
            promoErr(inEl, errInEl, 'La fecha de inicio no puede ser más de 12 meses a partir de hoy.');
            okIn = false;
        } else {
            promoErr(inEl, errInEl, '');
        }
        /* Actualizar min del fin cada vez que cambia inicio */
        if (inEl.value) finEl.min = inEl.value;
        if (!finEl.value) {
            promoErr(finEl, errFinEl, 'La fecha de fin es obligatoria.');
            okFin = false;
        } else if (inEl.value && finEl.value < inEl.value) {
            promoErr(finEl, errFinEl, 'La fecha de fin debe ser igual o posterior a la de inicio.');
            okFin = false;
        } else if (finEl.value > maxFin) {
            promoErr(finEl, errFinEl, `La fecha de fin no puede superar el 31/12/${new Date(maxFin).getFullYear()}.`);
            okFin = false;
        } else if (inEl.value && finEl.value) {
            const dias = (new Date(finEl.value) - new Date(inEl.value)) / 86400000;
            if (dias > 365) {
                promoErr(finEl, errFinEl, 'La promoción no puede durar más de 365 días.');
                okFin = false;
            } else {
                promoErr(finEl, errFinEl, '');
            }
        } else {
            promoErr(finEl, errFinEl, '');
        }
        return okIn && okFin;
    }

    /* ── Conectar: Nombre ── */
    const nombreInput    = document.getElementById('id_nombre');
    const errNombre      = document.getElementById('err_nombre_promo_form');
    const iconNombre     = document.getElementById('icon_nombre_form');
    if (nombreInput && errNombre) {
        nombreInput.addEventListener('keydown', bloquearCaracteresNombre);
        nombreInput.addEventListener('input', () => validarNombrePromo(nombreInput, errNombre, iconNombre));
        nombreInput.addEventListener('blur',  () => validarNombrePromo(nombreInput, errNombre, iconNombre));
        nombreInput.addEventListener('paste', function (e) {
            e.preventDefault();
            const texto = (e.clipboardData || window.clipboardData).getData('text');
            const limpio = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]/g, '');
            document.execCommand('insertText', false, limpio);
        });
        nombreInput.addEventListener('input', function () {
            const pos = this.selectionStart;
            const original = this.value;
            const limpio = original.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]/g, '');
            if (limpio !== original) {
                this.value = limpio;
                this.setSelectionRange(Math.min(pos, limpio.length), Math.min(pos, limpio.length));
            }
        });
    }

    /* ── Conectar: Descuento ── */
    const descuentoInput = document.getElementById('id_porcentaje_descuento');
    const errDescuento   = document.getElementById('err_descuento_form');
    const iconDescuento  = document.getElementById('icon_descuento_form');
    if (descuentoInput) {
        descuentoInput.addEventListener('keydown', bloquearCaracteresDescuento);
        descuentoInput.addEventListener('input', function () {
            /* Recortar si se pegó o modificó un valor > 100 */
            const val = parseFloat(this.value);
            if (!isNaN(val) && val > 100) this.value = '100';
            validarDescuentoPromo(descuentoInput, errDescuento, iconDescuento);
        });
        descuentoInput.addEventListener('blur',  () => validarDescuentoPromo(descuentoInput, errDescuento, iconDescuento));
        descuentoInput.addEventListener('paste', function (e) {
            e.preventDefault();
            const texto = (e.clipboardData || window.clipboardData).getData('text');
            const num   = parseInt(texto.replace(/[^0-9]/g, ''), 10);
            this.value  = isNaN(num) ? '' : String(Math.min(Math.max(num, 1), 100));
            validarDescuentoPromo(descuentoInput, errDescuento, iconDescuento);
        });
    }

    /* ── Conectar: Fechas ── */
    const inicioInput = document.getElementById('id_fecha_inicio');
    const finInput    = document.getElementById('id_fecha_fin');
    const errInicio   = document.getElementById('err_inicio_form');
    const errFin      = document.getElementById('err_fin_form');
    if (inicioInput) {
        inicioInput.max = promoMaxInicio();
        inicioInput.addEventListener('change', () => validarFechasPromoForm(inicioInput, finInput, errInicio, errFin));
    }
    if (finInput) {
        finInput.max = promoMaxFin();
        finInput.addEventListener('change', () => validarFechasPromoForm(inicioInput, finInput, errInicio, errFin));
    }

    /* ── Conectar: Descripción (contador) ── */
    const descInput = document.getElementById('id_descripcion');
    const charDesc  = document.getElementById('char_desc_form');
    if (descInput && charDesc) {
        promoContador(descInput, charDesc, 500);
        descInput.addEventListener('input', () => promoContador(descInput, charDesc, 500));
    }

    /* ── Validación al enviar ── */
    const formEl = document.querySelector('form');
    if (formEl) {
        formEl.addEventListener('submit', function(e) {
            let ok = true;
            if (nombreInput && errNombre && !validarNombrePromo(nombreInput, errNombre, iconNombre)) {
                ok = false;
                nombreInput.focus();
            }
            if (descuentoInput && errDescuento && !validarDescuentoPromo(descuentoInput, errDescuento, iconDescuento)) {
                if (ok) { descuentoInput.focus(); ok = false; }
            }
            if (inicioInput && finInput && !validarFechasPromoForm(inicioInput, finInput, errInicio, errFin)) {
                if (ok) { inicioInput.focus(); ok = false; }
            }
            if (!ok) e.preventDefault();
        });
    }
});
