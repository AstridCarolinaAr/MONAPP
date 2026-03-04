(function () {
  const DPR = Math.min(2, window.devicePixelRatio || 1);

  const THEME_A = { bg: "#d6b285", fg: "#231d18" };
  const THEME_B = { bg: "#231d18", fg: "#d6b285" };

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function dist(ax, ay, bx, by) { return Math.hypot(ax - bx, ay - by); }

  const rgbCache = new Map();
  function hexToRgb(hex) {
    if (rgbCache.has(hex)) return rgbCache.get(hex);
    const c = hex.replace("#", "");
    const v = {
      r: parseInt(c.slice(0, 2), 16),
      g: parseInt(c.slice(2, 4), 16),
      b: parseInt(c.slice(4, 6), 16),
    };
    rgbCache.set(hex, v);
    return v;
  }

  function mount(el) {
    if (el.dataset.metaballsMounted) return;
    el.dataset.metaballsMounted = "1";

    const host = el.closest(".sq-card") || el;

    // Canvas principal (bolas)
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d", { alpha: true });
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    el.appendChild(canvas);

    // Canvas de “pintura” (queda pegada)
    const paintCanvas = document.createElement("canvas");
    const pctx = paintCanvas.getContext("2d", { alpha: true });
    paintCanvas.style.position = "absolute";
    paintCanvas.style.inset = "0";
    paintCanvas.style.width = "100%";
    paintCanvas.style.height = "100%";
    paintCanvas.style.pointerEvents = "none";
    el.appendChild(paintCanvas);

    let w = 1, h = 1;

    // Theme
    let theme = 0;
    function curTheme() { return theme === 0 ? THEME_A : THEME_B; }
    function toggleTheme() { theme = theme === 0 ? 1 : 0; }

    el.style.background = curTheme().bg;

    const mouse = { inside: false, x: 0, y: 0, tx: 0, ty: 0 };

    function resize() {
      w = Math.max(1, el.clientWidth);
      h = Math.max(1, el.clientHeight);

      canvas.width = Math.floor(w * DPR);
      canvas.height = Math.floor(h * DPR);
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      paintCanvas.width = Math.floor(w * DPR);
      paintCanvas.height = Math.floor(h * DPR);
      pctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      mouse.x = w * 0.5; mouse.y = h * 0.5;
      mouse.tx = mouse.x; mouse.ty = mouse.y;
    }
    window.addEventListener("resize", resize);

    // ===== Look (nítido) =====
    const BALL_ALPHA = 0.92;
    const BALL_STROKE = 0.18;
    const SHADOW_BLUR = 2.5;
    const SHADOW_ALPHA = 0.18;

    // ===== Dificultad / crecimiento =====
    const EAT_PADDING = 2;
    const GROW_FACTOR = 0.16;

    const BASE_CURSOR_R = 12;
    let cursorR = BASE_CURSOR_R;

    // ===== Spawn gradual =====
    const MAX_BALLS = 34;
    const START_BALLS = 4;
    const SPAWN_INTERVAL = 160;
    const SPAWN_BURST_CHANCE = 0.22;

    const MIN_R = 6;
    const MAX_R = 22;

    const SPEED_MIN = 0.7;
    const SPEED_MAX = 1.5;

    // ===== Paint bomb =====
    const EXPLODE_AT = 95;

    // “Cargada” antes de explotar
    const PRE_SHAKE_MS = 550;          // tiempo de temblor
    const SHAKE_AMOUNT = 4.5;          // intensidad del temblor (px)
    const PULSE_AMOUNT = 0.12;         // cuánto late

    // Explosión
    const EXPLOSION_MS = 950;

    // Estado
    const balls = [];
    const drops = []; // gotas volando (paint particles)

    let lastSpawn = 0;

    let exploding = false;
    let explodeT0 = 0;
    let preShake = false;
    let shakeT0 = 0;

    // Color pintura (igual al color de la bola fg)
    let paintHex = curTheme().fg;

    host.addEventListener("pointerenter", () => { mouse.inside = true; });
    host.addEventListener("pointerleave", () => { mouse.inside = false; });
    host.addEventListener("pointermove", (e) => {
      const rect = el.getBoundingClientRect();
      mouse.tx = clamp(e.clientX - rect.left, 0, rect.width);
      mouse.ty = clamp(e.clientY - rect.top, 0, rect.height);
    });

    function spawnBall() {
      if (balls.length >= MAX_BALLS) return;

      const r = MIN_R + Math.random() * (MAX_R - MIN_R);
      const speed = SPEED_MIN + Math.random() * (SPEED_MAX - SPEED_MIN);
      const ang = Math.random() * Math.PI * 2;

      balls.push({
        x: r + Math.random() * (w - 2 * r),
        y: r + Math.random() * (h - 2 * r),
        vx: Math.cos(ang) * speed,
        vy: Math.sin(ang) * speed,
        r,
        alive: true
      });
    }

    function seedInitial() {
      balls.length = 0;
      for (let i = 0; i < START_BALLS; i++) spawnBall();
    }

    function drawCircle(ctx2, x, y, r, fill, stroke, lw = 1.4) {
      ctx2.beginPath();
      ctx2.arc(x, y, r, 0, Math.PI * 2);
      ctx2.closePath();
      ctx2.fillStyle = fill;
      ctx2.fill();
      if (stroke) {
        ctx2.lineWidth = lw;
        ctx2.strokeStyle = stroke;
        ctx2.stroke();
      }
    }

    // ==== PAINT SPLAT (mancha pegada) ====
    function paintSplat(x, y, baseR, colorHex, alpha = 0.95) {
      const c = hexToRgb(colorHex);

      // Mancha principal
      pctx.save();
      pctx.globalCompositeOperation = "source-over";
      pctx.fillStyle = `rgba(${c.r},${c.g},${c.b},${alpha})`;
      pctx.beginPath();
      pctx.arc(x, y, baseR, 0, Math.PI * 2);
      pctx.fill();

      // “salpicaduras” alrededor
      const n = 6 + Math.floor(Math.random() * 8);
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = baseR * (0.8 + Math.random() * 1.9);
        const rr = baseR * (0.12 + Math.random() * 0.28);
        pctx.beginPath();
        pctx.arc(x + Math.cos(a) * d, y + Math.sin(a) * d, rr, 0, Math.PI * 2);
        pctx.fill();
      }

      pctx.restore();
    }

    function startPreShake() {
      preShake = true;
      shakeT0 = performance.now();
    }

    function triggerExplosion() {
      exploding = true;
      preShake = false;
      explodeT0 = performance.now();

      paintHex = curTheme().fg;
      drops.length = 0;

      // Generar gotas (paint bomb)
      const count = 70;
      for (let i = 0; i < count; i++) {
        const ang = Math.random() * Math.PI * 2;
        const sp = 3.0 + Math.random() * 7.2;     // velocidad alta
        const rr = 3 + Math.random() * 10;        // tamaños variados

        drops.push({
          x: mouse.x,
          y: mouse.y,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          r: rr,
          life: 1,
          splatted: false
        });
      }

      // Mancha grande inicial
      paintSplat(mouse.x, mouse.y, cursorR * 0.35, paintHex, 0.9);
    }

    function resetAndSwitchTheme() {
      exploding = false;
      cursorR = BASE_CURSOR_R;
      drops.length = 0;

      // cambiar tema al final
      toggleTheme();
      el.style.background = curTheme().bg;

      // limpiar pintura “vieja” suavemente (opcional)
      // si quieres que se quede, comenta estas 2 líneas:
      pctx.clearRect(0, 0, w, h);

      seedInitial();
      lastSpawn = performance.now();
    }

    function step(now) {
      // mouse suave
      const cx = mouse.inside ? mouse.tx : w * 0.5;
      const cy = mouse.inside ? mouse.ty : h * 0.5;
      mouse.x = lerp(mouse.x, cx, 0.14);
      mouse.y = lerp(mouse.y, cy, 0.14);

      // spawn gradual
      if (!exploding && !preShake && (now - lastSpawn) >= SPAWN_INTERVAL) {
        lastSpawn = now;
        spawnBall();
        if (Math.random() < SPAWN_BURST_CHANCE) spawnBall();
      }

      // mover bolas
      for (const b of balls) {
        if (!b.alive) continue;
        b.x += b.vx;
        b.y += b.vy;

        if (b.x < b.r || b.x > w - b.r) b.vx *= -1;
        if (b.y < b.r || b.y > h - b.r) b.vy *= -1;

        b.x = clamp(b.x, b.r, w - b.r);
        b.y = clamp(b.y, b.r, h - b.r);
      }

      // Comer / crecer
      if (!exploding && !preShake) {
        let alive = 0;
        for (const b of balls) {
          if (!b.alive) continue;
          alive++;

          const d = dist(b.x, b.y, mouse.x, mouse.y);
          if (d < cursorR + b.r + EAT_PADDING) {
            b.alive = false;
            cursorR += b.r * GROW_FACTOR;
          }
        }

        // si está muy grande => empieza temblor antes de explotar
        if (cursorR >= EXPLODE_AT) startPreShake();

        // si no hay bolas, también temblor
        if (alive === 0) startPreShake();
      }

      // Pre-shake antes de explotar
      if (preShake) {
        const t = now - shakeT0;
        if (t >= PRE_SHAKE_MS) {
          triggerExplosion();
        }
      }

      // Explosión paint bomb
      if (exploding) {
        const p = clamp((now - explodeT0) / EXPLOSION_MS, 0, 1);

        // physics de gotas
        for (const d of drops) {
          if (d.splatted) continue;

          d.x += d.vx;
          d.y += d.vy;

          // gravedad ligera
          d.vy += 0.10;

          // fricción
          d.vx *= 0.99;
          d.vy *= 0.99;

          // si llega al borde => splat (mancha pegada)
          if (d.x <= d.r || d.x >= w - d.r || d.y <= d.r || d.y >= h - d.r) {
            d.splatted = true;
            paintSplat(
              clamp(d.x, d.r, w - d.r),
              clamp(d.y, d.r, h - d.r),
              d.r * (1.1 + Math.random() * 1.4),
              paintHex,
              0.95
            );
          }

          // si ya pasó “muy lejos” también splat
          if (d.x < -40 || d.x > w + 40 || d.y < -40 || d.y > h + 40) {
            d.splatted = true;
          }
        }

        if (p >= 1) {
          resetAndSwitchTheme();
        }
      }
    }

    function render(now) {
      ctx.clearRect(0, 0, w, h);

      // Shake transform (solo durante preShake)
      let shakeX = 0, shakeY = 0, pulse = 1;

      if (preShake) {
        const t = (now - shakeT0) / PRE_SHAKE_MS; // 0..1
        const intensity = (0.25 + 0.75 * t) * SHAKE_AMOUNT;
        shakeX = (Math.random() * 2 - 1) * intensity;
        shakeY = (Math.random() * 2 - 1) * intensity;

        // pulso (latido)
        pulse = 1 + Math.sin(now * 0.03) * PULSE_AMOUNT * (0.3 + 0.7 * t);
      }

      const fgHex = curTheme().fg;
      const fg = hexToRgb(fgHex);

      ctx.save();
      ctx.translate(shakeX, shakeY);

      ctx.shadowColor = `rgba(0,0,0,${SHADOW_ALPHA})`;
      ctx.shadowBlur = SHADOW_BLUR;

      const fill = `rgba(${fg.r},${fg.g},${fg.b},${BALL_ALPHA})`;
      const stroke = `rgba(255,255,255,${BALL_STROKE})`;

      // bolitas
      for (const b of balls) {
        if (!b.alive) continue;
        drawCircle(ctx, b.x, b.y, b.r, fill, stroke, 1.3);
      }

      // bola principal (con pulso si está “llena”)
      drawCircle(ctx, mouse.x, mouse.y, cursorR * pulse, fill, stroke, 1.6);

      ctx.restore();

      // durante explosión, dibujar gotas volando (pintura en el aire)
      if (exploding) {
        const pc = hexToRgb(paintHex);

        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        for (const d of drops) {
          if (d.splatted) continue;
          ctx.fillStyle = `rgba(${pc.r},${pc.g},${pc.b},0.95)`;
          ctx.beginPath();
          ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();

        // flash suave
        const p = clamp((now - explodeT0) / EXPLOSION_MS, 0, 1);
        if (p < 0.22) {
          ctx.save();
          ctx.globalCompositeOperation = "screen";
          ctx.fillStyle = `rgba(255,255,255,${(0.22 - p) * 0.8})`;
          ctx.fillRect(0, 0, w, h);
          ctx.restore();
        }
      }
    }

    // Init
    resize();
    seedInitial();
    lastSpawn = performance.now();

    function loop(now) {
      step(now);
      render(now);
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);
  }

  function boot() {
    const slots = document.querySelectorAll('.metaballs-slot[data-metaballs="1"]');
    console.log("Metaballs2D slots:", slots.length);
    slots.forEach(mount);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();