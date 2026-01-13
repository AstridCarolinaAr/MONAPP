document.addEventListener('DOMContentLoaded', function () {

    /* ===============================
       MODAL LOGIN
    =============================== */
    try {
        const loginModalEl = document.getElementById('loginModal');
        if (loginModalEl && window.showLoginModal === true) {
            const modal = new bootstrap.Modal(loginModalEl);
            modal.show();
        }
    } catch (e) {
        console.warn('Login modal no disponible:', e);
    }

    /* ===============================
       MODAL PERMISOS (SOLO ELIMINAR)
    =============================== */
const botonesEliminar = document.querySelectorAll('.btn-eliminar');

botonesEliminar.forEach(btn => {
    btn.addEventListener('click', function (e) {

        const permitido = btn.dataset.permitido === "true";

        if (!permitido) {
            e.preventDefault(); // 

            const modalEl = document.getElementById('permisoModal');
            if (modalEl) {
                const modal = new bootstrap.Modal(modalEl);
                modal.show();
            }
        }

    });
});


    /* ===============================
       HEADER + FOOTER SCROLL
    =============================== */
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');

    window.addEventListener('scroll', () => {
        if (header) {
            header.classList.toggle('scrolled', window.scrollY > 50);
        }

        if (footer) {
            footer.classList.toggle(
                'visible',
                window.scrollY + window.innerHeight >= document.body.scrollHeight - 50
            );
        }
    });

    /* ===============================
       HOVER NAV
    =============================== */
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-2px)';
        });
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
        });
    });

});
