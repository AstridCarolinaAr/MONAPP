document.addEventListener('DOMContentLoaded', function () {

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