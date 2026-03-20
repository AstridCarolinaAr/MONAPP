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
    const captchaHelpText = document.getElementById('captchaHelpText');
    const markCaptchaVerified = () => {
        if (!captchaBox || !captchaVerifiedInput) return;
        captchaBox.classList.remove('captcha-required');
        captchaBox.classList.add('verified');
        captchaVerifiedInput.value = '1';
        if (captchaHelpText) captchaHelpText.textContent = '';
    };

    const startCaptchaVerification = () => {
        if (!captchaBox || !captchaVerifiedInput) return;
        if (captchaBox.classList.contains('verified') || captchaBox.classList.contains('verifying')) return;
        captchaBox.classList.add('verifying');
        setTimeout(() => {
            captchaBox.classList.remove('verifying');
            markCaptchaVerified();
        }, 900);
    };

    if (captchaTrigger && captchaBox) {
        captchaBox.addEventListener('click', startCaptchaVerification);
        captchaTrigger.addEventListener('click', (event) => {
            event.stopPropagation();
            startCaptchaVerification();
        });
        captchaTrigger.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                startCaptchaVerification();
            }
        });
    }

    if (loginForm && captchaBox && captchaVerifiedInput) {
        loginForm.addEventListener('submit', (event) => {
            if (captchaVerifiedInput.value !== '1') {
                event.preventDefault();
                captchaBox.classList.remove('verified');
                captchaBox.classList.add('captcha-required');
                if (captchaHelpText) captchaHelpText.textContent = 'Debes marcar el captcha para poder ingresar.';
                captchaTrigger.focus();
            }
        });
    }
});
