document.addEventListener('DOMContentLoaded', function() {
    
    // ==================== TOGGLE SIDEBAR ====================
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');
    const sidebarHandle = document.getElementById('sidebar-handle');

    if (!sidebar) {
        console.warn('No se encontró #sidebar');
        return;
    }

    let mobileOutsideClickBound = false;

    function openSidebarHover() {
        if (window.innerWidth > 991 && !sidebar.classList.contains('pinned-open')) {
            sidebar.classList.add('expanded-by-hover');
            if (mainContent) {
                mainContent.classList.remove('expanded');
            }
        }
    }

    function closeSidebarHover() {
        if (window.innerWidth > 991 && !sidebar.classList.contains('pinned-open')) {
            sidebar.classList.remove('expanded-by-hover');
            if (mainContent) {
                mainContent.classList.add('expanded');
            }
        }
    }

    function applyDesktopSidebarState() {
        const isPinned = localStorage.getItem('sidebarPinned') === 'true';
        const isCollapsedSaved = localStorage.getItem('sidebarCollapsed');

        sidebar.classList.remove('active');

        if (window.innerWidth <= 991) {
            sidebar.classList.remove('collapsed', 'expanded-by-hover', 'pinned-open');
            if (mainContent) {
                mainContent.classList.remove('expanded');
            }
            return;
        }

        // Estado por defecto: colapsado
        sidebar.classList.add('collapsed');

        if (isPinned) {
            sidebar.classList.add('pinned-open');
            sidebar.classList.remove('expanded-by-hover');
            if (mainContent) {
                mainContent.classList.remove('expanded');
            }
        } else {
            sidebar.classList.remove('pinned-open');
            sidebar.classList.remove('expanded-by-hover');

            // Compatibilidad con tu estado viejo
            if (isCollapsedSaved === 'false') {
                sidebar.classList.add('pinned-open');
                if (mainContent) {
                    mainContent.classList.remove('expanded');
                }
                localStorage.setItem('sidebarPinned', 'true');
            } else {
                if (mainContent) {
                    mainContent.classList.add('expanded');
                }
                localStorage.setItem('sidebarPinned', 'false');
            }
        }
    }

    // Botón viejo, si existe
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', function() {
            if (window.innerWidth <= 991) {
                sidebar.classList.toggle('active');
                return;
            }

            const willBePinned = !sidebar.classList.contains('pinned-open');

            sidebar.classList.add('collapsed');
            sidebar.classList.remove('expanded-by-hover');

            if (willBePinned) {
                sidebar.classList.add('pinned-open');
                if (mainContent) {
                    mainContent.classList.remove('expanded');
                }
                localStorage.setItem('sidebarPinned', 'true');
                localStorage.setItem('sidebarCollapsed', 'false');
            } else {
                sidebar.classList.remove('pinned-open');
                if (mainContent) {
                    mainContent.classList.add('expanded');
                }
                localStorage.setItem('sidebarPinned', 'false');
                localStorage.setItem('sidebarCollapsed', 'true');
            }
        });
    }

    // Nueva pestaña lateral
    if (sidebarHandle) {
        sidebarHandle.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();

            if (window.innerWidth <= 991) {
                sidebar.classList.toggle('active');
                return;
            }

            const willBePinned = !sidebar.classList.contains('pinned-open');

            sidebar.classList.add('collapsed');
            sidebar.classList.remove('expanded-by-hover');

            if (willBePinned) {
                sidebar.classList.add('pinned-open');
                if (mainContent) {
                    mainContent.classList.remove('expanded');
                }
                localStorage.setItem('sidebarPinned', 'true');
                localStorage.setItem('sidebarCollapsed', 'false');
            } else {
                sidebar.classList.remove('pinned-open');
                if (mainContent) {
                    mainContent.classList.add('expanded');
                }
                localStorage.setItem('sidebarPinned', 'false');
                localStorage.setItem('sidebarCollapsed', 'true');
            }
        });
    }

    // Hover para desplegar temporalmente en escritorio
    sidebar.addEventListener('mouseenter', openSidebarHover);
    sidebar.addEventListener('mouseleave', closeSidebarHover);

    // Restaurar estado inicial
    applyDesktopSidebarState();

    // ==================== SIDEBAR RESPONSIVE ====================
    function handleResponsiveSidebar() {
        applyDesktopSidebarState();

        if (window.innerWidth <= 991 && !mobileOutsideClickBound) {
            document.addEventListener('click', function(e) {
                const clickedToggle = sidebarToggle && sidebarToggle.contains(e.target);
                const clickedHandle = sidebarHandle && sidebarHandle.contains(e.target);
                const clickedInsideSidebar = sidebar.contains(e.target);

                if (!clickedInsideSidebar && !clickedToggle && !clickedHandle) {
                    sidebar.classList.remove('active');
                }
            });

            mobileOutsideClickBound = true;
        }
    }
    
    handleResponsiveSidebar();
    window.addEventListener('resize', handleResponsiveSidebar);
    
    // ==================== AUTO-CERRAR ALERTAS ====================
    const alerts = document.querySelectorAll('.alert');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = new bootstrap.Alert(alert);
            bsAlert.close();
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
    document.querySelectorAll('.submenu').forEach(function(submenu) {
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
        searchInput.addEventListener('input', function() {
            const searchTerm = this.value.toLowerCase();
            console.log('Buscando:', searchTerm);
            // Aquí puedes implementar la lógica de búsqueda
        });
    }
    
    // ==================== TOOLTIPS DE BOOTSTRAP ====================
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });
    
    // Confirmaciones (delegadas al modal)
    // Las acciones con atributo `data-confirm` abren el modal y ejecutan la acción al confirmar.
    
    // ==================== FUNCIÓN PARA CARGAR GRÁFICOS ====================
    window.initDashboardChart = function(canvasId, data, options) {
        const ctx = document.getElementById(canvasId);
        if (ctx) {
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
            const bsAlert = new bootstrap.Alert(alertDiv);
            bsAlert.close();
        }, 5000);
    }
}
document.addEventListener("DOMContentLoaded", function () {
    var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl)
    })
});

// Función para confirmar acciones (deprecated)
function confirmAction(message) {
    console.warn('confirmAction() is deprecated. Use data-confirm attributes. Falling back to window.confirm for legacy code.');
    return confirm(message || '¿Estás seguro de realizar esta acción?');
}
document.addEventListener('DOMContentLoaded', function() {
    // Inicializar tooltips de Bootstrap
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    const tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    if (typeof SiennaAccessibility !== 'undefined') {
        SiennaAccessibility.init();
    }
});

// Exportar funciones para uso global
window.showNotification = showNotification;
window.confirmAction = confirmAction;