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
<<<<<<< HEAD
        const headerRect = header.getBoundingClientRect();

        // Punto justo debajo del header
=======
       // Si no existe header o logo en esta página, no hacemos nada
        if (!header || !logo) return;

        const headerRect = header.getBoundingClientRect();

>>>>>>> 4f7c7795ccdd2020aa9e23075436fe9dcc829002
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
<<<<<<< HEAD
    };
=======
    }
>>>>>>> 4f7c7795ccdd2020aa9e23075436fe9dcc829002

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
});