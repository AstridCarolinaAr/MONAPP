document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('btnEliminarPromo').addEventListener('click', function () {
        const nombre = this.closest('.card-body').querySelector('h5').textContent;
        Swal.fire({
            title: '¿Eliminar promoción?',
            html:  '¿Seguro que deseas eliminar <strong>' + nombre + '</strong>?<br><small class="text-muted">Esta acción no se puede deshacer.</small>',
            icon:  'warning',
            showCancelButton:   true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor:  '#6c757d',
            confirmButtonText:  '<i class="bi bi-trash3"></i> Sí, eliminar',
            cancelButtonText:   'Cancelar',
            reverseButtons:     true,
        }).then(result => {
            if (result.isConfirmed) {
                document.getElementById('formEliminarPromo').submit();
            }
        });
    });
});
