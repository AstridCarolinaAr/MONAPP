/* ─────────────────────────────────────────────────────────────────
   login.js
   JS compartido para: login.html, username_recovery.html
───────────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function () {

    /* ── Toggle visibilidad de contraseña ── */
    const toggle = document.getElementById('togglePassword');
    const passInput = document.getElementById('password');
    if (toggle && passInput) {
        toggle.addEventListener('click', () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            toggle.classList.toggle('bi-eye');
            toggle.classList.toggle('bi-eye-slash');
        });
    }

    /* ── Auto-cierre de alertas con barra de progreso ── */
    document.querySelectorAll('.login-alert[data-autoclose]').forEach(el => {
        const delay = parseInt(el.dataset.autoclose, 10);
        if (isNaN(delay) || delay <= 0) return;

        const bar = el.querySelector('.alert-progress-bar');
        if (bar) {
            bar.style.transition = `width ${delay}ms linear`;
            requestAnimationFrame(() => { bar.style.width = '0%'; });
        }

        setTimeout(() => {
            try { bootstrap.Alert.getOrCreateInstance(el).close(); }
            catch (e) { el.remove(); }
        }, delay);
    });

    /* ── Partículas flotantes de fondo ── */
    const container = document.getElementById('particles');
    if (container) {
        for (let i = 0; i < 25; i++) {
            const dot = document.createElement('span');
            dot.className = 'particle';
            dot.style.left = Math.random() * 100 + '%';
            dot.style.animationDuration = (4 + Math.random() * 8) + 's';
            dot.style.animationDelay = (Math.random() * 5) + 's';
            dot.style.width = dot.style.height = (2 + Math.random() * 4) + 'px';
            container.appendChild(dot);
        }
    }
});
