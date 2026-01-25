<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {

    /* ======================================================
       ELEMENTOS PRINCIPALES DEL DOM
    ====================================================== */
=======
console.log("✅ main.js cargado");

/* ======================================================
   DOM READY – UI GENERAL
====================================================== */
document.addEventListener('DOMContentLoaded', function () {

    /* LOGIN MODAL (NO TOCAR) */
    try {
        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl && window.showLoginModal === true) {
            new bootstrap.Modal(loginModalEl).show();
        }
    } catch (e) {
        console.warn('Login modal no disponible:', e);
    }

    /* UI GENERAL */
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    const navItems = document.querySelectorAll('.nav-item');
    const logo = document.querySelector('.logo svg');
    const infiniteSection = document.getElementById('infinite');
<<<<<<< HEAD
=======

    function updateHeaderFooter() {
        if (header) header.classList.toggle('scrolled', window.scrollY > 50);
        if (footer) {
            footer.classList.toggle(
                'visible',
                window.scrollY + window.innerHeight >= document.body.scrollHeight - 50
            );
        }
    }
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0

    /* ======================================================
       LOGIN MODAL (NO TOCAR)
       Muestra el modal de login si viene forzado desde backend
    ====================================================== */
    try {
        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl && window.showLoginModal === true) {
            new bootstrap.Modal(loginModalEl).show();
        }
    } catch (e) {
        console.warn('Login modal no disponible:', e);
    }

    /* ======================================================
       FUNCIONES AUXILIARES
    ====================================================== */

    // Determina si un color RGB es claro u oscuro
    function isLightColor(rgb) {
        const result = rgb.match(/\d+/g);
        if (!result) return false;
<<<<<<< HEAD

        const r = parseInt(result[0]);
        const g = parseInt(result[1]);
        const b = parseInt(result[2]);

        // Fórmula de luminancia
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 160;
=======
        const [r, g, b] = result.map(Number);
        return (r * 299 + g * 587 + b * 114) / 1000 > 160;
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    }

    /* ======================================================
       CAMBIO DINÁMICO DEL COLOR DEL LOGO
       Según el fondo que esté detrás del header
    ====================================================== */
    function updateLogoColor() {
        if (!header || !logo) return;
<<<<<<< HEAD

        const headerRect = header.getBoundingClientRect();

        // Punto justo debajo del header
        const x = window.innerWidth / 2;
        const y = headerRect.bottom + 1;

        const elementBehind = document.elementFromPoint(x, y);
        if (!elementBehind) return;

        const bg = window.getComputedStyle(elementBehind).backgroundColor;

        if (isLightColor(bg)) {
            logo.style.color = '#000';
        } else {
            logo.style.color = '#fff';
        }
    }

    /* ======================================================
       HEADER SCROLL + FOOTER VISIBLE AL FINAL
    ====================================================== */
    function updateHeaderFooter() {
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }
=======
        const rect = header.getBoundingClientRect();
        const el = document.elementFromPoint(window.innerWidth / 2, rect.bottom + 1);
        if (!el) return;
        logo.style.color =
            isLightColor(getComputedStyle(el).backgroundColor) ? '#000' : '#fff';
    }
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0

        if (footer) {
            footer.classList.toggle(
                'visible',
                window.scrollY + window.innerHeight >= document.body.scrollHeight - 50
            );
        }
    }

    /* ======================================================
       NAVBAR OSCURO FORZADO EN SECCIÓN "INFINITE"
    ====================================================== */
    function updateNavbarInfiniteMode() {
        if (!header || !infiniteSection) return;
        const mid = window.scrollY + window.innerHeight / 2;
        const top = infiniteSection.offsetTop;
        const bottom = top + infiniteSection.offsetHeight;

<<<<<<< HEAD
        const sectionTop = infiniteSection.offsetTop;
        const sectionBottom = sectionTop + infiniteSection.offsetHeight;
        const scrollPos = window.scrollY + window.innerHeight / 2;

        if (scrollPos >= sectionTop && scrollPos <= sectionBottom) {
            // Dentro de infinite
            header.classList.add('navbar-dark');

            if (logo) {
                logo.style.color = '#000';
            }
=======
        if (mid >= top && mid <= bottom) {
            header.classList.add('navbar-dark');
            if (logo) logo.style.color = '#000';
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
        } else {
            header.classList.remove('navbar-dark');
            updateLogoColor();
        }
    }

<<<<<<< HEAD
    /* ======================================================
       EFECTO HOVER SUAVE EN NAV ITEMS
    ====================================================== */
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-2px)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
        });
    });

    /* ======================================================
       MODAL DE PERMISOS (ELIMINAR)
    ====================================================== */
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

    /* ======================================================
       MODAL ERROR DE PERMISOS (BACKEND)
    ====================================================== */
    if (window.tieneErrorPermiso === true) {
        const modalEl = document.getElementById("modalAccionNoPermitida");

        if (modalEl) {
            document.getElementById("modalPermisoMensaje").textContent =
                window.mensajePermiso || "No tienes permiso para realizar esta acción.";
            new bootstrap.Modal(modalEl).show();
        }
    }

    /* ======================================================
       EVENTOS OPTIMIZADOS
    ====================================================== */
=======
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => item.style.transform = 'translateY(-2px)');
        item.addEventListener('mouseleave', () => item.style.transform = 'translateY(0)');
    });

>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
    function onScroll() {
        updateHeaderFooter();
        updateNavbarInfiniteMode();
        updateLogoColor();
    }

    window.addEventListener('scroll', onScroll);
    window.addEventListener('load', onScroll);
    window.addEventListener('resize', onScroll);
<<<<<<< HEAD
});
=======
    
});


/* ======================================================
   🚫 BLOQUE ÚNICO – ELIMINAR (ADMIN vs NO ADMIN)
====================================================== */
document.addEventListener('click', function (e) {

    const btn = e.target.closest('.btn-eliminar');
    if (!btn) return;

    // ✅ ADMIN → deja seguir normal (POST)
    if (window.ES_ADMIN === true) return;

    // ❌ NO ADMIN → bloquear
    e.preventDefault();
    e.stopPropagation();

    const modal = document.getElementById('modalAccionNoPermitida');
    if (!modal) return;

    const instancia = new bootstrap.Modal(modal);
    instancia.show();
});


/* ======================================================
   ⏱️ BARRA + AUTO CIERRE + LIMPIEZA TELÓN
====================================================== */
const modalPermiso = document.getElementById('modalAccionNoPermitida');

if (modalPermiso) {
    modalPermiso.addEventListener('shown.bs.modal', () => {

        const barra = document.getElementById('barraTiempoPermiso');

        if (barra) {
            barra.style.animation = 'none';
            barra.offsetHeight;
            barra.style.animation = 'cerrarModal 3.5s linear forwards';
        }

        setTimeout(() => {
            const instancia = bootstrap.Modal.getInstance(modalPermiso);
            if (instancia) instancia.hide();

            //  elimina backdrop residual
            document.querySelectorAll('.modal-backdrop')
                .forEach(b => b.remove());

            document.body.classList.remove('modal-open');
        }, 3500);
    });
}
>>>>>>> 06e72bdde3f106e63fc137f0d7ccb9d952511fe0
