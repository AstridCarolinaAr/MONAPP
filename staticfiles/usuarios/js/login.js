document.addEventListener("DOMContentLoaded", () => {
  console.log("Script de login cargado"); // Para debug

  // ==================== TOGGLE PASSWORD ====================
  const password = document.getElementById("password");
  const eye = document.getElementById("togglePassword");

  if (password && eye) {
    console.log("Toggle password encontrado"); // Para debug
    
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
  
  if (!canvas) {
    console.log("Canvas no encontrado"); // Para debug
    return;
  }

  console.log("Canvas encontrado, iniciando animación"); // Para debug
  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    const rect = canvas.parentElement.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;
    console.log(`Canvas redimensionado: ${canvas.width}x${canvas.height}`); // Para debug
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // Configuración de las bolas (MEJORADAS - MÁS VISIBLES)
  const bolas = [];
  const cantidad = 15; // Más bolas

  for (let i = 0; i < cantidad; i++) {
    bolas.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 15 + Math.random() * 20, // Bolas más grandes (15-35px)
      dx: (Math.random() - 0.5) * 0.6, // Movimiento más rápido
      dy: (Math.random() - 0.5) * 0.6,
      alpha: 0.4 + Math.random() * 0.35 // Más opacas (0.4-0.9)
    });
  }

  console.log(`${cantidad} bolas creadas`); // Para debug

  function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bolas.forEach(bola => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${bola.alpha})`;
      ctx.arc(bola.x, bola.y, bola.r, 0, Math.PI * 2);
      ctx.fill();

      bola.x += bola.dx;
      bola.y += bola.dy;

      // Rebotar en los bordes
      if (bola.x <= bola.r || bola.x >= canvas.width - bola.r) bola.dx *= -1;
      if (bola.y <= bola.r || bola.y >= canvas.height - bola.r) bola.dy *= -1;
    });

    requestAnimationFrame(dibujar);
  }

  dibujar();
  console.log("Animación iniciada"); // Para debug

  // ==================== REDIMENSIONAR CANVAS AL ABRIR MODAL ====================
  const loginModal = document.getElementById('loginModal');
  if (loginModal) {
    loginModal.addEventListener('shown.bs.modal', () => {
      console.log("Modal abierto, redimensionando canvas"); // Para debug
      resizeCanvas();
      // Reiniciar posiciones de las bolas
      bolas.forEach(bola => {
        bola.x = Math.random() * canvas.width;
        bola.y = Math.random() * canvas.height;
      });
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