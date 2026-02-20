function getCSRFToken() {
  return document.querySelector('[name=csrfmiddlewaretoken]').value;
}

function eliminarProveedor(id) {

  Swal.fire({
    title: 'Confirmar eliminación',
    text: 'Esta acción eliminará el proveedor permanentemente.',
    icon: 'warning',
    showCancelButton: true,
    confirmButtonColor: '#d33',
    cancelButtonColor: '#6c757d',
    confirmButtonText: 'Sí, eliminar',
    cancelButtonText: 'Cancelar'
  }).then((result) => {

    if (!result.isConfirmed) return;

    fetch(`/Proveedores/eliminar/${id}/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": getCSRFToken(),
      },
    })
    .then(res => res.json())
    .then(data => {

      if (data.status === "deleted") {

        Swal.fire({
          title: 'Eliminado',
          text: 'El proveedor fue eliminado correctamente.',
          icon: 'success',
          confirmButtonColor: '#198754'
        }).then(() => location.reload());
      }

      if (data.status === "protected") {

        Swal.fire({
          title: 'No se puede eliminar',
          html: `
            Este proveedor está vinculado a 
            <strong>${data.cantidad}</strong> ${data.detalle}.<br><br>Por razones de seguridad, no puede eliminarse.<br><br>
            ¿Deseas desactivarlo en su lugar?
          `,
          icon: 'info',
          showCancelButton: true,
          confirmButtonText: 'Sí, desactivar',
          cancelButtonText: 'Cancelar',
          confirmButtonColor: '#0d6efd'
        }).then((result) => {

          if (!result.isConfirmed) return;

          fetch(`/Proveedores/desactivar/${id}/`, {
            method: "POST",
            headers: {
              "X-CSRFToken": getCSRFToken(),
            },
          })
          .then(res => res.json())
          .then(() => {

            Swal.fire({
              title: 'Proveedor desactivado',
              text: 'El proveedor fue desactivado correctamente.',
              icon: 'success',
              confirmButtonColor: '#198754'
            }).then(() => location.reload());

          });

        });

      }

    })
    .catch(() => {
      Swal.fire({
        title: 'Error',
        text: 'Ocurrió un error al procesar la solicitud.',
        icon: 'error',
        confirmButtonColor: '#d33'
      });
    });

  });
}
function reactivarProveedor(id) {

  Swal.fire({
    title: 'Reactivar proveedor',
    text: 'El proveedor volverá a estar disponible en el sistema.',
    icon: 'question',
    showCancelButton: true,
    confirmButtonText: 'Sí, reactivar',
    cancelButtonText: 'Cancelar',
    confirmButtonColor: '#198754'
  }).then((result) => {

    if (!result.isConfirmed) return;

    fetch(`/Proveedores/reactivar/${id}/`, {
      method: "POST",
      headers: {
        "X-CSRFToken": getCSRFToken(),
      },
    })
    .then(res => res.json())
    .then(() => {

      Swal.fire({
        title: 'Proveedor reactivado',
        text: 'El proveedor fue reactivado correctamente.',
        icon: 'success',
        confirmButtonColor: '#198754'
      }).then(() => location.reload());

    });

  });
}