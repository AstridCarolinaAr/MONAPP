document.addEventListener("DOMContentLoaded", () => {
  // ==================== TOGGLE PASSWORD ====================
  const password = document.getElementById("password");
  const eye = document.getElementById("togglePassword");

  if (password && eye) {
    // PC - Mostrar/ocultar contraseña
    eye.addEventListener("mousedown", () => {
      password.type = "text";
      eye.classList.replace("bi-eye", "bi-eye-slash");
    });

    eye.addEventListener("mouseup", () => {
      password.type = "password";
      eye.classList.replace("bi-eye-slash", "bi-eye");
    });

    eye.addEventListener("mouseleave", () => {
      password.type = "password";
      eye.classList.replace("bi-eye-slash", "bi-eye");
    });

    // MÓVIL - Mostrar/ocultar contraseña
    eye.addEventListener("touchstart", (e) => {
      e.preventDefault();
      password.type = "text";
      eye.classList.replace("bi-eye", "bi-eye-slash");
    });

    eye.addEventListener("touchend", (e) => {
      e.preventDefault();
      password.type = "password";
      eye.classList.replace("bi-eye-slash", "bi-eye");
    });
  }

  // ==================== ANIMACIÓN DE BOLAS ====================
  const canvas = document.getElementById("bolaCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Configuración de las bolas
  const bolas = [];
  const cantidad = 10;

  for (let i = 0; i < cantidad; i++) {
    bolas.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 10 + Math.random() * 12,
      dx: (Math.random() - 0.5) * 0.4,
      dy: (Math.random() - 0.5) * 0.4,
      alpha: 0.25 + Math.random() * 0.4
    });
  }

  function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bolas.forEach(bola => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${bola.alpha})`;
      ctx.arc(bola.x, bola.y, bola.r, 0, Math.PI * 2);
      ctx.fill();

      bola.x += bola.dx;
      bola.y += bola.dy;

      if (bola.x <= bola.r || bola.x >= canvas.width - bola.r) bola.dx *= -1;
      if (bola.y <= bola.r || bola.y >= canvas.height - bola.r) bola.dy *= -1;
    });

    requestAnimationFrame(dibujar);
  }

  dibujar();

  // ==================== REDIMENSIONAR CANVAS AL ABRIR MODAL ====================
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('shown.bs.modal', () => {
      resizeCanvas();
    });
  }

  // ==================== AUTO-CERRAR ALERTAS EN MODAL ====================
  const alerts = document.querySelectorAll('.login-modal-content .alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getInstance(alert);
      if (bsAlert) {
        bsAlert.close();
      }
    }, 5000);
  });
});