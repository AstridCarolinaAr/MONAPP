
const PROMO_TAGS_MAP = {
    'success': { icon: 'success', background: '#f0fdf4', color: '#166534' },
    'error':   { icon: 'error',   background: '#fef2f2', color: '#991b1b' },
    'warning': { icon: 'warning', background: '#fffbeb', color: '#92400e' },
    'info':    { icon: 'info',    background: '#eff6ff', color: '#1e40af' },
};

if (PROMO_MESSAGES.length) {
    PROMO_MESSAGES.forEach(m => {
        const tag  = Object.keys(PROMO_TAGS_MAP).find(k => m.tags.includes(k)) || 'info';
        const opts = PROMO_TAGS_MAP[tag];
        // Modal central en lugar de Toast para mensajes globales (según preferencia usuario)
        Swal.fire({
            icon: opts.icon,
            title: tag === 'success' ? 'Éxito' : (tag === 'error' ? 'Error' : 'Información'),
            text: m.text,
            confirmButtonColor: '#3a2a24',
            background: '#ffffff',
            timer: 3000,
            timerProgressBar: true
        });
    });
}

document.addEventListener('DOMContentLoaded', () => {

    const CSRF = () => document.querySelector('[name=csrfmiddlewaretoken]').value;

    /* ── Toggle estado con confirmación y modal de éxito central ── */
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

                el.disabled = true;
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
                    
                    // Modal de éxito central (como el de la segunda imagen)
                    Swal.fire({
                        title: 'Estado actualizado',
                        text: actNow 
                            ? `"${nombre}" ahora ya está visible en el catálogo` 
                            : `"${nombre}" ahora ya no está visible en el catálogo`,
                        icon: 'success',
                        confirmButtonColor: '#3a2a24',
                        confirmButtonText: 'Entendido'
                    });
                })
                .catch(() => {
                    el.checked = !actNow;
                    Swal.fire({ icon: 'error', title: 'Error de red', timer: 2500, showConfirmButton: false });
                })
                .finally(() => {
                    el.disabled = false;
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
            if (!btn) return; // Seguridad: si no hay botón de origen, no hacemos nada para evitar crash

            const formEditar = document.getElementById('formEditar');
            if (formEditar) {
                formEditar.action = btn.dataset.editUrl || '';
                formEditar.dataset.promocionId = btn.dataset.promocionId || btn.dataset.pk || '';
            }

            // Rellenar campos con seguridad
            const setVal = (id, val) => {
                const el = document.getElementById(id);
                if (el) el.value = val || '';
            };

            setVal('edit_nombre', btn.dataset.nombre);
            setVal('edit_etiqueta', btn.dataset.etiqueta);
            setVal('edit_descripcion', btn.dataset.descripcion);

            // Manejo especial de descuento (reemplazar coma decimal por punto)
            const descInput = document.getElementById('edit_descuento');
            if (descInput && btn.dataset.descuento) {
                descInput.value = btn.dataset.descuento.replace(',', '.');
            }

            setVal('edit_inicio', btn.dataset.inicio);
            setVal('edit_fin', btn.dataset.fin);

            const chkActiva = document.getElementById('edit_activa');
            if (chkActiva) chkActiva.checked = btn.dataset.activa === 'true';

            // Reset imagen y preview
            const imgInput = document.getElementById('edit_imagen');
            if (imgInput) imgInput.value = '';
            
            const chkClear = document.getElementById('edit_imagen_clear');
            if (chkClear) chkClear.checked = false;

            const preview = document.getElementById('previewPromoEdit');
            const dropzone = document.getElementById('dropzonePromoEdit');
            const imgUrl = btn.dataset.imagenUrl;

            if (imgUrl) {
                if (preview) {
                    preview.src = imgUrl;
                    preview.classList.remove('d-none');
                    preview.style.filter = 'none';
                }
                if (dropzone) dropzone.classList.add('has-image');
            } else {
                if (preview) {
                    preview.src = '';
                    preview.classList.add('d-none');
                }
                if (dropzone) dropzone.classList.remove('has-image');
            }

            const infoClear = document.getElementById('edit_info_clear');
            if (infoClear) infoClear.classList.add('d-none');

            // Lógica Eliminar Imagen (dentro de Edit)
            const btnRemove = document.getElementById('btnRemoveImageEdit');

            if (btnRemove && chkClear) {
                // Reset state when opening modal
                chkClear.checked = false;
                if (infoClear) infoClear.classList.add('d-none');
                if (preview) preview.style.filter = 'none';

                btnRemove.onclick = (e) => {
                    e.stopPropagation();
                    const willClear = !chkClear.checked;
                    chkClear.checked = willClear;
                    
                    if (willClear) {
                        if (infoClear) infoClear.classList.remove('d-none');
                        if (preview) {
                            preview.style.filter = 'grayscale(1) opacity(0.5)';
                            preview.style.transition = 'all 0.3s ease';
                        }
                        btnRemove.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i> Restaurar';
                        btnRemove.classList.replace('btn-danger', 'btn-warning');
                    } else {
                        if (infoClear) infoClear.classList.add('d-none');
                        if (preview) preview.style.filter = 'none';
                        btnRemove.innerHTML = '<i class="bi bi-trashme-1"></i> Eliminar';
                        btnRemove.classList.replace('btn-warning', 'btn-danger');
                    }
                };
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
                        editPreview.style.filter = 'none';
                        const dz = document.getElementById('dropzonePromoEdit');
                        if (dz) dz.classList.add('has-image');
                        
                        // Si carga nueva imagen, cancelamos el "clear"
                        const chkClear = document.getElementById('edit_imagen_clear');
                        const infoClear = document.getElementById('edit_info_clear');
                        if (chkClear) chkClear.checked = false;
                        if (infoClear) infoClear.classList.add('d-none');
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
    function promoErr(input, errEl, msg) {
        if (msg) {
            input.classList.add('is-invalid-promo');
            input.classList.remove('is-valid-promo');
            errEl.textContent = msg;
            errEl.classList.add('visible');
        } else {
            input.classList.remove('is-invalid-promo');
            input.classList.add('is-valid-promo');
            errEl.textContent = '';
            errEl.classList.remove('visible');
        }
        return !msg;
    }

    /* Nombre */
    const PROMO_REG = /^[a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s]+$/;
    function promoNombre(input, errEl) {
        const v = input.value.trim();
        let msg = '';
        if (!v)                  msg = 'El nombre es obligatorio.';
        else if (v.length < 2)       msg = 'Mínimo 2 caracteres.';
        else if (v.length > 200)     msg = 'Máximo 200 caracteres.';
        else if (!PROMO_REG.test(v)) msg = 'Solo se permiten letras y espacios. No se admiten números ni caracteres especiales.';
        else if (input.dataset.nombreDuplicado === '1') msg = 'Ya existe una promocion con este nombre.';
        return promoErr(input, errEl, msg);
    }

    const PROMO_DUP_URL = "/promociones/validar-nombre/";

    async function promoNombreDuplicado(input, errEl) {
        const v = (input.value || '').trim();
        if (!v || v.length < 2) return true;

        const form = input.closest('form');
        const promocionId = (form?.dataset?.promocionId || '').trim();
        const url = new URL(PROMO_DUP_URL, window.location.origin);
        url.searchParams.set('nombre', v);
        if (promocionId) url.searchParams.set('promocion_id', promocionId);

        const token = String(Date.now()) + Math.random().toString(36).slice(2);
        input.dataset.dupToken = token;

        try {
            const response = await fetch(url.toString(), {
                headers: { 'X-Requested-With': 'XMLHttpRequest' },
            });
            const data = await response.json().catch(() => ({}));
            if (input.dataset.dupToken !== token) return false;
            if (!data.valid) {
                input.dataset.nombreDuplicado = '1';
                promoErr(input, errEl, data.message || 'Ya existe una promocion con este nombre.');
                return false;
            }
            delete input.dataset.nombreDuplicado;
            promoErr(input, errEl, '');
            return true;
        } catch (error) {
            return true;
        }
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
    function promoDescuento(input, errEl) {
        const raw  = input.value.trim();
        const val  = parseFloat(raw);
        const decs = raw.includes('.') ? raw.split('.')[1].length : 0;
        let msg = '';
        if (!raw)             msg = 'El descuento es obligatorio.';
        else if (isNaN(val))  msg = 'Ingresa un número válido.';
        else if (val <= 0)    msg = 'El descuento debe ser mayor a 0%.';
        else if (val > 100)   msg = 'El descuento no puede superar el 100%.';
        else if (decs > 2)    msg = 'Máximo 2 decimales permitidos.';
        return promoErr(input, errEl, msg);
    }

    /* Fechas: inicio + fin + rango */
    function promoFechas(inEl, finEl, errInEl, errFinEl) {
        let okIn = true, okFin = true;
        if (!inEl.value) {
            promoErr(inEl, errInEl, 'La fecha de inicio es obligatoria.');
            okIn = false;
        } else {
            promoErr(inEl, errInEl, '');
        }
        if (!finEl.value) {
            promoErr(finEl, errFinEl, 'La fecha de fin es obligatoria.');
            okFin = false;
        } else if (inEl.value && finEl.value < inEl.value) {
            promoErr(finEl, errFinEl, 'La fecha de fin debe ser igual o posterior a la de inicio.');
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
        const dropzone = input.closest('.promo-dropzone');
        errEl.textContent = ''; errEl.classList.remove('visible');
        
        if (!input.files || !input.files[0]) {
            // No hay archivo (se limpió o no se eligió ninguno)
            // Si el preview ya tiene un src (caso edición), no quitamos has-image a menos que el input esté realmente vacío
            if (!input.value) {
                if (dropzone && !previewEl.src.includes('data:image')) {
                     // Solo quitamos si no es una imagen persistente de edición o una nueva carga
                     // Pero para simplificar, si el input es el que manda:
                     // dropzone.classList.remove('has-image');
                }
            }
            return true;
        }

        const f  = input.files[0];
        const mb = f.size / (1024 * 1024);

        if (!TIPOS.includes(f.type)) {
            promoErr(input, errEl, 'Solo se permiten imágenes JPG, PNG, WEBP o GIF.');
            input.value = '';
            if (previewEl) previewEl.classList.add('d-none');
            if (dropzone) dropzone.classList.remove('has-image');
            return false;
        }
        if (mb > 5) {
            promoErr(input, errEl, `La imagen pesa ${mb.toFixed(1)} MB. Máximo 5 MB.`);
            input.value = '';
            if (previewEl) previewEl.classList.add('d-none');
            if (dropzone) dropzone.classList.remove('has-image');
            return false;
        }

        promoErr(input, errEl, '');
        if (previewEl) {
            const reader = new FileReader();
            reader.onload = e => { 
                previewEl.src = e.target.result; 
                previewEl.classList.remove('d-none'); 
                if (dropzone) dropzone.classList.add('has-image');
            };
            reader.readAsDataURL(f);
        }
        return true;
    }

    /* ---- REFERENCIAS MODAL AGREGAR ---- */
    const ag = {
        nombre:   document.querySelector('#modalAgregar [name="nombre"]'),
        errN:     document.getElementById('err_nombre_ag'),
        desc:     document.querySelector('#modalAgregar [name="descripcion"]'),
        ctrDesc:  document.getElementById('char_desc_ag'),
        pct:      document.querySelector('#modalAgregar [name="porcentaje_descuento"]'),
        errD:     document.getElementById('err_desc_ag'),
        inicio:   document.querySelector('#modalAgregar [name="fecha_inicio"]'),
        errI:     document.getElementById('err_inicio_ag'),
        fin:      document.querySelector('#modalAgregar [name="fecha_fin"]'),
        errF:     document.getElementById('err_fin_ag'),
        img:      document.querySelector('#dropzonePromoModal input[type="file"]'),
        errImg:   document.getElementById('err_img_ag'),
        prevImg:  document.getElementById('previewPromoModal'),
        btn:      document.getElementById('btnGuardarAg'),
    };

    if (ag.nombre)  {
        ag.nombre.addEventListener('input', () => {
            promoNombre(ag.nombre, ag.errN);
            promoNombreDuplicado(ag.nombre, ag.errN);
        });
        ag.nombre.addEventListener('blur', () => {
            promoNombre(ag.nombre, ag.errN);
            promoNombreDuplicado(ag.nombre, ag.errN);
        });
    }
    if (ag.desc)      ag.desc.addEventListener('input', () => promoCtr(ag.desc, ag.ctrDesc, 500));
    if (ag.pct)     { ag.pct.addEventListener('input', () => promoDescuento(ag.pct, ag.errD));       ag.pct.addEventListener('blur', () => promoDescuento(ag.pct, ag.errD)); }
    if (ag.inicio && ag.fin) {
        const chkAg = () => promoFechas(ag.inicio, ag.fin, ag.errI, ag.errF);
        ag.inicio.addEventListener('change', chkAg);
        ag.fin.addEventListener('change', chkAg);
    }
    if (ag.img) ag.img.addEventListener('change', () => promoImagen(ag.img, ag.errImg, ag.prevImg));

    const formAg = document.querySelector('#modalAgregar form');
    if (formAg) {
        formAg.addEventListener('submit', function(e) {
            const ok1 = ag.nombre ? promoNombre(ag.nombre, ag.errN)                                         : true;
            const ok2 = ag.pct    ? promoDescuento(ag.pct, ag.errD)                                         : true;
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
            if (ag.prevImg) {
                ag.prevImg.classList.add('d-none');
                ag.prevImg.src = '';
                const dz = ag.prevImg.closest('.promo-dropzone');
                if (dz) dz.classList.remove('has-image');
            }
            if (ag.btn) ag.btn.disabled = false;
        });
    }

    /* ---- REFERENCIAS MODAL EDITAR ---- */
    const ed = {
        nombre:  document.getElementById('edit_nombre'),
        errN:    document.getElementById('err_nombre_ed'),
        desc:    document.getElementById('edit_descripcion'),
        ctrDesc: document.getElementById('char_desc_ed'),
        pct:     document.getElementById('edit_descuento'),
        errD:    document.getElementById('err_desc_ed'),
        inicio:  document.getElementById('edit_inicio'),
        errI:    document.getElementById('err_inicio_ed'),
        fin:     document.getElementById('edit_fin'),
        errF:    document.getElementById('err_fin_ed'),
        img:     document.getElementById('edit_imagen'),
        errImg:  document.getElementById('err_img_ed'),
        prevImg: document.getElementById('previewPromoEdit'),
        btn:     document.getElementById('btnGuardarEd'),
    };

    if (ed.nombre)  {
        ed.nombre.addEventListener('input', () => {
            promoNombre(ed.nombre, ed.errN);
            promoNombreDuplicado(ed.nombre, ed.errN);
        });
        ed.nombre.addEventListener('blur', () => {
            promoNombre(ed.nombre, ed.errN);
            promoNombreDuplicado(ed.nombre, ed.errN);
        });
    }
    if (ed.desc)      ed.desc.addEventListener('input', () => promoCtr(ed.desc, ed.ctrDesc, 500));
    if (ed.pct)     { ed.pct.addEventListener('input', () => promoDescuento(ed.pct, ed.errD));       ed.pct.addEventListener('blur', () => promoDescuento(ed.pct, ed.errD)); }
    if (ed.inicio && ed.fin) {
        const chkEd = () => promoFechas(ed.inicio, ed.fin, ed.errI, ed.errF);
        ed.inicio.addEventListener('change', chkEd);
        ed.fin.addEventListener('change', chkEd);
    }
    if (ed.img) ed.img.addEventListener('change', () => promoImagen(ed.img, ed.errImg, ed.prevImg));

    const formEd = document.getElementById('formEditar');
    if (formEd) {
        formEd.addEventListener('submit', function(e) {
            const ok1 = ed.nombre ? promoNombre(ed.nombre, ed.errN)                                   : true;
            const ok2 = ed.pct    ? promoDescuento(ed.pct, ed.errD)                                   : true;
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
            if (!NOMBRE_ALLOWED.test(e.key)) e.preventDefault();
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

            // NUEVO: Pasar el trigger al botón de edición del detalle
            const btnDetEdit = document.getElementById('btnDetalleEditar');
            if (btnDetEdit) {
                btnDetEdit.onclick = () => {
                    const detailModal = bootstrap.Modal.getInstance(document.getElementById('modalDetallePromo'));
                    detailModal.hide();
                    // Buscamos el botón de edición original en la misma fila
                    const row = btn.closest('tr');
                    const realEditBtn = row.querySelector('.btn-edit');
                    if (realEditBtn) {
                        setTimeout(() => { realEditBtn.click(); }, 350);
                    }
                };
            }
        });
    });
});
