console.log('ARCHIVO NUEVO REAL');
document.addEventListener('DOMContentLoaded', function () {
    initSidebar();
    initAlerts();
    initActiveLinks();
    initTooltips();
    initAccessibility();
    initDashboardChart();
    initSearchToggle();

    console.log('Dashboard inicializado correctamente');
});

// ==================== SIDEBAR ====================
function initSidebar() {
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (!sidebar || !mainContent || !sidebarToggle) return;

    sidebarToggle.addEventListener('click', function (e) {
        e.stopPropagation();

        if (window.innerWidth <= 991) {
            sidebar.classList.toggle('active');
        } else {
            sidebar.classList.toggle('collapsed');
            mainContent.classList.toggle('expanded');

            const isCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isCollapsed);
        }
    });

    // ── Conectar el handle (flecha lateral) ──
    if (handle) {
        handle.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // ── Conectar botón del topbar  ──
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }

    // ── Restaurar estado guardado ──
    // Default: sidebar abierto. Solo colapsar si el usuario lo cerró manualmente.
    const sidebarCollapsed = localStorage.getItem('sidebarCollapsed');
    if (sidebarCollapsed === 'true' && window.innerWidth > 991) {
        sidebar.classList.add('collapsed');
        mainContent.classList.add('expanded');
        document.body.classList.add('sidebar-collapsed');
    } else {
        // Asegurar que empiece abierto (quitar cualquier clase residual)
        sidebar.classList.remove('collapsed');
        mainContent.classList.remove('expanded');
        document.body.classList.remove('sidebar-collapsed');
        localStorage.setItem('sidebarCollapsed', 'false');
    }

    document.addEventListener('click', function (e) {
        if (window.innerWidth > 991) return;
        if (!sidebar.classList.contains('active')) return;
        if (sidebar.contains(e.target) || sidebarToggle.contains(e.target)) return;

        sidebar.classList.remove('active');
    });
}

// ==================== ALERTAS ====================
function initAlerts() {
    const alerts = document.querySelectorAll('.alert');

    alerts.forEach(function (alert) {
        setTimeout(function () {
            if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    });
}

// ==================== LINK ACTIVO ====================
function initActiveLinks() {
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');

    navLinks.forEach(function (link) {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    document.querySelectorAll('.submenu').forEach(function (submenu) {
        const activeChild = submenu.querySelector('.nav-link.active');
        if (activeChild) {
            submenu.classList.add('show');
            const toggle = submenu.previousElementSibling;
            if (toggle) {
                toggle.setAttribute('aria-expanded', 'true');
                toggle.classList.add('active');
            }
        }
    });
}

// ==================== TOOLTIPS ====================
function initTooltips() {
    if (typeof bootstrap === 'undefined' || !bootstrap.Tooltip) return;

    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(function (el) {
        new bootstrap.Tooltip(el);
    });
}

// ==================== ACCESIBILIDAD ====================
function initAccessibility() {
    if (typeof SiennaAccessibility !== 'undefined') {
        SiennaAccessibility.init();
    }
}

// ==================== CHART ====================
function initDashboardChart() {
    window.initDashboardChart = function (canvasId, data, options) {
        const ctx = document.getElementById(canvasId);
        if (ctx && typeof Chart !== 'undefined') {
            new Chart(ctx, {
                type: data.type || 'bar',
                data: data,
                options: options || {}
            });
        }
    };
}
// =========================
// TOGGLE BÚSQUEDA GLOBAL
// =========================
function initSearchToggle() {
    const wrappers = document.querySelectorAll('.search-toggle-wrapper');
    console.log('buscadores encontrados:', wrappers.length);

    wrappers.forEach(function (wrapper) {
        const btn = wrapper.querySelector('.btn-search-toggle');
        const box = wrapper.querySelector('.search-toggle-box');
        const input = wrapper.querySelector('.search-toggle-input');

        if (!btn || !box || !input) return;

        function openSearch() {
            wrapper.classList.add('is-open');
            box.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');

            setTimeout(function () {
                input.focus();
                const len = input.value.length;
                input.setSelectionRange(len, len);
            }, 200);
        }

        function closeSearch() {
            wrapper.classList.remove('is-open');
            box.classList.remove('is-open');
            btn.setAttribute('aria-expanded', 'false');
        }

        function animateButton() {
            btn.classList.add('rotating');
            setTimeout(function () {
                btn.classList.remove('rotating');
            }, 600);
        }

        // Si ya viene con texto desde Django
        if (input.value.trim()) {
            openSearch();
        }

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            animateButton();

            if (wrapper.classList.contains('is-open')) {
                if (!input.value.trim()) {
                    closeSearch();
                } else {
                    input.focus();
                }
            } else {
                openSearch();
            }
        });

        input.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        input.addEventListener('input', function () {
            if (input.value.trim()) {
                wrapper.classList.add('is-open');
                box.classList.add('is-open');
                btn.setAttribute('aria-expanded', 'true');
            }
        });

        document.addEventListener('click', function (e) {
            if (!wrapper.classList.contains('is-open')) return;
            if (wrapper.contains(e.target)) return;
            if (input.value.trim()) return;

            closeSearch();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key !== 'Escape') return;
            if (!wrapper.classList.contains('is-open')) return;
            if (input.value.trim()) return;

            closeSearch();
        });
    });
}

// ==================== FUNCIONES GLOBALES ====================
function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const messagesContainer =
        document.querySelector('.messages-container') ||
        document.querySelector('.content-wrapper');

    if (messagesContainer) {
        messagesContainer.insertBefore(alertDiv, messagesContainer.firstChild);

        setTimeout(function () {
            if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                const bsAlert = new bootstrap.Alert(alertDiv);
                bsAlert.close();
            }
        }, 5000);
    }
}

function confirmAction(message) {
    console.warn('confirmAction() is deprecated. Use data-confirm attributes. Falling back to window.confirm for legacy code.');
    return confirm(message || '¿Estás seguro de realizar esta acción?');
}

window.showNotification = showNotification;
window.confirmAction = confirmAction;