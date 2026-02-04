document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       HERO FADE IN
    =============================== */
    const hero = document.querySelector(".sq-hero");
    if (hero) {
        requestAnimationFrame(() => {
            hero.classList.add("is-visible");
        });
    }

    /* =====================================================
       CONFIGURACIÓN GENERAL CARRUSEL
    ===================================================== */
    const baseSpeed = -0.8;
    const inertia = 0.08;
    const accelerationRate = 0.04;
    const maxSpeed = 4;

    let isPaused = false;
    let velocity = baseSpeed;
    let targetVelocity = baseSpeed;
    let acceleration = 0;

    /* =====================================================
       IMÁGENES DE FONDO
    ===================================================== */
    document.querySelectorAll('.sq-card').forEach(card => {
        const bg = card.dataset.bg;
        if (bg) {
            card.style.backgroundImage = `url(${bg})`;
        }
    });

    /* =====================================================
       ELEMENTOS DEL CARRUSEL
    ===================================================== */
    const container = document.getElementById('infinite');
    const track1 = document.getElementById('track1');
    const track2 = document.getElementById('track2');

    if (!container || !track1 || !track2) {
        console.warn('Carrusel infinito no encontrado');
        return;
    }

    const trackWidth = track1.scrollWidth;
    let x1 = 0;
    let x2 = trackWidth;

    /* =====================================================
       ANIMACIÓN PRINCIPAL
    ===================================================== */
    function animate() {

        if (!isPaused) {

            targetVelocity += acceleration;
            targetVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, targetVelocity));
            velocity += (targetVelocity - velocity) * inertia;

            x1 += velocity;
            x2 += velocity;

            if (velocity < 0) {
                if (x1 <= -trackWidth) x1 = x2 + trackWidth;
                if (x2 <= -trackWidth) x2 = x1 + trackWidth;
            } else {
                if (x1 >= trackWidth) x1 = x2 - trackWidth;
                if (x2 >= trackWidth) x2 = x1 - trackWidth;
            }

            track1.style.transform = `translate3d(${x1}px,0,0)`;
            track2.style.transform = `translate3d(${x2}px,0,0)`;
        }

        requestAnimationFrame(animate);
    }

    animate();

    /* =====================================================
       CONTROL POR MOUSE
    ===================================================== */
    container.addEventListener('mousemove', e => {
        if (isPaused) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const center = rect.width / 2;
        const distance = (mouseX - center) / center;

        if (Math.abs(distance) < 0.1) {
            acceleration = 0;
            targetVelocity = baseSpeed;
        } else if (distance < 0) {
            acceleration = accelerationRate;
        } else {
            acceleration = -accelerationRate;
        }
    });

    container.addEventListener('mouseleave', () => {
        if (isPaused) return;
        acceleration = 0;
        targetVelocity = baseSpeed;
    });

    /* =====================================================
       CLICK EN CARD → VIDEO + PAUSA
    ===================================================== */
    document.querySelectorAll('.sq-card').forEach(card => {

        const video = card.querySelector('video');

        card.addEventListener('click', () => {

            // pausa SIEMPRE al click
            isPaused = true;

            if (card.classList.contains('is-video')) return;

            // cerrar otros videos
            document.querySelectorAll('.sq-card.is-video').forEach(openCard => {
                openCard.classList.remove('is-video');
                const v = openCard.querySelector('video');
                if (v) {
                    v.pause();
                    v.currentTime = 0;
                }
            });

            card.classList.add('is-video');

            if (video) {
                video.currentTime = 0;
                video.play().catch(err => {
                    console.warn('Autoplay bloqueado:', err);
                });
            }
        });

        if (video) {
            video.addEventListener('click', e => e.stopPropagation());

            video.addEventListener('ended', () => {
                card.classList.remove('is-video');
                video.pause();
                video.currentTime = 0;

                // reanudar suavemente
                setTimeout(() => {
                    isPaused = false;
                    acceleration = 0;
                    targetVelocity = baseSpeed;
                }, 150);
            });
        }
    });

    /* ===============================
       CAMBIO DE FONDO POR SCROLL
    =============================== */
    const body = document.body;
    const sections = [
        { id: 'infinite', class: 'bg-white' },
        { id: 'testimonials', class: 'bg-brown' },
        { id: 'cta', class: 'bg-black' }
    ];

    function onScrollChangeBackground() {
        const mid = window.scrollY + window.innerHeight / 2;

        sections.forEach(section => {
            const el = document.getElementById(section.id);
            if (!el) return;

            const top = el.offsetTop;
            const bottom = top + el.offsetHeight;

            if (mid >= top && mid < bottom) {
                body.classList.remove('bg-white', 'bg-brown', 'bg-black');
                body.classList.add(section.class);
            }
        });
    }

    window.addEventListener('scroll', onScrollChangeBackground);
    window.addEventListener('load', onScrollChangeBackground);

    /* ===============================
       ANIMACIONES AL SCROLL
    =============================== */
    const animatedSections = document.querySelectorAll(
        ".sq-card, .sq-step, .sq-benefits div, .sq-text, .block-title, .block-content"
    );

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.15 });

    animatedSections.forEach(el => observer.observe(el));

});