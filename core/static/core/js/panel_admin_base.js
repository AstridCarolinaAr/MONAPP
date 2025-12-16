document.addEventListener("DOMContentLoaded", () => {

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

    const animatedSections = document.querySelectorAll(
        ".sq-card, .sq-step, .sq-benefits div, .sq-text, .block-title, .block-content"
    );

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
