// Asegúrate de que el DOM esté cargado antes de ejecutar
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById('editarProductoForm');

    if (!form) return; // Si no existe el formulario, no hacer nada

    form.addEventListener('submit', function(event) {
        event.preventDefault(); // Evita que el formulario se envíe de inmediato

        const formData = new FormData(form);

        // Enviar datos al servidor
        fetch(form.action || window.location.href, {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                // Mostrar mensaje emergente de éxito
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: 'Los cambios se guardaron correctamente',
                    confirmButtonText: 'OK'
                });
            } else {
                // Mensaje de error si algo falla
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Hubo un problema al guardar los cambios'
                });
            }
        })
        .catch(error => {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo conectar con el servidor'
            });
            console.error(error);
        });
    });
});
