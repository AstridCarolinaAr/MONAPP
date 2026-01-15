console.log('crear_proveedor.js cargado');

document.addEventListener('DOMContentLoaded', () => {

    const numericInputs = document.querySelectorAll('input[data-only="number"]');

    console.log('Inputs numéricos encontrados:', numericInputs.length);

    numericInputs.forEach(input => {

        // Bloquea cualquier tecla que no sea número
        input.addEventListener('keydown', (e) => {
            const allowedKeys = [
                'Backspace', 'Delete', 'ArrowLeft', 'ArrowRight',
                'Tab', 'Home', 'End'
            ];

            if (
                allowedKeys.includes(e.key) ||
                (e.key >= '0' && e.key <= '9')
            ) {
                return;
            }

            e.preventDefault();
        });

        // Limpia cualquier carácter no numérico (por si acaso)
        input.addEventListener('input', () => {
            input.value = input.value.replace(/[^0-9]/g, '');
        });

        // Bloquea pegar texto con letras
        input.addEventListener('paste', (e) => {
            const text = (e.clipboardData || window.clipboardData).getData('text');
            if (!/^\d+$/.test(text)) {
                e.preventDefault();
            }
        });

    });

});
