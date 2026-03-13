/* =============================================================
   SIDEBAR HANDLE — panel_admin_base.js
   Pega este bloque en tu archivo panel_admin_base.js
   (o reemplaza la lógica de sidebar que ya tengas)
   ============================================================= */

document.addEventListener('DOMContentLoaded', function () {

    const sidebar     = document.getElementById('sidebar');
    const handle      = document.getElementById('sidebar-handle');
    const mainContent = document.getElementById('main-content');
    const body        = document.body;

    if (!sidebar || !handle) return;

    /* ── Leer estado guardado ── */
    const STORAGE_KEY = 'sidebar_collapsed';
    const wasCollapsed = localStorage.getItem(STORAGE_KEY) === 'true';

    /* ── Aplicar estado inicial ── */
    function applyState(collapsed, animate) {
        if (!animate) {
            sidebar.style.transition  = 'none';
            handle.style.transition   = 'none';
            if (mainContent) mainContent.style.transition = 'none';
        }

        if (collapsed) {
            sidebar.classList.add('collapsed');
            sidebar.classList.remove('pinned-open');
            body.classList.add('sidebar-collapsed');
            if (mainContent) mainContent.classList.add('expanded');
        } else {
            sidebar.classList.remove('collapsed');
            body.classList.remove('sidebar-collapsed');
            if (mainContent) mainContent.classList.remove('expanded');
        }

        if (!animate) {
            /* Forzar reflow antes de restaurar la transición */
            void sidebar.offsetWidth;
            sidebar.style.transition  = '';
            handle.style.transition   = '';
            if (mainContent) mainContent.style.transition = '';
        }
    }

    /* Aplica sin animación en la carga (evita el "salto" visual) */
    applyState(wasCollapsed, false);

    /* ── Toggle al hacer clic en el handle ── */
    handle.addEventListener('click', function () {
        const isCollapsed = sidebar.classList.contains('collapsed');
        applyState(!isCollapsed, true);                 /* ahora sí con animación */
        localStorage.setItem(STORAGE_KEY, String(!isCollapsed));
    });

    /* ── Móvil: clic fuera del sidebar lo cierra ── */
    document.addEventListener('click', function (e) {
        if (window.innerWidth > 991) return;
        if (!sidebar.contains(e.target) && e.target !== handle && !handle.contains(e.target)) {
            sidebar.classList.remove('active');
            body.classList.remove('sidebar-mobile-open');
        }
    });

});