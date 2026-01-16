document.addEventListener('DOMContentLoaded', function () {

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

        if (btn.dataset.permitido === undefined) {
            console.warn("Botón eliminar sin data-permitido", btn);
        }

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

document.addEventListener("DOMContentLoaded", function () {

    if (window.tieneErrorPermiso === true) {
        const modal = new bootstrap.Modal(
            document.getElementById("modalAccionNoPermitida")
        );

        const mensaje = window.mensajePermiso || 
            "No tienes permiso para realizar esta acción.";

        document.getElementById("modalPermisoMensaje").textContent = mensaje;

        modal.show();
    }

});
