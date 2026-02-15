<<<<<<< HEAD

document.addEventListener('DOMContentLoaded', () => {
    document.addEventListener("DOMContentLoaded", () => {
        const hero = document.querySelector(".sq-hero");
        if (hero) {
            requestAnimationFrame(() => {
                hero.classList.add("is-visible");
            });
        }
    });
    

    /* =====================================================
       CONFIGURACIÓN GENERAL
=======
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
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
    ===================================================== */
    const baseSpeed = -0.8;
    const inertia = 0.08;
    const accelerationRate = 0.04;
    const maxSpeed = 4;

    let isPaused = false;
<<<<<<< HEAD

=======
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
    let velocity = baseSpeed;
    let targetVelocity = baseSpeed;
    let acceleration = 0;

    /* =====================================================
<<<<<<< HEAD
       IMÁGENES DE FONDO DESDE data-bg
=======
       IMÁGENES DE FONDO
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
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

<<<<<<< HEAD
    if (!container || !track1 || !track2) return;

    const trackWidth = track1.scrollWidth;

=======
    if (!container || !track1 || !track2) {
        console.warn('Carrusel infinito no encontrado');
        return;
    }

    const trackWidth = track1.scrollWidth;
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
    let x1 = 0;
    let x2 = trackWidth;

    /* =====================================================
       ANIMACIÓN PRINCIPAL
    ===================================================== */
    function animate() {

        if (!isPaused) {

<<<<<<< HEAD
            // aceleración progresiva
            targetVelocity += acceleration;
            targetVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, targetVelocity));

            // inercia
=======
            targetVelocity += acceleration;
            targetVelocity = Math.max(-maxSpeed, Math.min(maxSpeed, targetVelocity));
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
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

<<<<<<< HEAD
            track1.style.transform = `translate3d(${x1}px, 0, 0)`;
            track2.style.transform = `translate3d(${x2}px, 0, 0)`;
=======
            track1.style.transform = `translate3d(${x1}px,0,0)`;
            track2.style.transform = `translate3d(${x2}px,0,0)`;
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
        }

        requestAnimationFrame(animate);
    }

    animate();

    /* =====================================================
       CONTROL POR MOUSE
    ===================================================== */
<<<<<<< HEAD
    container.addEventListener('mousemove', (e) => {
=======
    container.addEventListener('mousemove', e => {
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
        if (isPaused) return;

        const rect = container.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const center = rect.width / 2;
        const distance = (mouseX - center) / center;

        if (Math.abs(distance) < 0.1) {
            acceleration = 0;
            targetVelocity = baseSpeed;
        } else if (distance < 0) {
<<<<<<< HEAD
            acceleration = accelerationRate;   // izquierda → derecha
        } else {
            acceleration = -accelerationRate;  // derecha → izquierda
=======
            acceleration = accelerationRate;
        } else {
            acceleration = -accelerationRate;
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
        }
    });

    container.addEventListener('mouseleave', () => {
        if (isPaused) return;
        acceleration = 0;
        targetVelocity = baseSpeed;
    });

    /* =====================================================
<<<<<<< HEAD
       CLICK EN CARD → ABRIR VIDEO
=======
       CLICK EN CARD → VIDEO + PAUSA
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
    ===================================================== */
    document.querySelectorAll('.sq-card').forEach(card => {

        const video = card.querySelector('video');

<<<<<<< HEAD
card.addEventListener('click', () => {

    if (card.classList.contains('is-video')) return;

    // cerrar otros videos abiertos
    document.querySelectorAll('.sq-card.is-video').forEach(openCard => {
        openCard.classList.remove('is-video');
        const v = openCard.querySelector('video');
        if (v) {
            v.pause();
            v.currentTime = 0;
        }
    });

    // abrir card actual
    card.classList.add('is-video');
    isPaused = true;

    // ▶️ reproducir video
    if (video) {
        video.currentTime = 0;
        video.play().catch(err => {
            console.warn('Autoplay bloqueado:', err);
        });
    }
});


        /* =================================================
           CLICK EN VIDEO → CONTROL NORMAL (SIN REABRIR CARD)
        ================================================= */
        if (video) {
            video.addEventListener('click', (e) => {
                e.stopPropagation(); // evita click fantasma
            });
        }

        /* =================================================
           CUANDO TERMINA EL VIDEO
        ================================================= */
        if (video) {
            video.addEventListener('ended', () => {

                // cerrar card
                card.classList.remove('is-video');

                // reset video
                video.pause();
                video.currentTime = 0;

                // reanudar carrusel suavemente
                setTimeout(() => {
                    isPaused = false;
                    acceleration = 0;
                    velocity = baseSpeed;
=======
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
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
                    targetVelocity = baseSpeed;
                }, 150);
            });
        }
    });
<<<<<<< HEAD
// ==================== SCROLL COLOR STATES ====================
const body = document.body;

const sections = [
    { id: 'infinite', class: 'bg-white' },
    { id: 'testimonials', class: 'bg-brown' },
    { id: 'cta', class: 'bg-black' }
];

function onScrollChangeBackground() {
    const scrollMiddle = window.scrollY + window.innerHeight / 2;

    sections.forEach(section => {
        const el = document.getElementById(section.id);
        if (!el) return;

        const top = el.offsetTop;
        const bottom = top + el.offsetHeight;

        if (scrollMiddle >= top && scrollMiddle < bottom) {
            body.classList.remove('bg-white', 'bg-brown', 'bg-black');
            body.classList.add(section.class);
        }
    });
}

window.addEventListener('scroll', onScrollChangeBackground);
window.addEventListener('load', onScrollChangeBackground);


    /* ===============================
       TESTIMONIOS (CAROUSEL SIMPLE)
    ================================ */

    const testimonials = document.querySelectorAll(".sq-testimonial");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");

    let currentTestimonial = 0;

    function showTestimonial(index) {
        testimonials.forEach(t => t.classList.remove("active"));
        testimonials[index].classList.add("active");
    }

    // Mostrar el primer testimonio si existen
    if (testimonials.length > 0) {
        showTestimonial(currentTestimonial);
    }

    // Botón siguiente
    if (nextBtn) {
        nextBtn.addEventListener("click", () => {
            currentTestimonial =
                (currentTestimonial + 1) % testimonials.length;
            showTestimonial(currentTestimonial);
        });
    }

    // Botón anterior
    if (prevBtn) {
        prevBtn.addEventListener("click", () => {
            currentTestimonial =
                (currentTestimonial - 1 + testimonials.length) %
                testimonials.length;
            showTestimonial(currentTestimonial);
        });
    }


    /* ===============================
       ANIMACIONES SUAVES AL SCROLL
       (tipo Squarespace)
    ================================ */

=======

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
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
    const animatedSections = document.querySelectorAll(
        ".sq-card, .sq-step, .sq-benefits div, .sq-text, .block-title, .block-content"
    );

<<<<<<< HEAD
    const observer = new IntersectionObserver(
        entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        },
        {
            threshold: 0.15
        }
    );

    animatedSections.forEach(section => {
        observer.observe(section);
    });

});

=======
    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("visible");
            }
        });
    }, { threshold: 0.15 });

    animatedSections.forEach(el => observer.observe(el));

});
>>>>>>> 0dc192099b551bf1de1984186ebebef3b2bfbb85
