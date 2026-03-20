/* ── Mensajes Django como Swal toast ── */
const PROMO_MESSAGES = window.PROMO_MESSAGES || [];

const PROMO_TAGS_MAP = {
    'success': { icon: 'success', background: '#f0fdf4', color: '#166534' },
    'error':   { icon: 'error',   background: '#fef2f2', color: '#991b1b' },
    'warning': { icon: 'warning', background: '#fffbeb', color: '#92400e' },
    'info':    { icon: 'info',    background: '#eff6ff', color: '#1e40af' },
};

if (PROMO_MESSAGES.length) {
    PROMO_MESSAGES.forEach(m => {
        if (m.tags.includes('created')) {
            /* Popup centrado al crear */
            Swal.fire({
                icon: 'success',
                title: '¡Promoción creada!',
                text: m.text,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#3a2a24',
                background: '#fff',
                color: '#3a2a24',
                customClass: { popup: 'rounded-4' },
            });
        } else {
            const tag  = Object.keys(PROMO_TAGS_MAP).find(k => m.tags.includes(k)) || 'info';
            const opts = PROMO_TAGS_MAP[tag];
            Swal.mixin({
                toast: true,
                position: 'top-end',
                showConfirmButton: false,
                timer: 3500,
                timerProgressBar: true,
                background: opts.background,
                color: opts.color,
            }).fire({ icon: opts.icon, title: m.text });
        }
    });
}

document.addEventListener('DOMContentLoaded', () => {

    const CSRF = () => document.querySelector('[name=csrfmiddlewaretoken]').value;

    /* ── Toggle estado con confirmación Swal ── */
    document.querySelectorAll('.promo-switch input[type="checkbox"]').forEach(toggle => {
        toggle.addEventListener('change', function () {
            const url    = this.dataset.toggleUrl;
            const nombre = this.dataset.nombre;
            const actNow = this.checked;
            const el     = this;

            Swal.fire({
                title: actNow ? '¿Activar promoción?' : '¿Desactivar promoción?',
                text:  `"${nombre}" ${actNow ? 'estará activa en el catálogo.' : 'se desactivará del catálogo.'}`,
                icon:  actNow ? 'question' : 'warning',
                showCancelButton:   true,
                confirmButtonColor: '#3a2a24',
                cancelButtonColor:  '#6c757d',
                confirmButtonText:  actNow ? 'Sí, activar' : 'Sí, desactivar',
                cancelButtonText:   'Cancelar',
            }).then(result => {
                if (!result.isConfirmed) {
                    el.checked = !actNow;
                    return;
                }
                fetch(url, {
                    method: 'POST',
                    headers: {
                        'X-CSRFToken': CSRF(),
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                })
                .then(r => r.json())
                .then(data => {
                    if (!data.ok) {
                        el.checked = !actNow;
                        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar el estado.', timer: 2500, showConfirmButton: false });
                        return;
                    }
                    Swal.mixin({
                        toast: true, position: 'top-end',
                        showConfirmButton: false, timer: 2000, timerProgressBar: true,
                        background: '#f0fdf4', color: '#166534',
                    }).fire({ icon: 'success', title: actNow ? 'Promoción activada' : 'Promoción desactivada' });
                })
                .catch(() => {
                    el.checked = !actNow;
                    Swal.fire({ icon: 'error', title: 'Error de red', timer: 2500, showConfirmButton: false });
                });
            });
        });
    });

    /* ── Eliminar promoción con confirmación Swal ── */
    document.querySelectorAll('.btn-eliminar-promo').forEach(btn => {
        btn.addEventListener('click', function () {
            const nombre = this.dataset.nombre;
            const url    = this.dataset.url;

            Swal.fire({
                title: '¿Eliminar promoción?',
                html:  `¿Seguro que deseas eliminar <strong>${nombre}</strong>? Esta acción no se puede deshacer.`,
                icon:  'warning',
                showCancelButton:    true,
                confirmButtonColor:  '#dc3545',
                cancelButtonColor:   '#6c757d',
                confirmButtonText:   '<i class="bi bi-trash3"></i> Eliminar',
                cancelButtonText:    'Cancelar',
                reverseButtons:      true,
            }).then(result => {
                if (result.isConfirmed) {
                    const form = document.getElementById('formEliminarPromo');
                    form.action = url;
                    form.submit();
                }
            });
        });
    });

    /* ── Modal Editar: rellenar datos ── */
    const modalEditar = document.getElementById('modalEditar');
    if (modalEditar) {
        modalEditar.addEventListener('show.bs.modal', function (e) {
            const btn = e.relatedTarget;
            // Set form action
            document.getElementById('formEditar').action = btn.dataset.editUrl;
            // Fill fields
            document.getElementById('edit_nombre').value    = btn.dataset.nombre;
            document.getElementById('edit_etiqueta').value  = btn.dataset.etiqueta;
            document.getElementById('edit_descripcion').value = btn.dataset.descripcion;
            document.getElementById('edit_descuento').value = btn.dataset.descuento;
            document.getElementById('edit_inicio').value    = btn.dataset.inicio;
            document.getElementById('edit_fin').value       = btn.dataset.fin;
            document.getElementById('edit_activa').checked  = btn.dataset.activa === 'true';
            // Reset image input and preview
            document.getElementById('edit_imagen').value = '';
            document.getElementById('edit_imagen_clear').checked = false;
            const preview = document.getElementById('previewPromoEdit');
            const imgActual = document.getElementById('edit_imagen_actual');
            const imgLink   = document.getElementById('edit_imagen_link');
            const imgUrl = btn.dataset.imagenUrl;
            if (imgUrl) {
                preview.src = imgUrl;
                preview.classList.remove('d-none');
                imgActual.style.display = 'flex';
                imgLink.href = imgUrl;
                imgLink.textContent = imgUrl.split('/').pop();
            } else {
                preview.src = '';
                preview.classList.add('d-none');
                imgActual.style.display = 'none';
            }
        });

        // Preview new image selection in edit modal
        const editFileInput = document.getElementById('edit_imagen');
        const editPreview   = document.getElementById('previewPromoEdit');
        if (editFileInput && editPreview) {
            editFileInput.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    const reader = new FileReader();
                    reader.onload = ev => {
                        editPreview.src = ev.target.result;
                        editPreview.classList.remove('d-none');
                    };
                    reader.readAsDataURL(this.files[0]);
                }
            });
        }
    }

    /* ══════════════════════════════════════════════════════
       VALIDACIONES EN TIEMPO REAL — Promociones
       - Nombre:      obligatorio · 2-200 chars · solo chars válidos
       - Descripción: máx 500 chars · contador
       - Descuento:   >0 · ≤100 · 2 decimales máx
       - Fechas:      ambas obligatorias · fin ≥ inicio · máx 365 días
       - Imagen:      JPG/PNG/WEBP/GIF · máx 5 MB · preview
    ══════════════════════════════════════════════════════ */

    /* Helper: poner/quitar error en un campo */
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

    /* Nombre */
    const PROMO_REG = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]+$/;
    function promoNombre(input, errEl, iconEl) {
        const v = input.value.trim();
        let msg = '';
        if (!v)                  msg = 'El nombre es obligatorio.';
        else if (v.length < 2)       msg = 'Mínimo 2 caracteres.';
        else if (v.length > 200)     msg = 'Máximo 200 caracteres.';
        else if (!PROMO_REG.test(v)) msg = 'Solo se permiten letras y espacios. No se admiten números ni caracteres especiales.';
        return promoErr(input, errEl, msg, iconEl);
    }

    /* Descripción contador */
    function promoCtr(textarea, contEl, max) {
        const len = textarea.value.length;
        if (len > max) textarea.value = textarea.value.substring(0, max);
        contEl.textContent = `${Math.min(len, max)}/${max} caracteres`;
        contEl.className = 'promo-char-count' +
            (len >= max        ? ' at-limit'   :
             len >= max * 0.85 ? ' near-limit' : '');
    }

    /* Descuento */
    function promoDescuento(input, errEl, iconEl) {
        const raw  = input.value.trim();
        const val  = parseFloat(raw);
        const decs = raw.includes('.') ? raw.split('.')[1].length : 0;
        let msg = '';
        if (!raw)             msg = 'El descuento es obligatorio.';
        else if (isNaN(val))  msg = 'Ingresa un número válido.';
        else if (val <= 0)    msg = 'El descuento debe ser mayor a 0%.';
        else if (val > 100)   msg = 'El descuento no puede superar el 100%.';
        else if (decs > 2)    msg = 'Máximo 2 decimales permitidos.';
        return promoErr(input, errEl, msg, iconEl);
    }

    /* Fecha máxima permitida para inicio: hoy + 12 meses */
    function promoMaxInicio() {
        const d = new Date();
        d.setMonth(d.getMonth() + 12);
        return d.toISOString().split('T')[0];
    }
    /* Fecha máxima permitida para fin: 31/12 del año de promoMaxInicio */
    function promoMaxFin() {
        const year = new Date(promoMaxInicio()).getFullYear();
        return `${year}-12-31`;
    }

    /* Fechas: inicio + fin + rango */
    function promoFechas(inEl, finEl, errInEl, errFinEl) {
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

    /* Imagen */
    function promoImagen(input, errEl, previewEl) {
        const TIPOS = ['image/jpeg','image/png','image/webp','image/gif'];
        errEl.textContent = ''; errEl.classList.remove('visible');
        if (!input.files || !input.files[0]) return true;
        const f  = input.files[0];
        const mb = f.size / (1024 * 1024);
        if (!TIPOS.includes(f.type)) {
            promoErr(input, errEl, 'Solo se permiten imágenes JPG, PNG, WEBP o GIF.');
            input.value = '';
            if (previewEl) previewEl.classList.add('d-none');
            return false;
        }
        if (mb > 5) {
            promoErr(input, errEl, `La imagen pesa ${mb.toFixed(1)} MB. Máximo 5 MB.`);
            input.value = '';
            if (previewEl) previewEl.classList.add('d-none');
            return false;
        }
        promoErr(input, errEl, '');
        if (previewEl) {
            const reader = new FileReader();
            reader.onload = e => { previewEl.src = e.target.result; previewEl.classList.remove('d-none'); };
            reader.readAsDataURL(f);
        }
        return true;
    }

    /* ── Bloquear descuento fuera de 1-100 (keydown + paste) ── */
    function promoBloquearDescuento(e) {
        if (e.key.length > 1) return;            // teclas especiales: ok
        const permitidos = /^[0-9]$/;
        const input = e.target;
        if (!permitidos.test(e.key)) {
            e.preventDefault();
            input.style.animation = 'shake 0.3s';
            setTimeout(() => { input.style.animation = ''; }, 300);
            return;
        }
        // Simular el valor resultante y bloquearlo si supera 100
        const selStart = input.selectionStart;
        const selEnd   = input.selectionEnd;
        const newVal   = input.value.substring(0, selStart) + e.key + input.value.substring(selEnd);
        if (parseInt(newVal, 10) > 100) {
            e.preventDefault();
            input.style.animation = 'shake 0.3s';
            setTimeout(() => { input.style.animation = ''; }, 300);
        }
    }
    function promoBloquearDescuentoPaste(e, input) {
        e.preventDefault();
        const texto = (e.clipboardData || window.clipboardData).getData('text');
        const num   = parseInt(texto.replace(/[^0-9]/g, ''), 10);
        if (!isNaN(num)) input.value = String(Math.min(Math.max(num, 1), 100));
        input.dispatchEvent(new Event('input'));
    }

    /* Establecer max en inputs de fecha al cargar */
    (function () {
        const maxI = promoMaxInicio();
        const maxF = promoMaxFin();
        ['id_fecha_inicio', 'edit_inicio'].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.max = maxI;
        });
        ['id_fecha_fin', 'edit_fin'].forEach(function (id) {
            const el = document.getElementById(id);
            if (el) el.max = maxF;
        });
    })();

    /* ---- REFERENCIAS MODAL AGREGAR ---- */
    const ag = {
        nombre:     document.querySelector('#modalAgregar [name="nombre"]'),
        errN:       document.getElementById('err_nombre_ag'),
        iconNombre: document.getElementById('icon_nombre_agregar'),
        desc:       document.querySelector('#modalAgregar [name="descripcion"]'),
        ctrDesc:    document.getElementById('char_desc_ag'),
        pct:        document.querySelector('#modalAgregar [name="porcentaje_descuento"]'),
        errD:       document.getElementById('err_desc_ag'),
        iconDesc:   document.getElementById('icon_descuento_agregar'),
        inicio:     document.querySelector('#modalAgregar [name="fecha_inicio"]'),
        errI:       document.getElementById('err_inicio_ag'),
        fin:        document.querySelector('#modalAgregar [name="fecha_fin"]'),
        errF:       document.getElementById('err_fin_ag'),
        img:        document.querySelector('#dropzonePromoModal input[type="file"]'),
        errImg:     document.getElementById('err_img_ag'),
        prevImg:    document.getElementById('previewPromoModal'),
        btn:        document.getElementById('btnGuardarAg'),
    };

    if (ag.nombre)  { ag.nombre.addEventListener('input', () => promoNombre(ag.nombre, ag.errN, ag.iconNombre));   ag.nombre.addEventListener('blur', () => promoNombre(ag.nombre, ag.errN, ag.iconNombre)); }
    if (ag.desc)      ag.desc.addEventListener('input', () => promoCtr(ag.desc, ag.ctrDesc, 500));
    if (ag.pct) {
        ag.pct.addEventListener('keydown', promoBloquearDescuento);
        ag.pct.addEventListener('paste',   e => promoBloquearDescuentoPaste(e, ag.pct));
        ag.pct.addEventListener('input',   () => promoDescuento(ag.pct, ag.errD, ag.iconDesc));
        ag.pct.addEventListener('blur',    () => promoDescuento(ag.pct, ag.errD, ag.iconDesc));
    }
    if (ag.inicio && ag.fin) {
        const chkAg = () => promoFechas(ag.inicio, ag.fin, ag.errI, ag.errF);
        ag.inicio.addEventListener('change', chkAg);
        ag.fin.addEventListener('change', chkAg);
    }
    if (ag.img) ag.img.addEventListener('change', () => promoImagen(ag.img, ag.errImg, ag.prevImg));

    const formAg = document.querySelector('#modalAgregar form');
    if (formAg) {
        formAg.addEventListener('submit', function(e) {
            const ok1 = ag.nombre ? promoNombre(ag.nombre, ag.errN, ag.iconNombre)                          : true;
            const ok2 = ag.pct    ? promoDescuento(ag.pct, ag.errD, ag.iconDesc)                           : true;
            const ok3 = (ag.inicio && ag.fin) ? promoFechas(ag.inicio, ag.fin, ag.errI, ag.errF)            : true;
            const ok4 = ag.img    ? promoImagen(ag.img, ag.errImg, ag.prevImg)                              : true;
            if (!ok1 || !ok2 || !ok3 || !ok4) {
                e.preventDefault();
                if (!ok1) ag.nombre.focus();
                else if (!ok2) ag.pct.focus();
                else if (!ok3) ag.inicio.focus();
            }
        });
    }

    const modalAgregarEl = document.getElementById('modalAgregar');
    if (modalAgregarEl) {
        modalAgregarEl.addEventListener('show.bs.modal', () => {
            [ag.nombre, ag.desc, ag.pct, ag.inicio, ag.fin].forEach(el => {
                if (el) el.classList.remove('is-invalid-promo', 'is-valid-promo');
            });
            ['err_nombre_ag','err_desc_ag','err_inicio_ag','err_fin_ag','err_img_ag'].forEach(id => {
                const el = document.getElementById(id); if (el) { el.textContent = ''; el.classList.remove('visible'); }
            });
            if (ag.ctrDesc) ag.ctrDesc.textContent = '';
            if (ag.prevImg) ag.prevImg.classList.add('d-none');
            if (ag.btn) ag.btn.disabled = false;
        });
    }

    /* ---- REFERENCIAS MODAL EDITAR ---- */
    const ed = {
        nombre:     document.getElementById('edit_nombre'),
        errN:       document.getElementById('err_nombre_ed'),
        iconNombre: document.getElementById('icon_nombre_editar'),
        desc:       document.getElementById('edit_descripcion'),
        ctrDesc:    document.getElementById('char_desc_ed'),
        pct:        document.getElementById('edit_descuento'),
        errD:       document.getElementById('err_desc_ed'),
        iconDesc:   document.getElementById('icon_descuento_editar'),
        inicio:     document.getElementById('edit_inicio'),
        errI:       document.getElementById('err_inicio_ed'),
        fin:        document.getElementById('edit_fin'),
        errF:       document.getElementById('err_fin_ed'),
        img:        document.getElementById('edit_imagen'),
        errImg:     document.getElementById('err_img_ed'),
        prevImg:    document.getElementById('previewPromoEdit'),
        btn:        document.getElementById('btnGuardarEd'),
    };

    if (ed.nombre)  { ed.nombre.addEventListener('input', () => promoNombre(ed.nombre, ed.errN, ed.iconNombre));   ed.nombre.addEventListener('blur', () => promoNombre(ed.nombre, ed.errN, ed.iconNombre)); }
    if (ed.desc)      ed.desc.addEventListener('input', () => promoCtr(ed.desc, ed.ctrDesc, 500));
    if (ed.pct) {
        ed.pct.addEventListener('keydown', promoBloquearDescuento);
        ed.pct.addEventListener('paste',   e => promoBloquearDescuentoPaste(e, ed.pct));
        ed.pct.addEventListener('input',   () => promoDescuento(ed.pct, ed.errD, ed.iconDesc));
        ed.pct.addEventListener('blur',    () => promoDescuento(ed.pct, ed.errD, ed.iconDesc));
    }
    if (ed.inicio && ed.fin) {
        const chkEd = () => promoFechas(ed.inicio, ed.fin, ed.errI, ed.errF);
        ed.inicio.addEventListener('change', chkEd);
        ed.fin.addEventListener('change', chkEd);
    }
    if (ed.img) ed.img.addEventListener('change', () => promoImagen(ed.img, ed.errImg, ed.prevImg));

    const formEd = document.getElementById('formEditar');
    if (formEd) {
        formEd.addEventListener('submit', function(e) {
            const ok1 = ed.nombre ? promoNombre(ed.nombre, ed.errN, ed.iconNombre)                    : true;
            const ok2 = ed.pct    ? promoDescuento(ed.pct, ed.errD, ed.iconDesc)                     : true;
            const ok3 = (ed.inicio && ed.fin) ? promoFechas(ed.inicio, ed.fin, ed.errI, ed.errF)     : true;
            const ok4 = ed.img    ? promoImagen(ed.img, ed.errImg, ed.prevImg)                       : true;
            if (!ok1 || !ok2 || !ok3 || !ok4) {
                e.preventDefault();
                if (!ok1) ed.nombre.focus();
                else if (!ok2) ed.pct.focus();
                else if (!ok3) ed.inicio.focus();
            }
        });
    }

    const modalEditarEl = document.getElementById('modalEditar');
    if (modalEditarEl) {
        modalEditarEl.addEventListener('show.bs.modal', () => {
            [ed.nombre, ed.desc, ed.pct, ed.inicio, ed.fin].forEach(el => {
                if (el) el.classList.remove('is-invalid-promo', 'is-valid-promo');
            });
            ['err_nombre_ed','err_desc_ed','err_inicio_ed','err_fin_ed','err_img_ed'].forEach(id => {
                const el = document.getElementById(id); if (el) { el.textContent = ''; el.classList.remove('visible'); }
            });
            if (ed.btn) ed.btn.disabled = false;
            setTimeout(() => { if (ed.desc && ed.ctrDesc) promoCtr(ed.desc, ed.ctrDesc, 500); }, 60);
        });
    }

    /* ── Drag & drop highlight ── */
    document.querySelectorAll('.promo-dropzone').forEach(zone => {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', () => zone.classList.remove('dragover'));
    });

    /* ══════════════════════════════════════════════════════
       FILTRO DE NOMBRE — impedir números y signos al escribir
       Solo letras (incluyendo tildes/ñ) y espacios
    ══════════════════════════════════════════════════════ */
    const NOMBRE_ALLOWED = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]$/;

    function filtrarNombreKeypress(e) {
        if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            if (!NOMBRE_ALLOWED.test(e.key)) {
                e.preventDefault();
                // Mostrar feedback visual rápido
                const input = e.target;
                input.style.animation = 'shake 0.3s';
                setTimeout(() => { input.style.animation = ''; }, 300);
            }
        }
    }
    function filtrarNombrePaste(e) {
        e.preventDefault();
        const texto = (e.clipboardData || window.clipboardData).getData('text');
        const limpio = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]/g, '');
        document.execCommand('insertText', false, limpio);
    }
    function filtrarNombreInput() {
        const pos = this.selectionStart;
        const original = this.value;
        const limpio = original.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]/g, '');
        if (limpio !== original) {
            this.value = limpio;
            this.setSelectionRange(Math.min(pos, limpio.length), Math.min(pos, limpio.length));
        }
    }

    /* Aplicar filtro a todos los campos nombre de promociones */
    document.querySelectorAll('#modalAgregar [name="nombre"], #modalEditar [name="nombre"]').forEach(input => {
        input.addEventListener('keypress', filtrarNombreKeypress);
        input.addEventListener('paste', filtrarNombrePaste);
        input.addEventListener('input', filtrarNombreInput);
    });

    /* ── Bloquear caracteres no numéricos en campo de descuento ── */
    function filtrarDescuentoKeypress(e) {
        // Solo permitir: números y punto decimal
        const permitidos = /^[0-9\.]$/;
        
        if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            // Bloquear si ya hay un punto y se intenta escribir otro
            if (e.key === '.' && e.target.value.includes('.')) {
                e.preventDefault();
                const input = e.target;
                input.style.animation = 'shake 0.3s';
                setTimeout(() => { input.style.animation = ''; }, 300);
                return;
            }
            // Bloquear caracteres no permitidos
            if (!permitidos.test(e.key)) {
                e.preventDefault();
                const input = e.target;
                input.style.animation = 'shake 0.3s';
                setTimeout(() => { input.style.animation = ''; }, 300);
            }
        }
    }

    /* Aplicar filtro a todos los campos de descuento */
    document.querySelectorAll('#modalAgregar [name="porcentaje_descuento"], #modalEditar [name="porcentaje_descuento"]').forEach(input => {
        input.addEventListener('keypress', filtrarDescuentoKeypress);
    });

    /* ── Modal Ver Detalles Promoción ── */
    const ETIQUETA_COLORS = {
        nuevo:     'bg-primary',
        especial:  'bg-warning text-dark',
        limitado:  'bg-danger',
        descuento: 'bg-success',
        exclusivo: 'bg-purple',
    };
    document.querySelectorAll('.btn-detalle-promo').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('promoDetNombre').textContent     = btn.dataset.nombre;
            document.getElementById('promoDetDescuento').textContent  = btn.dataset.descuento + '%';
            document.getElementById('promoDetInicio').textContent     = btn.dataset.inicio;
            document.getElementById('promoDetFin').textContent        = (() => { const d=new Date(btn.dataset.fin); return isNaN(d)?btn.dataset.fin:d.toLocaleDateString('es-CO',{day:'2-digit',month:'2-digit',year:'numeric'}); })();
            document.getElementById('promoDetCreado').textContent     = btn.dataset.creado;
            document.getElementById('promoDetModificado').textContent = btn.dataset.modificado;
            document.getElementById('promoDetDesc').textContent       = btn.dataset.descripcion || '—';
            document.getElementById('promoDetActiva').innerHTML =
                btn.dataset.activa === 'Sí'
                ? '<span class="badge bg-success">Activa</span>'
                : '<span class="badge bg-secondary">Inactiva</span>';
            const etBadge = document.getElementById('promoDetEtiqueta');
            etBadge.textContent = btn.dataset.etiqueta;
            etBadge.className = 'badge ' + (ETIQUETA_COLORS[btn.dataset.etiqueta?.toLowerCase()] || 'bg-secondary');
            const img = document.getElementById('promoDetImg');
            const ph  = document.getElementById('promoDetImgPh');
            if (btn.dataset.imagenUrl) { img.src = btn.dataset.imagenUrl; img.style.display = ''; ph.style.display = 'none'; }
            else                       { img.style.display = 'none'; ph.style.display = ''; }
        });
    });
});

/* Sort en cliente para promo-tabla */
(function () {
    var tabla = document.getElementById('promo-tabla');
    if (!tabla) return;
    var tbody = tabla.querySelector('tbody');
    var lastCol = null, asc = true;

    function parseVal(txt) {
        var fecha = txt.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
        if (fecha) return fecha[3] + fecha[2] + fecha[1];
        var num = parseFloat(txt.replace(/[^0-9.\-]/g, ''));
        return isNaN(num) ? txt.toLowerCase() : num;
    }

    function cellVal(tr, col) {
        var td = tr.querySelectorAll('td')[col];
        if (!td) return '';
        return parseVal(td.hasAttribute('data-sort') ? td.getAttribute('data-sort') : td.textContent.trim());
    }

    tabla.querySelectorAll('th[data-sort]').forEach(function(th) {
        th.addEventListener('click', function () {
            var ths = Array.from(tabla.querySelectorAll('thead th'));
            var col = ths.indexOf(th);
            if (lastCol === col) { asc = !asc; } else { asc = true; lastCol = col; }
            tabla.querySelectorAll('th[data-sort]').forEach(function(h) { h.classList.remove('asc','desc'); });
            th.classList.add(asc ? 'asc' : 'desc');
            var rows = Array.from(tbody.querySelectorAll('tr'));
            rows.sort(function(a, b) {
                var va = cellVal(a, col), vb = cellVal(b, col);
                if (va < vb) return asc ? -1 : 1;
                if (va > vb) return asc ?  1 : -1;
                return 0;
            });
            rows.forEach(function(r) { tbody.appendChild(r); });
        });
    });
})();
