document.addEventListener("DOMContentLoaded", () => {
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
       CONFIGURACION GENERAL CARRUSEL
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
       IMAGENES DE FONDO
    ===================================================== */
    document.querySelectorAll(".sq-card").forEach((card) => {
        const bg = card.dataset.bg;
        if (bg) {
            card.style.backgroundImage = `url(${bg})`;
        }
    });

    /* =====================================================
       ELEMENTOS DEL CARRUSEL
    ===================================================== */
    const container = document.getElementById("infinite");
    const track1 = document.getElementById("track1");
    const track2 = document.getElementById("track2");

    let trackWidth = 0;
    let x1 = 0;
    let x2 = 0;
    let carouselReady = false;

    if (container && track1 && track2) {
        const recalcTracks = () => {
            trackWidth = track1.scrollWidth;
            x1 = 0;
            x2 = trackWidth;
            track1.style.transform = `translate3d(${x1}px,0,0)`;
            track2.style.transform = `translate3d(${x2}px,0,0)`;
            carouselReady = true;
        };

        recalcTracks();
        window.addEventListener("resize", recalcTracks);

        function animate() {
            if (carouselReady && !isPaused) {
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
        container.addEventListener("mousemove", (e) => {
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

        container.addEventListener("mouseleave", () => {
            if (isPaused) return;
            acceleration = 0;
            targetVelocity = baseSpeed;
        });
    } else {
        console.warn("Carrusel infinito no encontrado");
    }

    /* =====================================================
       HELPERS VIDEO
    ===================================================== */
    const cards = document.querySelectorAll(".sq-card");

    function setCarouselPaused(paused) {
        isPaused = paused;
        acceleration = 0;
        targetVelocity = paused ? 0 : baseSpeed;

        if (!paused) {
            velocity = baseSpeed;
        }
    }

    function prepareVideo(video) {
        if (!video) return;

        video.muted = true;
        video.defaultMuted = true;
        video.playsInline = true;
        video.setAttribute("muted", "");
        video.setAttribute("playsinline", "");
        video.setAttribute("webkit-playsinline", "");
        video.setAttribute("preload", "metadata");
    }

    function closeVideo(card, video, resumeCarousel = true) {
        if (!card) return;

        card.classList.remove("is-video");
        card.classList.remove("is-playing");

        if (video) {
            try {
                video.pause();
                video.currentTime = 0;
            } catch (err) {
                console.warn("No se pudo cerrar el video:", err);
            }
        }

        if (resumeCarousel) {
            setTimeout(() => {
                setCarouselPaused(false);
            }, 150);
        }
    }

    function closeAllVideos(exceptCard = null) {
        document.querySelectorAll(".sq-card.is-video").forEach((openCard) => {
            if (exceptCard && openCard === exceptCard) return;

            const openVideo = openCard.querySelector("video.sq-video");
            closeVideo(openCard, openVideo, false);
        });
    }

    async function openVideo(card, video) {
        if (!card || !video) return;

        closeAllVideos(card);
        setCarouselPaused(true);

        card.classList.add("is-video");
        prepareVideo(video);

        try {
            video.pause();
            video.currentTime = 0;
        } catch (err) {
            console.warn("No se pudo reiniciar el video:", err);
        }

        try {
            await new Promise((resolve) => setTimeout(resolve, 120));

            const playPromise = video.play();

            if (playPromise && typeof playPromise.then === "function") {
                await playPromise;
            }

            card.classList.add("is-playing");
        } catch (err) {
            console.warn("Error al reproducir video:", err);
        }
    }

    /* =====================================================
       CLICK EN CARD -> VIDEO + PAUSA
    ===================================================== */
    cards.forEach((card) => {
        const video = card.querySelector("video.sq-video");

        if (video) {
            prepareVideo(video);

            video.addEventListener("click", (e) => {
                e.stopPropagation();
            });

            video.addEventListener("ended", () => {
                closeVideo(card, video, true);
            });

            video.addEventListener("error", () => {
                console.warn("El video no pudo cargarse:", video.currentSrc || video.src);
            });

            video.addEventListener("loadeddata", () => {
                card.classList.add("video-loaded");
            });
        }

        card.addEventListener("click", async (e) => {
            const clickedVideo = e.target.closest("video");
            if (clickedVideo) return;

            if (!video) {
                closeAllVideos(null);
                setCarouselPaused(false);
                return;
            }

            if (card.classList.contains("is-video")) {
                closeVideo(card, video, true);
                return;
            }

            await openVideo(card, video);
        });
    });

    /* ===============================
       CAMBIO DE FONDO POR SCROLL
    =============================== */
    const body = document.body;
    const sections = [
        { id: "infinite", class: "bg-white" },
        { id: "testimonials", class: "bg-brown" },
        { id: "cta", class: "bg-black" }
    ];

    function onScrollChangeBackground() {
        const mid = window.scrollY + window.innerHeight / 2;

        sections.forEach((section) => {
            const el = document.getElementById(section.id);
            if (!el) return;

            const top = el.offsetTop;
            const bottom = top + el.offsetHeight;

            if (mid >= top && mid < bottom) {
                body.classList.remove("bg-white", "bg-brown", "bg-black");
                body.classList.add(section.class);
            }
        });
    }

    window.addEventListener("scroll", onScrollChangeBackground);
    window.addEventListener("load", onScrollChangeBackground);

    /* ===============================
       ANIMACIONES AL SCROLL
    =============================== */
    const animatedSections = document.querySelectorAll(
        ".sq-card, .sq-step, .sq-benefits div, .sq-text, .block-title, .block-content"
    );

    const observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    entry.target.classList.add("visible");
                }
            });
        },
        { threshold: 0.15 }
    );

    animatedSections.forEach((el) => observer.observe(el));
});