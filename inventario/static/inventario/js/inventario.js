document.addEventListener('DOMContentLoaded', function () {
    const searchForms = document.querySelectorAll('.js-search-pill');

    searchForms.forEach(function (form) {
        const button = form.querySelector('.js-search-toggle');
        const input = form.querySelector('.search-pill__input');

        if (!button || !input) return;

        function spinButton() {
            button.classList.remove('is-spinning');
            void button.offsetWidth;
            button.classList.add('is-spinning');
        }

        function openSearch() {
            form.classList.add('is-open');
            button.setAttribute('aria-label', 'Cerrar búsqueda');
            setTimeout(() => input.focus(), 180);
        }

        function closeSearch() {
            form.classList.remove('is-open');
            button.setAttribute('aria-label', 'Abrir búsqueda');
        }

        button.addEventListener('click', function () {
            const isOpen = form.classList.contains('is-open');
            const value = input.value.trim();

            spinButton();

            if (!isOpen) {
                openSearch();
                return;
            }

            if (value !== '') {
                form.requestSubmit();
                return;
            }

            closeSearch();
        });

        input.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') {
                input.value = '';
                closeSearch();
            }
        });

        if (input.value.trim() !== '') {
            form.classList.add('is-open');
            button.setAttribute('aria-label', 'Cerrar búsqueda');
        }
    });
});