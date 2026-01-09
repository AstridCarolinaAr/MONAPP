document.addEventListener('DOMContentLoaded', function () {

    // ===============================
    // MODAL LOGIN (mensajes / errores)
    // ===============================
    try {
        if (typeof bootstrap !== 'undefined') {
            const loginModalEl = document.getElementById('loginModal');

            if (loginModalEl) {
                // Estas variables vienen desde Django template
                // Se evalúan antes de servir el JS
                if (window.showLoginModal === true) {
                    const modal = new bootstrap.Modal(loginModalEl);
                    modal.show();
                }
            }
        }
    } catch (e) {
        console.warn('Login modal no disponible:', e);
    }

    // ===============================
    // ELEMENTOS GENERALES
    // ===============================
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    const navItems = document.querySelectorAll('.nav-item');

    // ===============================
    // SCROLL HEADER + FOOTER
    // ===============================
    window.addEventListener('scroll', () => {

        // HEADER: efecto al hacer scroll
        if (header) {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        }

        // FOOTER: visible al llegar al final
        if (footer) {
            if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 50) {
                footer.classList.add('visible');
            } else {
                footer.classList.remove('visible');
            }
        }
    });

    // ===============================
    // HOVER SUAVE EN ITEMS DEL NAV
    // ===============================
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-2px)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
        });
    });

});
