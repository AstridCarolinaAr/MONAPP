document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("bolaCanvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");

  function resizeCanvas() {
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // CONFIGURACIÓN
  const bolas = [];
  const cantidad = 8;

  for (let i = 0; i < cantidad; i++) {
    bolas.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: 10 + Math.random() * 12,
      dx: (Math.random() - 0.5) * 0.6,
      dy: (Math.random() - 0.5) * 0.6,
      alpha: 0.3 + Math.random() * 0.4
    });
  }

  function dibujar() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    bolas.forEach(bola => {
      ctx.beginPath();
      ctx.fillStyle = `rgba(255,255,255,${bola.alpha})`;
      ctx.arc(bola.x, bola.y, bola.r, 0, Math.PI * 2);
      ctx.fill();

      // Movimiento
      bola.x += bola.dx;
      bola.y += bola.dy;

      // Rebote suave
      if (bola.x < bola.r || bola.x > canvas.width - bola.r) bola.dx *= -1;
      if (bola.y < bola.r || bola.y > canvas.height - bola.r) bola.dy *= -1;
    });

    requestAnimationFrame(dibujar);
  }

  dibujar();
});
