// Global UI helpers (public website)
(function () {
  const header = document.querySelector('.header');
  const nav = document.querySelector('.nav-glass');
  const toggle = document.querySelector('[data-nav-toggle]');
  const backdrop = document.querySelector('[data-nav-backdrop]');

  function setNav(open) {
    if (!header) return;
    header.classList.toggle('nav-open', !!open);
    if (toggle) toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  }

  if (toggle && header) {
    toggle.addEventListener('click', () => {
      setNav(!header.classList.contains('nav-open'));
    });
  }

  if (backdrop) {
    backdrop.addEventListener('click', () => setNav(false));
  }

  if (nav) {
    nav.querySelectorAll('a[href^=\"#\"]').forEach((link) => {
      link.addEventListener('click', () => setNav(false));
    });
  }

  // Header scroll state
  if (header) {
    const onScroll = () => {
      header.classList.toggle('scrolled', (window.scrollY || 0) > 8);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }
})();

