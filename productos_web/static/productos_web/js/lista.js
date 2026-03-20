/* ─── Mensajes Django como Swal toast ─── */
const PW_MESSAGES = window.PW_MESSAGES || [];

const PW_TAGS_MAP = {
    'success': { icon: 'success', background: '#f0fdf4', color: '#166534' },
    'error':   { icon: 'error',   background: '#fef2f2', color: '#991b1b' },
    'warning': { icon: 'warning', background: '#fffbeb', color: '#92400e' },
    'info':    { icon: 'info',    background: '#eff6ff', color: '#1e40af' },
};

if (PW_MESSAGES.length) {
    PW_MESSAGES.forEach(m => {
        if (m.tags.includes('created')) {
            /* Popup centrado al crear */
            Swal.fire({
                icon: 'success',
                title: '¡Producto creado!',
                text: m.text,
                confirmButtonText: 'Aceptar',
                confirmButtonColor: '#3a2a24',
                background: '#fff',
                color: '#3a2a24',
                customClass: { popup: 'rounded-4' },
            });
        } else {
            const tag  = Object.keys(PW_TAGS_MAP).find(k => m.tags.includes(k)) || 'info';
            const opts = PW_TAGS_MAP[tag];
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

    /* ── Toggle visibilidad con confirmación Swal ── */
    document.querySelectorAll('.pw-switch input[type="checkbox"]').forEach(toggle => {
        toggle.addEventListener('change', function () {
            const url     = this.dataset.toggleUrl;
            const nombre  = this.dataset.nombre;
            const visNow  = this.checked;
            const el      = this;

            Swal.fire({
                title: visNow ? '¿Hacer visible?' : '¿Ocultar producto?',
                text:  `"${nombre}" ${visNow ? 'aparecerá en el catálogo web.' : 'se ocultará del catálogo web.'}`,
                icon:  visNow ? 'question' : 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3a2a24',
                cancelButtonColor:  '#6c757d',
                confirmButtonText:  visNow ? 'Sí, mostrar' : 'Sí, ocultar',
                cancelButtonText:   'Cancelar',
            }).then(result => {
                if (!result.isConfirmed) {
                    el.checked = !visNow;
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
                        el.checked = !visNow;
                        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo actualizar la visibilidad.', timer: 2500, showConfirmButton: false });
                        return;
                    }
                    Swal.mixin({
                        toast: true, position: 'top-end',
                        showConfirmButton: false, timer: 2000, timerProgressBar: true,
                        background: '#f0fdf4', color: '#166534',
                    }).fire({ icon: 'success', title: visNow ? 'Producto visible' : 'Producto oculto' });
                })
                .catch(() => {
                    el.checked = !visNow;
                    Swal.fire({ icon: 'error', title: 'Error de red', timer: 2500, showConfirmButton: false });
                });
            });
        });
    });

    /* ── Eliminar producto con confirmación Swal ── */
    document.querySelectorAll('.btn-eliminar-pw').forEach(btn => {
        btn.addEventListener('click', function () {
            const nombre = this.dataset.nombre;
            const url    = this.dataset.url;

            Swal.fire({
                title: '¿Eliminar producto?',
                html:  `¿Seguro que deseas eliminar <strong>${nombre}</strong> del catálogo web? Esta acción no se puede deshacer.`,
                icon:  'warning',
                showCancelButton:    true,
                confirmButtonColor:  '#dc3545',
                cancelButtonColor:   '#6c757d',
                confirmButtonText:   '<i class="bi bi-trash3"></i> Eliminar',
                cancelButtonText:    'Cancelar',
                reverseButtons:      true,
            }).then(result => {
                if (result.isConfirmed) {
                    const form = document.getElementById('formEliminarPW');
                    form.action = url;
                    form.submit();
                }
            });
        });
    });

    /* ══════════════════════════════════════════════════════
       VALIDACIONES EN TIEMPO REAL — Productos Web
       - Nombre:      obligatorio · 2-200 chars · solo chars válidos
       - Precio:      COP · mín $100 · máx $99.999.999 · entero
       - Descripción: máx 500 chars · contador
       - Imagen:      JPG/PNG/WEBP/GIF · máx 5 MB · preview
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
    function pwBloquearCaracteresNombre(e) {
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
    function pwBloquearCaracteresPrecio(e) {
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
                previewEl.classList.remove('is-error');
            } else {
                previewEl.textContent = '';
                previewEl.classList.remove('visible');
            }
        }
        return ok;
    }

    /* ── Contador descripción ── */
    function pwActualizarContador(textarea, contEl, max) {
        const len = textarea.value.length;
        if (len > max) textarea.value = textarea.value.substring(0, max);
        contEl.textContent = `${Math.min(len, max)}/${max} caracteres`;
        contEl.className = 'pw-char-count' +
            (len >= max        ? ' at-limit'   :
             len >= max * 0.85 ? ' near-limit' : '');
    }

    /* ── Validar imagen ── */
    function pwValidarImagen(input, errEl, previewEl) {
        const TIPOS = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        const MAX_MB = 5;
        errEl.textContent = '';
        errEl.classList.remove('visible');
        if (!input.files || !input.files[0]) return true;
        const f = input.files[0];
        if (!TIPOS.includes(f.type)) {
            errEl.textContent = 'Solo se permiten imágenes JPG, PNG, WEBP o GIF.';
            errEl.classList.add('visible');
            input.value = '';
            if (previewEl) previewEl.classList.add('d-none');
            return false;
        }
        const mb = f.size / (1024 * 1024);
        if (mb > MAX_MB) {
            errEl.textContent = `La imagen pesa ${mb.toFixed(1)} MB. Máximo ${MAX_MB} MB.`;
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

    /* ── Referencias DOM — modal Agregar ── */
    const ag = {
        nombre:     document.querySelector('#modalAgregar [name="nombre"]'),
        errNombre:  document.getElementById('err_nombre_agregar'),
        iconNombre: document.getElementById('icon_nombre_agregar'),
        desc:       document.querySelector('#modalAgregar [name="descripcion"]'),
        ctrDesc:    document.getElementById('char_desc_agregar'),
        precio:     document.querySelector('#modalAgregar [name="precio"]'),
        errPrecio:  document.getElementById('err_precio_agregar'),
        iconPrecio: document.getElementById('icon_precio_agregar'),
        copPrev:    document.getElementById('cop_preview_agregar'),
        img:        document.querySelector('#dropzoneAgregar input[type="file"]'),
        errImg:     document.getElementById('err_img_agregar'),
        prevImg:    document.getElementById('previewAgregar'),
        btnGuardar: document.querySelector('#modalAgregar [type="submit"]'),
    };

    /* Bindings */
    if (ag.nombre) {
        ag.nombre.addEventListener('keydown', pwBloquearCaracteresNombre);
        ag.nombre.addEventListener('input', () => pwValidarNombre(ag.nombre, ag.errNombre, ag.iconNombre));
        ag.nombre.addEventListener('blur',  () => pwValidarNombre(ag.nombre, ag.errNombre, ag.iconNombre));
        ag.nombre.addEventListener('paste', function (e) {
            e.preventDefault();
            const texto  = (e.clipboardData || window.clipboardData).getData('text');
            const limpio = texto.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s\.\,\-\(\)]/g, '');
            document.execCommand('insertText', false, limpio);
        });
        ag.nombre.addEventListener('input', function () {
            const pos      = this.selectionStart;
            const original = this.value;
            const limpio   = original.replace(/[^a-zA-ZáéíóúÁÉÍÓÚàèìòùÀÈÌÒÙñÑüÜ\s\.\,\-\(\)]/g, '');
            if (limpio !== original) {
                this.value = limpio;
                this.setSelectionRange(
                    Math.min(pos, limpio.length),
                    Math.min(pos, limpio.length)
                );
            }
        });
    }
    if (ag.desc && ag.ctrDesc) {
        ag.desc.addEventListener('keydown', function (e) {
            if (e.key.length > 1) return;
            if (ag.desc.value.length >= 500 && ag.desc.selectionStart === ag.desc.selectionEnd) {
                e.preventDefault();
                ag.desc.style.animation = 'shake 0.3s';
                setTimeout(() => { ag.desc.style.animation = ''; }, 300);
            }
        });
        ag.desc.addEventListener('input', () => pwActualizarContador(ag.desc, ag.ctrDesc, 500));
    }
    if (ag.precio) {
        ag.precio.addEventListener('keydown', pwBloquearCaracteresPrecio);
        ag.precio.addEventListener('input', () => pwValidarPrecio(ag.precio, ag.errPrecio, ag.copPrev, ag.iconPrecio));
        ag.precio.addEventListener('blur',  () => pwValidarPrecio(ag.precio, ag.errPrecio, ag.copPrev, ag.iconPrecio));
    }
    if (ag.img) {
        ag.img.addEventListener('change', () => pwValidarImagen(ag.img, ag.errImg, ag.prevImg));
    }

    /* Submit modal Agregar */
    const formAgregar = document.querySelector('#modalAgregar form');
    if (formAgregar) {
        formAgregar.addEventListener('submit', function (e) {
            const ok1 = ag.nombre ? pwValidarNombre(ag.nombre, ag.errNombre, ag.iconNombre) : true;
            const ok2 = ag.precio ? pwValidarPrecio(ag.precio, ag.errPrecio, ag.copPrev, ag.iconPrecio) : true;
            const ok3 = ag.img    ? pwValidarImagen(ag.img, ag.errImg, ag.prevImg) : true;
            if (!ok1 || !ok2 || !ok3) {
                e.preventDefault();
                if (!ok1) ag.nombre.focus();
                else if (!ok2) ag.precio.focus();
            }
        });
    }

    /* Reset al abrir modal */
    const modalAgregarEl = document.getElementById('modalAgregar');
    if (modalAgregarEl) {
        modalAgregarEl.addEventListener('show.bs.modal', () => {
            [ag.nombre, ag.precio].forEach(el => {
                if (el) el.classList.remove(
                    'is-valid-name','is-invalid-name',
                    'is-valid-price','is-invalid-price'
                );
            });
            ['err_nombre_agregar','err_precio_agregar','err_img_agregar'].forEach(id => {
                const el = document.getElementById(id);
                if (el) { el.textContent = ''; el.classList.remove('visible'); }
            });
            if (ag.ctrDesc)    ag.ctrDesc.textContent = '';
            if (ag.copPrev) { ag.copPrev.textContent = ''; ag.copPrev.classList.remove('visible'); }
            if (ag.prevImg)    ag.prevImg.classList.add('d-none');
        });
    }

    /* ── Drag & drop highlight ── */
    document.querySelectorAll('.pw-dropzone').forEach(zone => {
        zone.addEventListener('dragover', e => { e.preventDefault(); zone.classList.add('dragover'); });
        zone.addEventListener('dragleave', () => zone.classList.remove('dragover'));
        zone.addEventListener('drop', () => zone.classList.remove('dragover'));
    });

    /* ── Modal Ver Detalles ── */
    document.querySelectorAll('.btn-detalle-pw').forEach(btn => {
        btn.addEventListener('click', () => {
            document.getElementById('pwDetNombre').textContent     = btn.dataset.nombre;
            document.getElementById('pwDetPrecio').textContent     = '$' + parseFloat(btn.dataset.precio).toLocaleString('es-CO');
            document.getElementById('pwDetCreado').textContent     = btn.dataset.creado;
            document.getElementById('pwDetModificado').textContent = btn.dataset.modificado;
            document.getElementById('pwDetDesc').textContent       = btn.dataset.descripcion || '—';
            document.getElementById('pwDetVisible').innerHTML =
                btn.dataset.visible === 'Sí'
                ? '<span class="badge bg-success-subtle text-success">Visible</span>'
                : '<span class="badge bg-secondary-subtle text-secondary">Oculto</span>';
            const img = document.getElementById('pwDetImg');
            const ph  = document.getElementById('pwDetImgPh');
            if (btn.dataset.imagenUrl) { img.src = btn.dataset.imagenUrl; img.style.display = ''; ph.style.display = 'none'; }
            else                       { img.style.display = 'none'; ph.style.display = ''; }
        });
    });
});

/* ── Sort en cliente para pw-tabla ── */
(function () {
    var tabla = document.getElementById('pw-tabla');
    if (!tabla) return;
    var tbody = tabla.querySelector('tbody');
    var lastCol = null, asc = true;

    function cellVal(tr, col) {
        var td = tr.querySelectorAll('td')[col];
        if (!td) return '';
        var txt = td.hasAttribute('data-sort') ? td.getAttribute('data-sort') : td.textContent.trim();
        var num = parseFloat(txt.replace(/[^0-9.\-]/g, ''));
        return isNaN(num) ? txt.toLowerCase() : num;
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
