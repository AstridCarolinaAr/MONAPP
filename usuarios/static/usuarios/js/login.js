document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('togglePassword');
    const passInput = document.getElementById('password');
    if (toggle && passInput) {
        const toggleIcon = toggle.querySelector('i') || toggle;
        toggle.addEventListener('click', () => {
            const isPass = passInput.type === 'password';
            passInput.type = isPass ? 'text' : 'password';
            toggleIcon.classList.toggle('bi-eye');
            toggleIcon.classList.toggle('bi-eye-slash');
        });
    }

    document.querySelectorAll('.login-alert[data-autoclose]').forEach((el) => {
        const delay = parseInt(el.dataset.autoclose, 10);
        if (isNaN(delay) || delay <= 0) return;

        const bar = el.querySelector('.alert-progress-bar');
        if (bar) {
            bar.style.transition = `width ${delay}ms linear`;
            requestAnimationFrame(() => { bar.style.width = '0%'; });
        }

        setTimeout(() => {
            try { bootstrap.Alert.getOrCreateInstance(el).close(); }
            catch (error) { el.remove(); }
        }, delay);
    });

    const particlesContainer = document.getElementById('particles');
    if (particlesContainer) {
        for (let i = 0; i < 25; i++) {
            const dot = document.createElement('span');
            dot.className = 'particle';
            dot.style.left = Math.random() * 100 + '%';
            dot.style.animationDuration = (4 + Math.random() * 8) + 's';
            dot.style.animationDelay = (Math.random() * 5) + 's';
            dot.style.width = dot.style.height = (2 + Math.random() * 4) + 'px';
            particlesContainer.appendChild(dot);
        }
    }

    const bgCanvas = document.getElementById('bgBubblesCanvas');
    if (bgCanvas) {
        const ctx = bgCanvas.getContext('2d');
        const bubbles = [];

        const resizeCanvas = () => {
            bgCanvas.width = bgCanvas.offsetWidth || bgCanvas.parentElement.offsetWidth;
            bgCanvas.height = bgCanvas.offsetHeight || bgCanvas.parentElement.offsetHeight;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        for (let i = 0; i < 16; i++) {
            bubbles.push({
                x: Math.random() * bgCanvas.width,
                y: Math.random() * bgCanvas.height,
                r: 8 + Math.random() * 18,
                dx: (Math.random() - 0.5) * 0.35,
                dy: (Math.random() - 0.5) * 0.35,
                a: 0.05 + Math.random() * 0.1,
            });
        }

        const drawBubbles = () => {
            ctx.clearRect(0, 0, bgCanvas.width, bgCanvas.height);
            bubbles.forEach((bubble) => {
                ctx.beginPath();
                ctx.fillStyle = `rgba(255,255,255,${bubble.a})`;
                ctx.arc(bubble.x, bubble.y, bubble.r, 0, Math.PI * 2);
                ctx.fill();

                bubble.x += bubble.dx;
                bubble.y += bubble.dy;

                if (bubble.x < -bubble.r) bubble.x = bgCanvas.width + bubble.r;
                if (bubble.x > bgCanvas.width + bubble.r) bubble.x = -bubble.r;
                if (bubble.y < -bubble.r) bubble.y = bgCanvas.height + bubble.r;
                if (bubble.y > bgCanvas.height + bubble.r) bubble.y = -bubble.r;
            });

            requestAnimationFrame(drawBubbles);
        };

        drawBubbles();
    }

    const loginForm = document.querySelector('#loginModal form');
    const captchaBox = document.getElementById('loginCaptchaBox');
    const captchaTrigger = document.getElementById('loginCaptchaTrigger');
    const captchaVerifiedInput = document.getElementById('captchaVerified');
    const captchaOverlay = document.getElementById('captchaChallengeOverlay');
    const captchaCodeEl = document.getElementById('captchaChallengeCode');
    const captchaInput = document.getElementById('captchaChallengeInput');
    const captchaError = document.getElementById('captchaChallengeError');
    const captchaVerifyBtn = document.getElementById('captchaVerifyBtn');
    const captchaCancelBtn = document.getElementById('captchaCancelBtn');
    const captchaCloseBtn = document.getElementById('captchaCloseBtn');
    let activeCaptchaCode = '';

    const generateCaptchaCode = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    };

    const openCaptchaChallenge = () => {
        if (!captchaBox || !captchaOverlay) return;
        captchaBox.classList.add('verifying');
        activeCaptchaCode = generateCaptchaCode();
        if (captchaCodeEl) captchaCodeEl.textContent = activeCaptchaCode;
        if (captchaInput) captchaInput.value = '';
        if (captchaError) captchaError.textContent = '';
        captchaOverlay.classList.add('active');
        setTimeout(() => {
            if (captchaInput) captchaInput.focus();
        }, 60);
    };

    const closeCaptchaChallenge = () => {
        if (!captchaBox || !captchaOverlay) return;
        captchaBox.classList.remove('verifying');
        captchaOverlay.classList.remove('active');
        if (captchaInput) captchaInput.value = '';
        if (captchaError) captchaError.textContent = '';
    };

    const markCaptchaVerified = () => {
        if (!captchaBox || !captchaVerifiedInput) return;
        captchaBox.classList.remove('verifying');
        captchaBox.classList.add('verified');
        captchaVerifiedInput.value = '1';
        closeCaptchaChallenge();
    };

    if (captchaTrigger && captchaBox) {
        const launchCaptcha = () => {
            if (captchaBox.classList.contains('verified')) return;
            openCaptchaChallenge();
        };

        captchaTrigger.addEventListener('click', launchCaptcha);
        captchaTrigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                launchCaptcha();
            }
        });
    }

    if (captchaVerifyBtn) {
        captchaVerifyBtn.addEventListener('click', () => {
            if (!captchaInput || !captchaError) return;
            if ((captchaInput.value || '').trim().toUpperCase() !== activeCaptchaCode) {
                captchaError.textContent = 'El codigo no coincide. Intenta de nuevo.';
                captchaInput.focus();
                return;
            }
            markCaptchaVerified();
        });
    }

    if (captchaCancelBtn) {
        captchaCancelBtn.addEventListener('click', closeCaptchaChallenge);
    }

    if (captchaCloseBtn) {
        captchaCloseBtn.addEventListener('click', closeCaptchaChallenge);
    }

    if (captchaOverlay) {
        captchaOverlay.addEventListener('click', (event) => {
            if (event.target === captchaOverlay) {
                closeCaptchaChallenge();
            }
        });
    }

    if (captchaInput) {
        captchaInput.addEventListener('input', () => {
            captchaInput.value = captchaInput.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
        });
    }

    if (loginForm && captchaBox && captchaVerifiedInput) {
        loginForm.addEventListener('submit', (event) => {
            if (captchaVerifiedInput.value !== '1') {
                event.preventDefault();
                openCaptchaChallenge();
            }
        });
    }
});
