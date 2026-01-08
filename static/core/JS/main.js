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
