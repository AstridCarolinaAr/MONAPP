/* ======================================================
   VARIABLES GLOBALES
====================================================== */
let animationId = null;

document.addEventListener("DOMContentLoaded", function () {

    console.log("✅ main.js cargado");

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
       ELIMINAR CLIENTE (ADMIN vs NO ADMIN)
    ====================================================== */
    document.querySelectorAll(".btn-eliminar").forEach(btn => {

        btn.addEventListener("click", function (e) {

            const esAdmin = this.dataset.esAdmin === "true";
            const modalId = this.dataset.modalId;

            if (esAdmin) {
                // 👑 ADMIN → abrir modal de confirmación
                const modalEl = document.getElementById(modalId);
                if (!modalEl) return;

                new bootstrap.Modal(modalEl).show();

            } else {
                // 🚫 NO ADMIN → modal global
                e.preventDefault();

                const modalPermiso = document.getElementById("modalAccionNoPermitida");
                if (!modalPermiso) return;

                const modal = new bootstrap.Modal(modalPermiso);
                modal.show();

                const barra = document.getElementById("barraTiempoPermiso");
                if (barra) {
                    barra.style.animation = "none";
                    barra.offsetHeight;
                    barra.style.animation = "cerrarModal 3.5s linear forwards";
                }

                setTimeout(() => {
                    modal.hide();
                    document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
                    document.body.classList.remove("modal-open");
                }, 3500);
            }
        });

    });

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
