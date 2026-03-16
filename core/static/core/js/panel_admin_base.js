document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebarHandle = document.getElementById('sidebar-handle');
    const mainContent = document.getElementById('main-content');

    if (!sidebar || !mainContent) {
        console.warn('No se encontró sidebar o main-content');
        return;
    }

    const DESKTOP_BREAKPOINT = 991;

    function isMobile() {
        return window.innerWidth <= DESKTOP_BREAKPOINT;
    }

    function syncMainContent() {
        if (isMobile()) {
            mainContent.classList.remove('expanded');
            return;
        }

        if (sidebar.classList.contains('pinned-open')) {
            mainContent.classList.remove('expanded');
        } else {
            mainContent.classList.add('expanded');
        }
    }

    function updateHandleIcon() {
        if (!sidebarHandle) return;

        const icon = sidebarHandle.querySelector('i');
        if (!icon) return;

        if (isMobile()) {
            if (sidebar.classList.contains('active')) {
                icon.className = 'bi bi-chevron-left';
            } else {
                icon.className = 'bi bi-chevron-right';
            }
            return;
        }

        if (sidebar.classList.contains('pinned-open')) {
            icon.className = 'bi bi-chevron-left';
        } else {
            icon.className = 'bi bi-chevron-right';
        }
    }

    function applySidebarState() {
        const isPinned = localStorage.getItem('sidebarPinned') === 'true';

        if (isMobile()) {
            sidebar.classList.remove('pinned-open');
            sidebar.classList.remove('collapsed');
            sidebar.classList.remove('expanded-by-hover');
            mainContent.classList.remove('expanded');
            updateHandleIcon();
            return;
        }

        sidebar.classList.remove('active');
        sidebar.classList.add('collapsed');
        sidebar.classList.remove('expanded-by-hover');

        if (isPinned) {
            sidebar.classList.add('pinned-open');
        } else {
            sidebar.classList.remove('pinned-open');
        }

        syncMainContent();
        updateHandleIcon();
    }

    function toggleSidebar() {
        if (isMobile()) {
            sidebar.classList.toggle('active');
            updateHandleIcon();
            return;
        }

        const isOpen = sidebar.classList.contains('pinned-open');

        sidebar.classList.add('collapsed');
        sidebar.classList.remove('expanded-by-hover');

        if (isOpen) {
            sidebar.classList.remove('pinned-open');
            localStorage.setItem('sidebarPinned', 'false');
        } else {
            sidebar.classList.add('pinned-open');
            localStorage.setItem('sidebarPinned', 'true');
        }

        syncMainContent();
        updateHandleIcon();
    }

    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }

    if (sidebarHandle) {
        sidebarHandle.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();
            toggleSidebar();
        });
    }

    document.addEventListener('click', function (e) {
        if (!isMobile()) return;

        const clickedInsideSidebar = sidebar.contains(e.target);
        const clickedHandle = sidebarHandle && sidebarHandle.contains(e.target);
        const clickedToggle = sidebarToggle && sidebarToggle.contains(e.target);

        if (!clickedInsideSidebar && !clickedHandle && !clickedToggle) {
            sidebar.classList.remove('active');
            updateHandleIcon();
        }
    });

    window.addEventListener('resize', applySidebarState);

    applySidebarState();

    // ==================== AUTO-CERRAR ALERTAS ====================
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    });

    // ==================== MARCAR LINK ACTIVO EN SIDEBAR ====================
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');

    navLinks.forEach(link => {
        if (link.getAttribute('href') === currentPath) {
            link.classList.add('active');
        }
    });

    // ==================== AUTO-EXPANDIR SUBMENÚ SI HIJO ACTIVO ====================
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

    // ==================== BÚSQUEDA EN TIEMPO REAL ====================
    const searchInput = document.querySelector('.search-box input');
    if (searchInput) {
        searchInput.addEventListener('input', function () {
            const searchTerm = this.value.toLowerCase();
            console.log('Buscando:', searchTerm);
        });
    }

    // ==================== TOOLTIPS DE BOOTSTRAP ====================
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        if (typeof bootstrap !== 'undefined' && bootstrap.Tooltip) {
            new bootstrap.Tooltip(tooltipTriggerEl);
        }
    });

    // ==================== FUNCIÓN PARA CARGAR GRÁFICOS ====================
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

    console.log('Dashboard inicializado correctamente');
});

// ==================== FUNCIONES GLOBALES ====================

// Función para mostrar notificaciones
function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.role = 'alert';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;

    const messagesContainer = document.querySelector('.messages-container') || document.querySelector('.content-wrapper');
    if (messagesContainer) {
        messagesContainer.insertBefore(alertDiv, messagesContainer.firstChild);

        setTimeout(() => {
            if (typeof bootstrap !== 'undefined' && bootstrap.Alert) {
                const bsAlert = new bootstrap.Alert(alertDiv);
                bsAlert.close();
            }
        }, 5000);
    }
}

// Función para confirmar acciones
function confirmAction(message) {
    return confirm(message || '¿Estás seguro de realizar esta acción?');
}

// Exportar funciones para uso global
window.showNotification = showNotification;
window.confirmAction = confirmAction;