<<<<<<< HEAD
document.addEventListener('DOMContentLoaded', () => {
// ===============================
    // ELEMENTOS
    // ===============================
    const header = document.querySelector('.header');
    const footer = document.querySelector('.footer');
    const navItems = document.querySelectorAll('.nav-item');

    // ===============================
    // SCROLL HEADER + FOOTER
    // ===============================
    window.addEventListener('scroll', () => {

        // HEADER SCROLL
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }

        // FOOTER VISIBLE AL FINAL
        if (footer) {
            if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 50) {
                footer.classList.add('visible');
            } else {
                footer.classList.remove('visible');
            }
        }
    });

    // ===============================
    // HOVER EFECTO PÍLDORA (SUAVE)
    // ===============================
    navItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-2px)';
        });

        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0)';
        });
    });
    const logo = document.querySelector('.logo svg');

    function isLightColor(rgb) {
        const result = rgb.match(/\d+/g);
        if (!result) return false;

        const r = parseInt(result[0]);
        const g = parseInt(result[1]);
        const b = parseInt(result[2]);

        // fórmula de luminancia
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;

        return brightness > 160; // > claro, < oscuro
    }

    function updateLogoColor() {
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
    };

    // ===============================
    // NAVBAR OSCURO FORZADO EN INFINITE
    // ===============================
    const infiniteSection = document.getElementById('infinite');

    function updateNavbarInfiniteMode() {
        if (!header || !infiniteSection) return;

        const sectionTop = infiniteSection.offsetTop;
        const sectionBottom = sectionTop + infiniteSection.offsetHeight;
        const scrollPos = window.scrollY + window.innerHeight / 2;

        if (scrollPos >= sectionTop && scrollPos <= sectionBottom) {
            // Estamos en infinite
            header.classList.add('navbar-dark');

            // Forzamos logo negro
            if (logo) {
                logo.style.color = '#000';
            }

        } else {
            // Fuera de infinite
            header.classList.remove('navbar-dark');

            // Devolvemos control a la lógica automática
            updateLogoColor();
        }
    }

    // Escuchadores
    window.addEventListener('scroll', updateNavbarInfiniteMode);
    window.addEventListener('load', updateNavbarInfiniteMode);
    window.addEventListener('resize', updateNavbarInfiniteMode);
    window.addEventListener('scroll', updateLogoColor);
    window.addEventListener('load', updateLogoColor);
    window.addEventListener('resize', updateLogoColor)
=======
/* ======================================================
   VARIABLES GLOBALES
====================================================== */
let animationId = null;

document.addEventListener("DOMContentLoaded", function () {

    console.log(" main.js cargado");

    /* ======================================================
       LOGIN MODAL (NO TOCAR)
    ====================================================== */
    try {
        const loginModalEl = document.getElementById("loginModal");
        if (loginModalEl && window.showLoginModal === true) {
            new bootstrap.Modal(loginModalEl).show();
        }
    } catch (e) {
        console.warn("Login modal no disponible");
    }
    /* ======================================================
       CANVAS LOGIN (BOLAS)
    ====================================================== */
    const loginModal = document.getElementById("loginModal");

    if (loginModal) {
        loginModal.addEventListener("shown.bs.modal", () => {

            const canvas = document.getElementById("bolaCanvas");
            if (!canvas) return;

            const ctx = canvas.getContext("2d");
            let balls = [];

            function resizeCanvas() {
                canvas.width = canvas.offsetWidth;
                canvas.height = canvas.offsetHeight;
            }

            function createBalls() {
                balls = [];
                for (let i = 0; i < 40; i++) {
                    balls.push({
                        x: Math.random() * canvas.width,
                        y: Math.random() * canvas.height,
                        r: Math.random() * 10 + 5,
                        dx: (Math.random() - 0.5) * 0.5,
                        dy: (Math.random() - 0.5) * 0.5,
                        alpha: Math.random() * 0.2 + 0.05
                    });
                }
            }

            function update() {
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                balls.forEach(b => {
                    b.x += b.dx;
                    b.y += b.dy;

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
            window.addEventListener("resize", start);

            loginModal.addEventListener(
                "hidden.bs.modal",
                () => cancelAnimationFrame(animationId),
                { once: true }
            );
        });
    }

});
document.addEventListener('DOMContentLoaded', () => {

    const btnFiltroLineas = document.getElementById('btnFiltroLineas');
    const panelFiltroLineas = document.getElementById('panelFiltroLineas');

    if (btnFiltroLineas && panelFiltroLineas) {
        btnFiltroLineas.addEventListener('click', (e) => {
            e.preventDefault();
            panelFiltroLineas.classList.toggle('d-none');
        });
    }

    // Si se hace click en "Quitar filtros", ocultar panel
    document.querySelectorAll('a[href="?"]').forEach(link => {
        link.addEventListener('click', () => {
            panelFiltroLineas?.classList.add('d-none');
        });
    });

>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
});