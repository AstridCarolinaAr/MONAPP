document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.btn-restaurar').forEach(btn => {
        btn.addEventListener('click', function() {
            const id = this.dataset.id;
            const nombre = this.dataset.nombre;

            Swal.fire({
                title: '¿Restaurar backup?',
                html: `Se restaurará <strong>"${nombre}"</strong>.<br>
                       <span class="text-danger">Esto reemplazará la base de datos actual.</span><br>
                       <small>Se recomienda crear un backup antes de restaurar.</small>`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#3a2a24',
                cancelButtonColor: '#999',
                confirmButtonText: '<i class="bi bi-arrow-counterclockwise"></i> Sí, restaurar',
                cancelButtonText: 'Cancelar',
                reverseButtons: true,
            }).then((result) => {
                if (result.isConfirmed) {
                    const form = document.getElementById('formRestaurar');
                    form.action = `/backup/restaurar/${id}/`;
                    form.submit();
                }
            });
        });
    });
});
