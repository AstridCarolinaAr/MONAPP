document.addEventListener('DOMContentLoaded', function () {

    const INPUT_RULES = {
        alnum: {
            pattern: /[^\p{L}\p{N}\s]/gu,
            allow: (text) => /^[\p{L}\p{N}\s]*$/u.test(text),
        },
        numeric: {
            pattern: /[^\d]/g,
            allow: (text) => /^\d*$/.test(text),
        },
        money: {
            pattern: /[^\d.,\s]/g,
            allow: (text) => /^[\d.,\s]*$/.test(text),
        },
    };

    function bindRestrictedInput(input, ruleName) {
        if (!input || input.dataset.guardWired === '1' || !INPUT_RULES[ruleName]) return;
        input.dataset.guardWired = '1';

        const rule = INPUT_RULES[ruleName];
        const sanitize = () => {
            const cleaned = String(input.value || '').replace(rule.pattern, '');
            if (cleaned !== input.value) {
                input.value = cleaned;
            }
        };

        input.addEventListener('beforeinput', function (e) {
            if (!e.inputType || !e.inputType.startsWith('insert')) return;
            if (!rule.allow(e.data || '')) e.preventDefault();
        });

        input.addEventListener('paste', function (e) {
            const pasted = e.clipboardData?.getData('text') || '';
            if (!rule.allow(pasted)) {
                e.preventDefault();
                sanitize();
            }
        });

        input.addEventListener('input', sanitize);
    }

    function wireServicioGuards(scope) {
        const root = scope || document;
        const fields = [
            ['[name="nombre"]', 'alnum'],
            ['[name="precio"]', 'money'],
            ['[name="descripcion"]', 'alnum'],
        ];

        fields.forEach(function (pair) {
            const input = root.querySelector(pair[0]) || document.querySelector(pair[0]);
            if (input) bindRestrictedInput(input, pair[1]);
        });
    }

    // ── ESTADO DE VISTA ──
    let currentView  = 'grid';
    let currentPage  = 1;
    let itemsPerPage = parseInt(document.getElementById('gridSize')?.value || 4) * 3;

    // ── TOGGLE VISTA ──
    const btnGrid = document.getElementById('btnGrid');
    const btnList = document.getElementById('btnList');

    if (btnGrid) btnGrid.addEventListener('click', () => setView('grid'));
    if (btnList) btnList.addEventListener('click', () => setView('list'));

    function setView(v) {
        currentView = v;
        const vg = document.getElementById('viewGrid');
        const vl = document.getElementById('viewList');
        if (vg) vg.style.display = v === 'grid' ? 'grid' : 'none';
        if (vl) vl.style.display = v === 'list' ? 'flex'  : 'none';
        if (btnGrid) btnGrid.classList.toggle('active', v === 'grid');
        if (btnList) btnList.classList.toggle('active', v === 'list');
        const gsw = document.getElementById('gridSizeWrap');
        if (gsw) gsw.style.display = v === 'grid' ? 'flex' : 'none';
        currentPage = 1;
        render();
    }

    // ── TAMAÑO CUADRÍCULA ──
    const gridSizeEl = document.getElementById('gridSize');
    if (gridSizeEl) {
        gridSizeEl.addEventListener('change', () => {
            const vg = document.getElementById('viewGrid');
            if (vg) vg.style.setProperty('--cols', gridSizeEl.value);
            itemsPerPage = parseInt(gridSizeEl.value) * 3;
            currentPage = 1;
            render();
        });

        const vg = document.getElementById('viewGrid');
        if (vg) vg.style.setProperty('--cols', gridSizeEl.value);
        itemsPerPage = parseInt(gridSizeEl.value) * 3;
    }

    // ── RENDER (paginación client-side sobre resultados actuales del DOM) ──
    function getItems() {
        if (currentView === 'grid') return Array.from(document.querySelectorAll('#viewGrid .lib-card'));
        return Array.from(document.querySelectorAll('#viewList .lib-row'));
    }

    function render() {
        const items      = getItems();
        const total      = items.length;
        const totalPages = Math.max(1, Math.ceil(total / itemsPerPage));
        if (currentPage > totalPages) currentPage = totalPages;

        const start = (currentPage - 1) * itemsPerPage;
        const end   = start + itemsPerPage;

        // Ocultar todos
        Array.from(document.querySelectorAll('#viewGrid .lib-card')).forEach(el => el.style.display = 'none');
        Array.from(document.querySelectorAll('#viewList .lib-row')).forEach(el => el.style.display = 'none');

        // Mostrar página actual
        items.slice(start, end).forEach(el => {
            el.style.display = currentView === 'grid' ? 'block' : 'flex';
        });

        const libCount = document.getElementById('libCount');
        if (libCount) {
            libCount.textContent = total > 0
                ? `Mostrando ${start + 1}–${Math.min(end, total)} de ${total}`
                : 'Sin resultados';
        }

        renderPagination(totalPages);
    }

    function renderPagination(totalPages) {
        const info = document.getElementById('pageInfo');
        const btns = document.getElementById('pageButtons');
        if (!info || !btns) return;

        info.textContent = `Página ${currentPage} de ${totalPages}`;
        btns.innerHTML   = '';

        btns.appendChild(makePageBtn('‹', currentPage === 1, () => { currentPage--; render(); }));

        for (let i = 1; i <= totalPages; i++) {
            if (totalPages > 7 && i > 2 && i < totalPages - 1 && Math.abs(i - currentPage) > 1) {
                if (i === 3 || i === totalPages - 2) {
                    const dots = document.createElement('span');
                    dots.textContent = '…';
                    dots.style.cssText = 'padding:0 4px;color:var(--text-muted);line-height:32px;';
                    btns.appendChild(dots);
                }
                continue;
            }
            const btn = makePageBtn(i, false, () => { currentPage = i; render(); });
            if (i === currentPage) btn.classList.add('active');
            btns.appendChild(btn);
        }

        btns.appendChild(makePageBtn('›', currentPage === totalPages, () => { currentPage++; render(); }));
    }

    function makePageBtn(label, disabled, onClick) {
        const btn = document.createElement('button');
        btn.className = 'lib-page-btn';
        btn.textContent = label;
        btn.disabled    = disabled;
        btn.addEventListener('click', onClick);
        return btn;
    }

    // Re-render cuando el AJAX actualiza el partial
    const resultados = document.getElementById('lista-servicios-resultados');
    if (resultados) {
        const observer = new MutationObserver(() => {
            currentPage = 1;
            render();
        });
        observer.observe(resultados, { childList: true, subtree: false });
    }

    render();

    // ── CSRF TOKEN (desde cookie, funciona en JS externo) ──
    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : '';
    }

    // ── MODAL CREAR ──
    const modalCrear = document.getElementById('modalFormServicio');
    if (modalCrear) {
        modalCrear.addEventListener('show.bs.modal', function () {
            const content = document.getElementById('modalFormContent');
            content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Cargando...</p></div>';
            fetch(window.URLS.crearServicio + '?modal=1')
                .then(r => r.text())
                .then(html => { content.innerHTML = html; ejecutarScripts(content); })
                .catch(() => { content.innerHTML = '<div class="alert alert-danger m-3">Error al cargar.</div>'; });
        });
    }

    // ── MODAL EDITAR ──
    window.abrirModalEditar = function (pk) {
        const modal   = document.getElementById('modalEditarServicio');
        const content = document.getElementById('modalEditarContent');
        if (!modal || !content) return;

        content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-primary" role="status"></div><p class="mt-3">Cargando...</p></div>';
        const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
        bsModal.show();

        fetch(`${window.URLS.editarServicio}${pk}/?modal=1`)
            .then(r => r.text())
            .then(html => { content.innerHTML = html; ejecutarScripts(content); })
            .catch(() => { content.innerHTML = '<div class="alert alert-danger m-3">Error al cargar.</div>'; });
    };

    // ── MODAL ELIMINAR ──
    window.abrirModalEliminar = function (pk) {
        const modal   = document.getElementById('modalEliminarServicio');
        const content = document.getElementById('modalEliminarContent');
        if (!modal || !content) return;

        content.innerHTML = '<div class="text-center py-5"><div class="spinner-border text-danger" role="status"></div><p class="mt-3">Cargando...</p></div>';
        const bsModal = bootstrap.Modal.getOrCreateInstance(modal);
        bsModal.show();

        fetch(`${window.URLS.eliminarServicio}${pk}/?modal=1`)
            .then(r => r.text())
            .then(html => { content.innerHTML = html; ejecutarScripts(content); })
            .catch(() => { content.innerHTML = '<div class="alert alert-danger m-3">Error al cargar.</div>'; });
    };

    // ── SWITCH ACTIVO ──
    document.addEventListener('change', function (e) {
        if (!e.target.classList.contains('switch-activo')) return;

        const cb = e.target;
        const id = cb.dataset.id;

        fetch(`${window.URLS.toggleActivo}${id}/`, {
            method : 'POST',
            headers: {
                'X-CSRFToken'     : getCookie('csrftoken'),
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
        .then(r => r.json())
        .then(data => {
            if (data.success) {
                // Sincronizar ambas vistas (grid y list)
                document.querySelectorAll(`.switch-activo[data-id="${id}"]`).forEach(el => {
                    el.checked = data.activo;

                    const card = el.closest('.lib-card');
                    if (card) {
                        const badge = card.querySelector('.lib-card__status');
                        if (badge) {
                            badge.textContent = data.activo ? 'Activo' : 'Inactivo';
                            badge.className   = 'lib-card__status ' + (data.activo ? 'lib-card__status--active' : 'lib-card__status--inactive');
                        }
                        card.dataset.estado = data.activo ? 'activo' : 'inactivo';
                    }

                    const row = el.closest('.lib-row');
                    if (row) row.dataset.estado = data.activo ? 'activo' : 'inactivo';
                });
            } else {
                cb.checked = !cb.checked;
                alert('Error al cambiar el estado.');
            }
        })
        .catch(() => {
            cb.checked = !cb.checked;
            alert('Error de conexión.');
        });
    });

    // ── HELPER: ejecutar scripts inyectados por AJAX ──
    function ejecutarScripts(container) {
        container.querySelectorAll('script').forEach(old => {
            const s = document.createElement('script');
            if (old.src) s.src = old.src;
            else s.textContent = old.textContent;
            old.parentNode.replaceChild(s, old);
        });
    }

});
/* =========================================
   VALIDACION EN TIEMPO REAL - SERVICIOS
========================================= */
(function () {
    const CAMPOS_SERVICIO = ['nombre', 'precio', 'descripcion', 'imagen', 'video', 'activo'];

    function getCookie(name) {
        const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
        return match ? decodeURIComponent(match[2]) : '';
    }

    function getForms(scope = document) {
        return scope.querySelectorAll('#formServicio, #formServicioPage, form[data-servicio-form="1"]');
    }

    function getFieldGroup(field) {
        return field.closest('.mb-3');
    }

    function ensureFieldStructure(field) {
        const group = getFieldGroup(field);
        if (!group) return null;

        let wrapper = field.parentElement;
        if (!wrapper.classList.contains('servicio-input-wrap')) {
            wrapper = document.createElement('div');
            wrapper.className = 'servicio-input-wrap';
            field.parentNode.insertBefore(wrapper, field);
            wrapper.appendChild(field);
        }

        let icon = wrapper.querySelector('.servicio-field-icon');
        if (!icon) {
            icon = document.createElement('span');
            icon.className = 'servicio-field-icon';
            wrapper.appendChild(icon);
        }

        let errorBox = group.querySelector('.servicio-field-error');

        if (!errorBox) {
            const existingError = group.querySelector('.text-danger');
            if (existingError) {
                existingError.classList.add('servicio-field-error');
                existingError.classList.remove('text-danger');
                errorBox = existingError;
            }
        }

        if (!errorBox) {
            errorBox = document.createElement('div');
            errorBox.className = 'servicio-field-error';
            wrapper.insertAdjacentElement('afterend', errorBox);
        }

        return { group, wrapper, icon, errorBox };
    }

    function clearState(field) {
        const parts = ensureFieldStructure(field);
        if (!parts) return;

        const { wrapper, icon, errorBox } = parts;

        wrapper.classList.remove('is-valid', 'is-invalid');
        field.classList.remove('servicio-valid-control', 'servicio-invalid-control');

        icon.innerHTML = '';
        errorBox.innerHTML = '';
        errorBox.classList.remove('is-visible');
    }

    function setValid(field) {
        const parts = ensureFieldStructure(field);
        if (!parts) return;

        const { wrapper, icon, errorBox } = parts;

        wrapper.classList.remove('is-invalid');
        wrapper.classList.add('is-valid');

        field.classList.remove('servicio-invalid-control');
        field.classList.add('servicio-valid-control');

        icon.innerHTML = '<i class="bi bi-check-lg"></i>';

        errorBox.innerHTML = '';
        errorBox.classList.remove('is-visible');
    }

    function setInvalid(field, message) {
        const parts = ensureFieldStructure(field);
        if (!parts) return;

        const { wrapper, icon, errorBox } = parts;

        wrapper.classList.remove('is-valid');
        wrapper.classList.add('is-invalid');

        field.classList.remove('servicio-valid-control');
        field.classList.add('servicio-invalid-control');

        icon.innerHTML = '<i class="bi bi-exclamation-circle-fill"></i>';

        errorBox.innerHTML = message || 'Campo inválido.';
        errorBox.classList.add('is-visible');
    }

    function isEmptyValue(field) {
        if (field.type === 'file') {
            return !(field.files && field.files.length);
        }
        return !(field.value || '').trim();
    }

    function validateField(field, force = false) {
        if (!field || !CAMPOS_SERVICIO.includes(field.name)) return true;

        ensureFieldStructure(field);

        const touched = field.dataset.touched === '1' || force;
        const name = field.name;
        const rawValue = field.type === 'file' ? '' : (field.value || '').trim();

        let valid = true;
        let message = '';

        if (name === 'nombre') {
            if (!rawValue) {
                valid = false;
                message = 'El nombre del servicio es obligatorio.';
            }
        }

        if (name === 'precio') {
            if (!rawValue) {
                valid = false;
                message = 'El precio es obligatorio.';
            } else if (isNaN(Number(rawValue))) {
                valid = false;
                message = 'Ingresa un precio válido.';
            } else if (Number(rawValue) < 0) {
                valid = false;
                message = 'El precio no puede ser negativo.';
            }
        }

        if (name === 'descripcion') {
            if (!rawValue) {
                valid = false;
                message = 'La descripción es obligatoria.';
            }
        }

        if (name === 'activo') {
            if (!field.value) {
                valid = false;
                message = 'Selecciona el estado del servicio.';
            }
        }

        if (name === 'imagen') {
            const file = field.files && field.files[0];
            if (file && file.type && !file.type.startsWith('image/')) {
                valid = false;
                message = 'Debes seleccionar un archivo de imagen válido.';
            }
        }

        if (name === 'video') {
            const file = field.files && field.files[0];
            if (file && file.type && !file.type.startsWith('video/')) {
                valid = false;
                message = 'Debes seleccionar un archivo de video válido.';
            }
        }

        // Al inicio, si el usuario no ha tocado el campo, lo dejamos neutro
        if (!touched && isEmptyValue(field)) {
            clearState(field);
            return false;
        }

        if (valid) {
            setValid(field);
        } else {
            setInvalid(field, message);
        }

        return valid;
    }

    function applyServerErrors(form, errors) {
        if (!errors) return;

        Object.keys(errors).forEach(fieldName => {
            const field = form.querySelector(`[name="${fieldName}"]`);
            if (!field) return;

            const messages = errors[fieldName];
            let firstMessage = 'Campo inválido.';

            if (Array.isArray(messages) && messages.length) {
                firstMessage = messages[0];
            } else if (typeof messages === 'string') {
                firstMessage = messages;
            }

            setInvalid(field, firstMessage);
        });
    }

    function initServicioForms(scope = document) {
        const forms = getForms(scope);

        forms.forEach(form => {
            if (form.dataset.servicioInit === '1') return;
            form.dataset.servicioInit = '1';

            wireServicioGuards(form);

            CAMPOS_SERVICIO.forEach(name => {
                const field = form.querySelector(`[name="${name}"]`);
                if (!field) return;

                ensureFieldStructure(field);

                // Si el campo ya viene con valor cargado en editar, lo valida al iniciar
                if (!isEmptyValue(field) || name === 'activo') {
                    field.dataset.touched = '1';
                    validateField(field, true);
                }

                // Si ya había error renderizado desde Django
                const group = getFieldGroup(field);
                const existingError = group ? group.querySelector('.servicio-field-error') : null;
                if (existingError && existingError.textContent.trim()) {
                    field.dataset.touched = '1';
                    setInvalid(field, existingError.innerHTML);
                }
            });
        });
    }

    document.addEventListener('input', function (e) {
        const field = e.target;
        if (!field.name || !CAMPOS_SERVICIO.includes(field.name)) return;
        if (!field.closest('#formServicio, #formServicioPage, form[data-servicio-form="1"]')) return;

        field.dataset.touched = '1';
        validateField(field);
    });

    document.addEventListener('change', function (e) {
        const field = e.target;
        if (!field.name || !CAMPOS_SERVICIO.includes(field.name)) return;
        if (!field.closest('#formServicio, #formServicioPage, form[data-servicio-form="1"]')) return;

        field.dataset.touched = '1';
        validateField(field);
    });

    document.addEventListener('blur', function (e) {
        const field = e.target;
        if (!field.name || !CAMPOS_SERVICIO.includes(field.name)) return;
        if (!field.closest('#formServicio, #formServicioPage, form[data-servicio-form="1"]')) return;

        field.dataset.touched = '1';
        validateField(field);
    }, true);

    // Submit normal para formulario de página completa
    document.addEventListener('submit', function (e) {
        const form = e.target;
        if (!form.matches('#formServicioPage, form[data-servicio-form="1"]:not(#formServicio)')) return;

        initServicioForms(document);
        wireServicioGuards(form);

        let ok = true;
        CAMPOS_SERVICIO.forEach(name => {
            const field = form.querySelector(`[name="${name}"]`);
            if (!field) return;
            field.dataset.touched = '1';
            if (!validateField(field, true)) ok = false;
        });

        if (!ok) {
            e.preventDefault();
        }
    });

    // Submit AJAX para modal
    document.addEventListener('submit', function (e) {
        const form = e.target;
        if (!form.matches('#formServicio')) return;

        e.preventDefault();
        initServicioForms(document);
        wireServicioGuards(form);

        let ok = true;
        CAMPOS_SERVICIO.forEach(name => {
            const field = form.querySelector(`[name="${name}"]`);
            if (!field) return;
            field.dataset.touched = '1';
            if (!validateField(field, true)) ok = false;
        });

        if (!ok) return;

        const formData = new FormData(form);
        const submitButton = form.querySelector('button[type="submit"]');
        const originalText = submitButton ? submitButton.innerHTML : 'Guardar';

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
        }

        fetch(form.action || window.location.href, {
            method: 'POST',
            body: formData,
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'X-CSRFToken': getCookie('csrftoken'),
            }
        })
        .then(async response => {
            const data = await response.json();
            return { response, data };
        })
        .then(({ response, data }) => {
            if (data.success) {
                const modalEl = document.getElementById('modalFormServicio') || document.getElementById('modalEditarServicio');
                const modalInstance = modalEl ? bootstrap.Modal.getInstance(modalEl) : null;

                if (modalInstance) {
                    modalInstance.hide();
                }

                window.location.reload();
                return;
            }

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }

            if (data.errors) {
                applyServerErrors(form, data.errors);
            } else {
                alert('Error al guardar el servicio. Verifica los campos.');
            }
        })
        .catch(error => {
            console.error('Error:', error);

            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = originalText;
            }

            alert('Ocurrió un error al guardar el servicio.');
        });
    });

    window.initServicioForms = initServicioForms;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            initServicioForms(document);
        });
    } else {
        initServicioForms(document);
    }
})();
