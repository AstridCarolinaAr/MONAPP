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
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    const navItems = document.querySelectorAll('.nav-item');
    const logo = document.querySelector('.logo svg');
    const infiniteSection = document.getElementById('infinite');

    function updateHeaderFooter() {
        if (header) header.classList.toggle('scrolled', window.scrollY > 50);
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
        const [r, g, b] = result.map(Number);
        return (r * 299 + g * 587 + b * 114) / 1000 > 160;
    }

    function updateLogoColor() {
        if (!header || !logo) return;
        const rect = header.getBoundingClientRect();
        const el = document.elementFromPoint(window.innerWidth / 2, rect.bottom + 1);
        if (!el) return;
        logo.style.color =
            isLightColor(getComputedStyle(el).backgroundColor) ? '#000' : '#fff';
    }

    function updateNavbarInfiniteMode() {
        if (!header || !infiniteSection) return;
        const mid = window.scrollY + window.innerHeight / 2;
        const top = infiniteSection.offsetTop;
        const bottom = top + infiniteSection.offsetHeight;

        if (mid >= top && mid <= bottom) {
            header.classList.add('navbar-dark');
            if (logo) logo.style.color = '#000';
        } else {
            header.classList.remove('navbar-dark');
            updateLogoColor();
        }
    }

    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => item.style.transform = 'translateY(-2px)');
        item.addEventListener('mouseleave', () => item.style.transform = 'translateY(0)');
    });

    function onScroll() {
        updateHeaderFooter();
        updateNavbarInfiniteMode();
        updateLogoColor();
    }

    window.addEventListener('scroll', onScroll);
    window.addEventListener('load', onScroll);
    window.addEventListener('resize', onScroll);
    
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
/* ======================================================
   CANVAS BOLAS LOGIN 
====================================================== */
const loginModal = document.getElementById('loginModal');

if (loginModal) {
    loginModal.addEventListener('shown.bs.modal', () => {

        const canvas = document.getElementById('bolaCanvas');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        let balls = [];
        let animationId;

        function resizeCanvas() {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        }

        function createBalls() {
            balls = [];
            const total = 50; //  cantidad de bolas

            for (let i = 0; i < total; i++) {
                balls.push({
                    x: Math.random() * canvas.width,
                    y: Math.random() * canvas.height,
                    r: Math.random() * 10 + 10,        // tamaño pequeño
                    dx: (Math.random() - 0.5) * 0.5, // velocidad suave
                    dy: (Math.random() - 0.5) * 0.3,
                    alpha: Math.random() * 0.15 + 0.05
                });
            }
        }

        function update() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            balls.forEach(b => {
                b.x += b.dx;
                b.y += b.dy;

                // rebote suave en bordes
                if (b.x <= b.r || b.x >= canvas.width - b.r) b.dx *= -1;
                if (b.y <= b.r || b.y >= canvas.height - b.r) b.dy *= -1;

                ctx.beginPath();
                ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255,255,255,${b.alpha})`;
                ctx.fill();
            });

            animationId = requestAnimationFrame(update);
        }

        function start() {
            cancelAnimationFrame(animationId);
            resizeCanvas();
            createBalls();
            update();
        }

        start();
        window.addEventListener('resize', start);

        // detener animación al cerrar modal
        loginModal.addEventListener('hidden.bs.modal', () => {
            cancelAnimationFrame(animationId);
        }, { once: true });
    });
}
