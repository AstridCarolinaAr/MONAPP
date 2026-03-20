console.log('ARCHIVO NUEVO REAL');

document.addEventListener('DOMContentLoaded', function () {
    initSidebar();
    initAlerts();
    initActiveLinks();
    initTooltips();
    initAccessibility();
    initDashboardChart();
    initAjaxFilterForms();
    initSearchToggle();
    initSmartFormValidation();

    console.log('Dashboard inicializado correctamente');
});
// ==================== SIDEBAR ====================
function initSidebar() {
    const sidebarHandle = document.getElementById('sidebar-handle');
    const sidebar = document.getElementById('sidebar');
    const mainContent = document.getElementById('main-content');

    if (!sidebar || !mainContent) return;

    function toggleSidebar() {
        if (window.innerWidth <= 991) {
            sidebar.classList.toggle('active');
            document.body.classList.toggle('sidebar-mobile-open', sidebar.classList.contains('active'));
            return;
        }

        sidebar.classList.toggle('collapsed');
        mainContent.classList.toggle('expanded');

        const isCollapsed = sidebar.classList.contains('collapsed');
        document.body.classList.toggle('sidebar-collapsed', isCollapsed);
        localStorage.setItem('sidebarCollapsed', isCollapsed);
    }

    if (sidebarHandle) {
        sidebarHandle.addEventListener('click', function (e) {
            e.stopPropagation();
            toggleSidebar();
        });
    }

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
        if (sidebar.contains(e.target) || (sidebarHandle && sidebarHandle.contains(e.target))) return;

        sidebar.classList.remove('active');
        document.body.classList.remove('sidebar-mobile-open');
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
        if (wrapper.dataset.searchInit === 'true') return;
        wrapper.dataset.searchInit = 'true';

        const btn = wrapper.querySelector('.btn-search-toggle');
        const box = wrapper.querySelector('.search-toggle-box');
        const input = wrapper.querySelector('.search-toggle-input');
        const form = wrapper.closest('form');

        if (!btn || !box || !input || !form) return;

        function openSearch() {
            wrapper.classList.add('is-open');
            box.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');

            setTimeout(function () {
                input.focus();
                const len = input.value.length;
                input.setSelectionRange(len, len);
            }, 120);
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
            }, 380);
        }

        function submitSearch(immediate = false) {
            if (typeof form._submitAjaxSearch === 'function') {
                form._submitAjaxSearch(immediate);
            } else {
                form.submit();
            }
        }

        if (input.value.trim()) {
            openSearch();
        }

        btn.addEventListener('click', function (e) {
            e.preventDefault();
            e.stopPropagation();

            animateButton();

            if (!wrapper.classList.contains('is-open')) {
                openSearch();
                return;
            }

            if (input.value.trim()) {
                submitSearch(true);
                return;
            }

            closeSearch();
        });

        input.addEventListener('click', function (e) {
            e.stopPropagation();
        });

        input.addEventListener('focus', function () {
            openSearch();
        });

        input.addEventListener('input', function () {
            wrapper.classList.add('is-open');
            box.classList.add('is-open');
            btn.setAttribute('aria-expanded', 'true');
            submitSearch(false);
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                submitSearch(true);
            }

            if (e.key === 'Escape') {
                e.preventDefault();

                if (input.value.trim()) {
                    input.value = '';
                    submitSearch(true);
                } else {
                    closeSearch();
                }
            }
        });

        document.addEventListener('click', function (e) {
            if (!wrapper.classList.contains('is-open')) return;
            if (wrapper.contains(e.target)) return;

            if (!input.value.trim()) {
                closeSearch();
            }
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
function initAjaxFilterForms() {
    const forms = document.querySelectorAll('.js-ajax-search-form');

    forms.forEach(function (form) {
        if (form.dataset.ajaxFormInit === 'true') return;
        form.dataset.ajaxFormInit = 'true';

        const ajaxUrl = form.dataset.ajaxUrl || form.getAttribute('action') || window.location.pathname;
        const ajaxTargetSelector = form.dataset.ajaxTarget;
        const ajaxDebounce = parseInt(form.dataset.ajaxDebounce || '300', 10);

        let debounceTimer = null;
        let activeController = null;
        let lastQueryString = null;

        async function runAjaxRequest() {
            const target = document.querySelector(ajaxTargetSelector);

            if (!target) {
                form.submit();
                return;
            }

            const formData = new FormData(form);
            const params = new URLSearchParams(formData);
            const queryString = params.toString();
            const url = `${ajaxUrl}?${queryString}`;

            if (queryString === lastQueryString) return;
            lastQueryString = queryString;

            if (activeController) {
                activeController.abort();
            }

            activeController = new AbortController();

            try {
                target.classList.remove('is-entering', 'is-ready');
                target.classList.add('is-loading');

                const response = await fetch(url, {
                    method: 'GET',
                    credentials: 'same-origin',
                    headers: {
                        'X-Requested-With': 'XMLHttpRequest'
                    },
                    signal: activeController.signal
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const html = await response.text();

                target.classList.remove('is-loading');
                target.classList.add('is-entering');

                requestAnimationFrame(function () {
                    target.innerHTML = html;

                    requestAnimationFrame(function () {
                        target.classList.remove('is-entering');
                        target.classList.add('is-ready');
                    });
                });

                if (window.history && window.history.replaceState) {
                    window.history.replaceState({}, '', url);
                }

                if (typeof initTooltips === 'function') {
                    initTooltips();
                }

                if (typeof initSmartFormValidation === 'function') {
                    initSmartFormValidation(target);
                }
            } catch (error) {
                if (error.name === 'AbortError') return;

                console.error('Error en filtros AJAX:', error);
                target.classList.remove('is-loading', 'is-entering');
                target.classList.add('is-ready');
                form.submit();
            }
        }

        function submitAjaxForm(immediate = false) {
            clearTimeout(debounceTimer);

            if (immediate) {
                runAjaxRequest();
                return;
            }

            debounceTimer = setTimeout(runAjaxRequest, ajaxDebounce);
        }

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            submitAjaxForm(true);
        });

        form.querySelectorAll('select, input[type="date"]').forEach(function (field) {
            field.addEventListener('change', function () {
                submitAjaxForm(true);
            });
        });

        form._submitAjaxSearch = submitAjaxForm;
    });
}

function initSmartFormValidation(root = document) {
    const fields = root.querySelectorAll(
        'form input:not([type="hidden"]):not([type="checkbox"]):not([type="radio"]):not([type="file"]), form textarea'
    );

    fields.forEach(function (field) {
        if (field.dataset.validationBound === 'true') return;
        if (field.disabled || field.readOnly) return;

        const rule = resolveValidationRule(field);
        if (!rule) return;

        field.dataset.validationBound = 'true';
        field.dataset.validate = field.dataset.validate || rule;

        field.addEventListener('beforeinput', function (event) {
            if (!event.data || event.inputType && !event.inputType.startsWith('insert')) return;

            const nextValue = buildNextValue(field, event.data);
            if (isValueAllowed(nextValue, rule, field)) return;

            event.preventDefault();
            triggerFieldShake(field);
        });

        field.addEventListener('paste', function (event) {
            const pastedText = (event.clipboardData || window.clipboardData).getData('text');
            const nextValue = buildNextValue(field, pastedText);

            if (isValueAllowed(nextValue, rule, field)) return;

            event.preventDefault();
            triggerFieldShake(field);
        });

        field.addEventListener('input', function () {
            const sanitized = sanitizeValue(field.value, rule, field);
            if (sanitized === field.value) return;

            const cursor = field.selectionStart;
            field.value = sanitized;
            if (typeof cursor === 'number') {
                const nextCursor = Math.max(0, Math.min(sanitized.length, cursor - 1));
                field.setSelectionRange(nextCursor, nextCursor);
            }
            triggerFieldShake(field);
        });
    });
}

function resolveValidationRule(field) {
    if (field.dataset.validate) return field.dataset.validate;

    const type = (field.getAttribute('type') || '').toLowerCase();
    const signature = [
        field.name || '',
        field.id || '',
        field.placeholder || '',
        getFieldLabelText(field),
    ].join(' ').toLowerCase();

    if (['email', 'password', 'url', 'date', 'datetime-local', 'time'].includes(type)) {
        return null;
    }

    if (/correo|email/.test(signature)) return null;
    if (/password|contrasena|contraseña/.test(signature)) return null;
    if (/url|sitio web|pagina web|página web/.test(signature)) return null;
    if (/documento/.test(signature) && /usuario|username/.test(signature)) return 'alnum';

    if (type === 'number') {
        return allowsDecimal(field) ? 'decimal' : 'numeric';
    }

    if (/precio|total|saldo|anticipo|descuento|porcentaje|valor|monto|costo/.test(signature)) {
        return 'decimal';
    }

    if (/documento|cedula|cédula|nit|telefono|teléfono|celular|cantidad|stock|codigo|código|numero|número/.test(signature)) {
        return 'numeric';
    }

    if (/nombre/.test(signature) && /producto|servicio|promocion|promoción|web/.test(signature)) {
        return 'alnum';
    }

    if (/nombre|nombres|apellido|apellidos|marca|linea|línea|rol|cargo/.test(signature)) {
        return 'alpha';
    }

    if (/direccion|dirección|descripcion|descripción|observacion|observación|motivo|detalle|presentacion|presentación|placa|usuario|referencia|procedimiento|recomendacion|recomendación|medicamento|frecuencia/.test(signature)) {
        return 'alnum';
    }

    if (field.tagName === 'TEXTAREA') {
        return 'text';
    }

    return 'text';
}

function getFieldLabelText(field) {
    if (field.labels && field.labels.length) {
        return Array.from(field.labels).map(function (label) {
            return label.textContent || '';
        }).join(' ');
    }

    if (!field.id) return '';

    const label = document.querySelector('label[for="' + field.id + '"]');
    return label ? label.textContent || '' : '';
}

function buildNextValue(field, insertedText) {
    const start = typeof field.selectionStart === 'number' ? field.selectionStart : field.value.length;
    const end = typeof field.selectionEnd === 'number' ? field.selectionEnd : field.value.length;
    return field.value.slice(0, start) + insertedText + field.value.slice(end);
}

function allowsDecimal(field) {
    const step = String(field.getAttribute('step') || '').trim();
    return step && step !== '1';
}

function isValueAllowed(value, rule, field) {
    if (!value) return true;

    if (rule === 'numeric') {
        return /^[0-9]+$/.test(value);
    }

    if (rule === 'decimal') {
        const normalized = value.replace(/,/g, '.');
        if (!/^[0-9]+(\.[0-9]*)?$/.test(normalized)) return false;

        const decimals = normalized.includes('.') ? normalized.split('.')[1].length : 0;
        const step = String(field.getAttribute('step') || '').trim();
        if (step === '0.01' && decimals > 2) return false;
        return true;
    }

    if (rule === 'alpha') {
        return /^[\p{L}\s]+$/u.test(value);
    }

    if (rule === 'alnum') {
        return /^[\p{L}0-9\s]+$/u.test(value);
    }

    if (rule === 'text') {
        return /^[\p{L}0-9\s\n]+$/u.test(value);
    }

    return true;
}

function sanitizeValue(value, rule, field) {
    if (!value) return value;

    if (rule === 'numeric') {
        return value.replace(/[^0-9]/g, '');
    }

    if (rule === 'decimal') {
        let normalized = value.replace(/,/g, '.').replace(/[^0-9.]/g, '');
        const firstDotIndex = normalized.indexOf('.');
        if (firstDotIndex !== -1) {
            normalized =
                normalized.slice(0, firstDotIndex + 1) +
                normalized.slice(firstDotIndex + 1).replace(/\./g, '');
        }

        const step = String(field.getAttribute('step') || '').trim();
        if (step === '0.01' && normalized.includes('.')) {
            const parts = normalized.split('.');
            normalized = parts[0] + '.' + parts[1].slice(0, 2);
        }

        return normalized;
    }

    if (rule === 'alpha') {
        return Array.from(value).filter(function (char) {
            return /[\p{L}\s]/u.test(char);
        }).join('');
    }

    if (rule === 'alnum') {
        return Array.from(value).filter(function (char) {
            return /[\p{L}0-9\s]/u.test(char);
        }).join('');
    }

    if (rule === 'text') {
        return Array.from(value).filter(function (char) {
            return /[\p{L}0-9\s\n]/u.test(char);
        }).join('');
    }

    return value;
}

function triggerFieldShake(field) {
    field.classList.remove('field-validation-shake');
    void field.offsetWidth;
    field.classList.add('field-validation-shake');
}
