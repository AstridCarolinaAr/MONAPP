document.addEventListener("DOMContentLoaded", () => {

  // ==================== TOGGLE PASSWORD ====================
  const password = document.getElementById("password");
  const eye = document.getElementById("togglePassword");

  if (password && eye) {
    eye.addEventListener("mousedown", () => { password.type = "text"; eye.innerHTML = '\u{1F440}'; });
    eye.addEventListener("mouseup",   () => { password.type = "password"; eye.innerHTML = '<span class="closed-eyes"><span class="eye-closed"></span><span class="eye-closed"></span></span>'; });
    eye.addEventListener("mouseleave",() => { password.type = "password"; eye.innerHTML = '<span class="closed-eyes"><span class="eye-closed"></span><span class="eye-closed"></span></span>'; });
    eye.addEventListener("touchstart",(e) => { e.preventDefault(); password.type = "text"; eye.innerHTML = '\u{1F440}'; });
    eye.addEventListener("touchend",  (e) => { e.preventDefault(); password.type = "password"; eye.innerHTML = '<span class="closed-eyes"><span class="eye-closed"></span><span class="eye-closed"></span></span>'; });
  }

  // ==================== BURBUJAS HEADER (Canvas 2D plano) ====================
  const canvas = document.getElementById("bolaCanvas");

  if (canvas) {
    const ctx = canvas.getContext("2d");
    let burbujas = [];

    function resizeCanvas() {
      const rect = canvas.parentElement.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    }
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Tamaños: grande, mediana, pequeña, diminuta
    function crearBurbuja() {
      const tipo = Math.random();
      let r;
      if (tipo < 0.15)      r = 20 + Math.random() * 12;  // grande (20-32)
      else if (tipo < 0.40) r = 10 + Math.random() * 10;  // mediana (10-20)
      else if (tipo < 0.70) r = 5 + Math.random() * 5;    // pequeña (5-10)
      else                  r = 1.5 + Math.random() * 3.5; // diminuta (1.5-5)
      return {
        x: Math.random() * canvas.width,
        y: canvas.height + r + Math.random() * 40,
        r: r,
        vy: -(0.2 + Math.random() * (r < 6 ? 0.6 : 0.9)),
        vx: (Math.random() - 0.5) * 0.5,
        wobbleAmp: 0.3 + Math.random() * 0.7,
        wobbleSpeed: 0.02 + Math.random() * 0.03,
        wobbleOffset: Math.random() * Math.PI * 2,
        maxAlpha: r > 15 ? 0.12 + Math.random() * 0.2 : 0.15 + Math.random() * 0.45,
        born: performance.now(),
        life: 3000 + Math.random() * 5000
      };
    }

    for (let i = 0; i < 25; i++) {
      const b = crearBurbuja();
      b.y = Math.random() * canvas.height;
      burbujas.push(b);
    }

    function dibujarBurbujas(time) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (Math.random() < 0.12 && burbujas.length < 50) {
        burbujas.push(crearBurbuja());
      }

      burbujas = burbujas.filter(b => {
        const age = time - b.born;
        if (age > b.life || b.y + b.r < -10) return false;

        const fadeIn = Math.min(age / 600, 1);
        const fadeOut = Math.max(1 - (age - b.life + 800) / 800, 0);
        const alpha = b.maxAlpha * fadeIn * fadeOut;

        const wobble = Math.sin(time * b.wobbleSpeed + b.wobbleOffset) * b.wobbleAmp;
        b.x += b.vx + wobble * 0.3;
        b.y += b.vy;

        // Círculo plano 2D
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        ctx.fill();

        return true;
      });

      requestAnimationFrame(dibujarBurbujas);
    }
    requestAnimationFrame(dibujarBurbujas);

    const loginModal = document.getElementById('loginModal');
    if (loginModal) {
      loginModal.addEventListener('shown.bs.modal', () => {
        resizeCanvas();
        burbujas = [];
        for (let i = 0; i < 25; i++) {
          const b = crearBurbuja();
          b.y = Math.random() * canvas.height;
          burbujas.push(b);
        }
      });
    }
  }

  // ==================== BURBUJAS DE FONDO (Canvas 2D plano) ====================
  const bgCanvas = document.getElementById("bgBubblesCanvas");

  if (bgCanvas) {
    const bgCtx = bgCanvas.getContext("2d");
    let bgBurbujas = [];

    function resizeBg() {
      bgCanvas.width = window.innerWidth;
      bgCanvas.height = window.innerHeight;
    }
    resizeBg();
    window.addEventListener("resize", resizeBg);

    // Tamaños: grande, mediana, pequeña, diminuta
    function crearBgBurbuja() {
      const tipo = Math.random();
      let r;
      if (tipo < 0.12)      r = 14 + Math.random() * 10;  // grande (14-24)
      else if (tipo < 0.35) r = 7 + Math.random() * 7;    // mediana (7-14)
      else if (tipo < 0.65) r = 3 + Math.random() * 4;    // pequeña (3-7)
      else                  r = 1 + Math.random() * 2;    // diminuta (1-3)
      return {
        x: Math.random() * bgCanvas.width,
        y: bgCanvas.height + r + Math.random() * 60,
        r: r,
        vy: -(0.1 + Math.random() * (r < 5 ? 0.4 : 0.6)),
        vx: (Math.random() - 0.5) * 0.3,
        wobbleAmp: 0.2 + Math.random() * 0.5,
        wobbleSpeed: 0.01 + Math.random() * 0.02,
        wobbleOffset: Math.random() * Math.PI * 2,
        maxAlpha: r > 10 ? 0.06 + Math.random() * 0.12 : 0.08 + Math.random() * 0.2,
        born: performance.now(),
        life: 5000 + Math.random() * 10000
      };
    }

    for (let i = 0; i < 30; i++) {
      const b = crearBgBurbuja();
      b.y = Math.random() * bgCanvas.height;
      bgBurbujas.push(b);
    }

    function dibujarBgBurbujas(time) {
      bgCtx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);

      if (Math.random() < 0.06 && bgBurbujas.length < 60) {
        bgBurbujas.push(crearBgBurbuja());
      }

      bgBurbujas = bgBurbujas.filter(b => {
        const age = time - b.born;
        if (age > b.life || b.y + b.r < -10) return false;

        const fadeIn = Math.min(age / 1000, 1);
        const fadeOut = Math.max(1 - (age - b.life + 1200) / 1200, 0);
        const alpha = b.maxAlpha * fadeIn * fadeOut;

        const wobble = Math.sin(time * b.wobbleSpeed + b.wobbleOffset) * b.wobbleAmp;
        b.x += b.vx + wobble * 0.15;
        b.y += b.vy;

        // Círculo plano 2D
        bgCtx.beginPath();
        bgCtx.fillStyle = `rgba(205, 168, 138, ${alpha})`;
        bgCtx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
        bgCtx.fill();

        return true;
      });

      requestAnimationFrame(dibujarBgBurbujas);
    }
    requestAnimationFrame(dibujarBgBurbujas);
  }

  // ==================== AUTO-CERRAR ALERTAS ====================
  const alerts = document.querySelectorAll('.login-modal-content .alert');
  alerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getInstance(alert);
      if (bsAlert) bsAlert.close();
    }, 5000);
  });
});

