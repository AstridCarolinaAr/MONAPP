const header = document.querySelector('.header');
const footer = document.querySelector('.footer');
const headerButtons = document.querySelectorAll('.btn-header');

window.addEventListener('scroll', () => {
    // Encoger header
    if (window.scrollY > 50) {
        header.classList.add('scrolled');
        // Difuminar botones al hacer scroll
        headerButtons.forEach(btn => {
            btn.style.background = 'rgba(255,255,255,0.3)';
            btn.style.backdropFilter = 'blur(10px)';
        });
    } else {
        header.classList.remove('scrolled');
        headerButtons.forEach(btn => {
            btn.style.background = 'rgba(255,255,255,0.1)';
            btn.style.backdropFilter = 'blur(5px)';
        });
    }

    // Mostrar footer al final
    if (window.scrollY + window.innerHeight >= document.body.scrollHeight - 50) {
        footer.classList.add('visible');
    } else {
        footer.classList.remove('visible');
    }
});

// Botones tipo píldora hover
headerButtons.forEach(btn => {
    btn.addEventListener('mouseenter', () => {
        btn.style.transform = 'translateY(-2px)';
    });
    btn.addEventListener('mouseleave', () => {
        btn.style.transform = 'translateY(0)';
    });
});
