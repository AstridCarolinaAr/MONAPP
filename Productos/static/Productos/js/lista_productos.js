document.addEventListener('DOMContentLoaded', function () {

    // Activar tooltips de Bootstrap
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')

    tooltipTriggerList.forEach(function (tooltipTriggerEl) {
        new bootstrap.Tooltip(tooltipTriggerEl)
    })

})
/* =========================
   CSRF Helper
========================= */
function getCSRFToken() {
    const el = document.querySelector('[name=csrfmiddlewaretoken]');
    return el ? el.value : '';
}

/* =========================
   Filtro por líneas
========================= */
document.addEventListener('DOMContentLoaded', () => {

    const btnFiltro = document.getElementById('btnFiltroLineas');
    if (btnFiltro) {
        btnFiltro.addEventListener('click', () => {
            document.getElementById('panelFiltroLineas')
                ?.classList.toggle('d-none');
        });
    }

    /* =========================
       Modal detalle producto
    ========================= */
    const modal = document.getElementById('modalDetalleProducto');
    if (modal) {
        modal.addEventListener('show.bs.modal', function (event) {
            const button = event.relatedTarget;
            if (!button) return;

            const data = button.dataset;

            document.getElementById('d-codigo').textContent = data.codigo || '—';
            document.getElementById('d-nombre').textContent = data.nombre || '—';
            document.getElementById('d-marca').textContent = data.marca || '—';
            document.getElementById('d-precio').textContent = data.precio ? `$${data.precio}` : '—';
            document.getElementById('d-linea').textContent = data.linea || '—';
            document.getElementById('d-unidad').textContent = data.unidad || '—';
            document.getElementById('d-estado').textContent = data.estado || '—';
            document.getElementById('d-descripcion').textContent = data.descripcion || '—';
        });
    }

});

/* =========================
   ELIMINAR PRODUCTO
========================= */
function eliminarProducto(codigo, nombre) {

    Swal.fire({
        title: 'Confirmar eliminación',
        html: `Vas a eliminar el producto <strong>${nombre}</strong>.<br>Esta acción no se puede deshacer.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d'
    }).then((result) => {

        if (!result.isConfirmed) return;

        fetch(`/Productos/eliminar/${codigo}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('Respuesta inválida del servidor');
            return res.json();
        })
        .then(data => {

            if (data.status === 'deleted') {

                Swal.fire({
                    title: 'Producto eliminado',
                    text: 'El producto fue eliminado correctamente.',
                    icon: 'success',
                    confirmButtonColor: '#198754'
                }).then(() => location.reload());

                return;
            }

            if (data.status === 'protected') {

                const detalle = data.detalle || 'registros del sistema';

                Swal.fire({
                    title: 'No se puede eliminar',
                    html: `
                        El producto <strong>${nombre}</strong> se encuentra vinculado a
                        <strong>${data.cantidad}</strong> ${detalle}.<br><br>
                        Por integridad de la información, no es posible eliminarlo.<br><br>
                        ¿Deseas desactivarlo en su lugar?
                    `,
                    icon: 'info',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, desactivar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#0d6efd',
                    cancelButtonColor: '#6c757d'
                }).then((r) => {

                    if (!r.isConfirmed) return;

                    fetch(`/Productos/desactivar/${codigo}/`, {
                        method: 'POST',
                        headers: {
                            'X-CSRFToken': getCSRFToken(),
                        }
                    })
                    .then(res => {
                        if (!res.ok) throw new Error('No se pudo desactivar');
                        return res.json();
                    })
                    .then(() => {

                        Swal.fire({
                            title: 'Producto desactivado',
                            text: 'El producto fue desactivado correctamente.',
                            icon: 'success',
                            confirmButtonColor: '#198754'
                        }).then(() => location.reload());

                    })
                    .catch(err => {
                        console.error(err);
                        Swal.fire('Error', 'No fue posible desactivar el producto.', 'error');
                    });

                });

                return;
            }

            Swal.fire('Atención', 'Respuesta inesperada del servidor.', 'warning');

        })
        .catch(err => {
            console.error(err);
            Swal.fire('Error', 'Ocurrió un error al procesar la solicitud.', 'error');
        });

    });
}

/* =========================
   REACTIVAR PRODUCTO
========================= */
function reactivarProducto(codigo, nombre) {

    Swal.fire({
        title: 'Reactivar producto',
        html: `El producto <strong>${nombre}</strong> volverá a estar disponible en el sistema.`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, reactivar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#198754',
        cancelButtonColor: '#6c757d'
    }).then((result) => {

        if (!result.isConfirmed) return;

        fetch(`/Productos/reactivar/${codigo}/`, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCSRFToken(),
            }
        })
        .then(res => {
            if (!res.ok) throw new Error('No se pudo reactivar');
            return res.json();
        })
        .then(() => {

            Swal.fire({
                title: 'Producto reactivado',
                text: 'El producto fue reactivado correctamente.',
                icon: 'success',
                confirmButtonColor: '#198754'
            }).then(() => location.reload());

        })
        .catch(err => {
            console.error(err);
            Swal.fire('Error', 'No fue posible reactivar el producto.', 'error');
        });

    });
}
