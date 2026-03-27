
const PROMO_TAGS_MAP = {
    'success': { icon: 'success', background: '#f0fdf4', color: '#166534' },
    'error':   { icon: 'error',   background: '#fef2f2', color: '#991b1b' },
    'warning': { icon: 'warning', background: '#fffbeb', color: '#92400e' },
    'info':    { icon: 'info',    background: '#eff6ff', color: '#1e40af' },
};

function initPromoAlerts() {
    if (typeof PROMO_MESSAGES !== 'undefined' && PROMO_MESSAGES.length) {
        PROMO_MESSAGES.forEach(m => {
            const tag  = Object.keys(PROMO_TAGS_MAP).find(k => m.tags.includes(k)) || 'info';
            const opts = PROMO_TAGS_MAP[tag];
            Swal.fire({
                icon: opts.icon,
                title: tag === 'success' ? 'Éxito' : (tag === 'error' ? 'Error' : 'Información'),
                text: m.text,
                confirmButtonColor: '#3a2a24',
                timer: 3000,
                timerProgressBar: true
            });
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    initPromoAlerts();

    const CSRF = () => document.querySelector('[name=csrfmiddlewaretoken]')?.value || '';

    document.addEventListener('change', async function (e) {
        const input = e.target.closest('.promo-switch input');
        if (!input) return;

        const url = input.dataset.toggleUrl;
        const nombre = input.dataset.nombre || 'la promoción';
        if (!url) {
            input.checked = !input.checked;
            return;
        }

        input.disabled = true;

        try {
            const response = await fetch(url, {
                method: 'POST',
                credentials: 'same-origin',
                headers: {
                    'X-CSRFToken': CSRF(),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok || !data.ok) {
                throw new Error(data.message || data.mensaje || 'No se pudo cambiar el estado.');
            }

            const activa = !!data.activa;
            const row = input.closest('tr');

            if (row) {
                const badge = row.querySelector('.promo-badge-active, .promo-badge-inactive');
                if (badge) {
                    badge.className = activa ? 'promo-badge-active' : 'promo-badge-inactive';
                    badge.textContent = activa ? 'Activa' : 'Inactiva';
                }

                const displayInput = row.querySelector('.promo-switch input');
                if (displayInput) {
                    displayInput.checked = activa;
                    displayInput.dataset.toggleUrl = url;
                }
            }

            if (typeof Swal !== 'undefined' && Swal.fire) {
                await Swal.fire({
                    icon: 'success',
                    title: 'Estado actualizado',
                    text: activa
                        ? `${nombre} quedó activa correctamente.`
                        : `${nombre} quedó inactiva correctamente.`,
                    confirmButtonColor: '#3a2a24',
                    confirmButtonText: 'OK',
                });
            }
        } catch (error) {
            input.checked = !input.checked;
            if (typeof Swal !== 'undefined' && Swal.fire) {
                await Swal.fire({
                    icon: 'error',
                    title: 'No se pudo cambiar el estado',
                    text: error.message || 'Intenta nuevamente.',
                    confirmButtonColor: '#3a2a24',
                    confirmButtonText: 'OK',
                });
            } else {
                alert(error.message || 'No se pudo cambiar el estado');
            }
        } finally {
            input.disabled = false;
        }
    });

    /* ── Función maestra para rellenar el modal ── */
    function fillEditModal(btn) {
        if (!btn) return;
        console.log("Rellenando modal con:", btn.dataset.nombre);

        const form = document.getElementById('formEditar');
        if (form) {
            form.action = btn.dataset.editUrl || '';
            form.dataset.promocionId = btn.dataset.pk || '';
        }

        const setVal = (id, val) => {
            const el = document.getElementById(id);
            if (el) el.value = val || '';
        };

        setVal('edit_nombre', btn.dataset.nombre);
        setVal('edit_etiqueta', btn.dataset.etiqueta);
        setVal('edit_descripcion', btn.dataset.descripcion);

        const descInput = document.getElementById('edit_descuento');
        if (descInput) {
            const raw = (btn.dataset.descuento || '0').toString().replace(',', '.');
            descInput.value = parseFloat(raw) || 0;
        }

        setVal('edit_inicio', btn.dataset.inicio);
        setVal('edit_fin', btn.dataset.fin);

        const chkActiva = document.getElementById('edit_activa');
        if (chkActiva) chkActiva.checked = (btn.dataset.activa === 'true');

        // Imagen
        const preview = document.getElementById('previewPromoEdit');
        const dz = document.getElementById('dropzonePromoEdit');
        const imgUrl = btn.dataset.imagenUrl;

        if (imgUrl && preview) {
            preview.src = imgUrl;
            preview.classList.remove('d-none');
            preview.style.filter = 'none';
            if (dz) dz.classList.add('has-image');
        } else if (preview) {
            preview.src = '';
            preview.classList.add('d-none');
            if (dz) dz.classList.remove('has-image');
        }

        // Reset campos de imagen
        const fileIn = document.getElementById('edit_imagen');
        if (fileIn) fileIn.value = '';
        const chkClear = document.getElementById('edit_imagen_clear');
        if (chkClear) chkClear.checked = false;
        const infoClear = document.getElementById('edit_info_clear');
        if (infoClear) infoClear.classList.add('d-none');
    }

    /* ── Listener Global para Clics (Delegación) ── */
    document.addEventListener('click', function(e) {
        // Botón Editar
        const btnEdit = e.target.closest('.btn-edit');
        if (btnEdit) {
            console.log("Clic detectado en botón editar");
            fillEditModal(btnEdit);
            
            // Forzar apertura si Bootstrap falla
            const modalEl = document.getElementById('modalEditar');
            if (modalEl) {
                const modalObj = bootstrap.Modal.getOrCreateInstance(modalEl);
                modalObj.show();
            }
            return;
        }

        // Botón Detalle
        const btnDet = e.target.closest('.btn-detalle-promo');
        if (btnDet) {
            const setDet = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || ''; };
            setDet('promoDetNombre', btnDet.dataset.nombre);
            setDet('promoDetDescuento', (btnDet.dataset.descuento || '0') + '%');
            setDet('promoDetInicio', btnDet.dataset.inicio);
            setDet('promoDetFin', btnDet.dataset.fin);
            setDet('promoDetCreado', btnDet.dataset.creado);
            setDet('promoDetModificado', btnDet.dataset.modificado);
            setDet('promoDetDesc', btnDet.dataset.descripcion || '—');
            
            const et = document.getElementById('promoDetEtiqueta');
            if (et) { et.textContent = btnDet.dataset.etiqueta; et.className = 'badge bg-secondary rounded-pill px-3'; }

            const img = document.getElementById('promoDetImg');
            const ph = document.getElementById('promoDetImgPh');
            if (btnDet.dataset.imagenUrl && img) { img.src = btnDet.dataset.imagenUrl; img.style.display = 'block'; if (ph) ph.style.display = 'none'; }
            else if (img) { img.style.display = 'none'; if (ph) ph.style.display = 'block'; }

            const mDet = document.getElementById('modalDetallePromo');
            if (mDet) bootstrap.Modal.getOrCreateInstance(mDet).show();
            return;
        }

        // Botón Eliminar
        const btnDel = e.target.closest('.btn-eliminar-promo');
        if (btnDel) {
            Swal.fire({
                title: '¿Eliminar promoción?',
                text: `¿Seguro que deseas eliminar "${btnDel.dataset.nombre}"?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            }).then(res => {
                if (res.isConfirmed) {
                    const f = document.getElementById('formEliminarPromo');
                    if (f) { f.action = btnDel.dataset.url; f.submit(); }
                }
            });
        }
    });

    // Lógica específica para el botón de eliminar imagen dentro del modal
    const btnRemoveImg = document.getElementById('btnRemoveImageEdit');
    btnRemoveImg?.addEventListener('click', function(e) {
        e.preventDefault();
        const chkClear = document.getElementById('edit_imagen_clear');
        const infoClear = document.getElementById('edit_info_clear');
        const preview = document.getElementById('previewPromoEdit');
        if (!chkClear) return;

        chkClear.checked = !chkClear.checked;
        if (chkClear.checked) {
            infoClear?.classList.remove('d-none');
            if (preview) preview.style.filter = 'grayscale(1) opacity(0.5)';
            this.innerHTML = '<i class="bi bi-arrow-counterclockwise"></i> Restaurar';
            this.classList.replace('btn-danger', 'btn-warning');
        } else {
            infoClear?.classList.add('d-none');
            if (preview) preview.style.filter = 'none';
            this.innerHTML = '<i class="bi bi-trashme-1"></i> Eliminar';
            this.classList.replace('btn-warning', 'btn-danger');
        }
    });
});
