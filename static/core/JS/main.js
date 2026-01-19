document.addEventListener('DOMContentLoaded', function () {

    /* ===============================
       LOGIN MODAL (NO TOCAR)
    =============================== */
    try {
        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl && window.showLoginModal === true) {
            new bootstrap.Modal(loginModalEl).show();
        }
    } catch (e) {
        console.warn('Login modal no disponible:', e);
    }

    /* ===============================
       ELEMENTOS
    =============================== */
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    const navItems = document.querySelectorAll('.nav-item');
    const logo = document.querySelector('.logo svg');
    const infiniteSection = document.getElementById('infinite');

    /* ===============================
       FUNCIONES
    =============================== */

    function updateHeaderFooter() {
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }

        if (footer) {
            footer.classList.toggle(
                'visible',
                window.scrollY + window.innerHeight >= document.body.scrollHeight - 50
            );
        }
    }

    function isLightColor(rgb) {
        const result = rgb.match(/\d+/g);
        if (!result) return false;

        const r = parseInt(result[0]);
        const g = parseInt(result[1]);
        const b = parseInt(result[2]);

        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 160;
    }

    function updateLogoColor() {
        if (!header || !logo) return;

        const headerRect = header.getBoundingClientRect();
        const x = window.innerWidth / 2;
        const y = headerRect.bottom + 1;

        const elementBehind = document.elementFromPoint(x, y);
        if (!elementBehind) return;

        const bg = window.getComputedStyle(elementBehind).backgroundColor;
        logo.style.color = isLightColor(bg) ? '#000' : '#fff';
    }

    function updateNavbarInfiniteMode() {
        if (!header || !infiniteSection) return;

        const sectionTop = infiniteSection.offsetTop;
        const sectionBottom = sectionTop + infiniteSection.offsetHeight;
        const scrollPos = window.scrollY + window.innerHeight / 2;

        if (scrollPos >= sectionTop && scrollPos <= sectionBottom) {
            header.classList.add('navbar-dark');
            if (logo) logo.style.color = '#000';
        } else {
            header.classList.remove('navbar-dark');
            updateLogoColor();
        }
    }

    /* ===============================
       HOVER NAV
    =============================== */
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-2px)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
        });
    });

    /* ===============================
       MODAL PERMISOS (ELIMINAR)
    =============================== */
    document.querySelectorAll('.btn-eliminar').forEach(btn => {
        btn.addEventListener('click', function (e) {
            const permitido = btn.dataset.permitido === "true";

            if (!permitido) {
                e.preventDefault();
                const modalEl = document.getElementById('permisoModal');
                if (modalEl) {
                    new bootstrap.Modal(modalEl).show();
                }
            }
        });
    });

    /* ===============================
       MODAL ERROR PERMISOS
    =============================== */
    if (window.tieneErrorPermiso === true) {
        const modalEl = document.getElementById("modalAccionNoPermitida");
        if (modalEl) {
            document.getElementById("modalPermisoMensaje").textContent =
                window.mensajePermiso || "No tienes permiso para realizar esta acción.";

            new bootstrap.Modal(modalEl).show();
        }
    }

    /* ===============================
       EVENTOS OPTIMIZADOS
    =============================== */
    function onScroll() {
        updateHeaderFooter();
        updateNavbarInfiniteMode();
        updateLogoColor();
    }

    window.addEventListener('scroll', onScroll);
    window.addEventListener('load', onScroll);
    window.addEventListener('resize', onScroll);

});
