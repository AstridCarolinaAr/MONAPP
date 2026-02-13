function getCSRFToken() {
  const el = document.querySelector('[name=csrfmiddlewaretoken]');
  return el ? el.value : '';
}

async function postAction(url, action) {
  const formData = new FormData();
  formData.append("action", action);

  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "X-CSRFToken": getCSRFToken(),
      "X-Requested-With": "XMLHttpRequest",
    },
    body: formData,
  });

  let data = null;
  try { data = await res.json(); } catch (e) {}

  if (!res.ok) {
    throw new Error("Error HTTP");
  }
  return data;
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-toggle-activo");
  if (!btn) return;

  const url = btn.dataset.url;
  const nombre = btn.dataset.nombre || "este producto";
  const activo = btn.dataset.activo === "1";

  try {
    // Si está inactivo -> preguntar activar
    if (!activo) {
      const r = await Swal.fire({
        title: "Activar producto",
        text: `¿Deseas activar "${nombre}"?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, activar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#198754",
      });

      if (!r.isConfirmed) return;

      const data = await postAction(url, "activate");
      if (data?.status === "activated") {
        await Swal.fire({
          title: "Activado",
          text: "El producto fue activado correctamente.",
          icon: "success",
          confirmButtonColor: "#198754",
        });
        window.location.reload();
      }
      return;
    }

    // Si está activo -> preguntar eliminar
    const rDel = await Swal.fire({
      title: "Eliminar producto",
      html: `Vas a eliminar <strong>"${nombre}"</strong>.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });

    if (!rDel.isConfirmed) return;

    const data = await postAction(url, "delete");

    if (data?.status === "deleted") {
      await Swal.fire({
        title: "Eliminado",
        text: "El producto fue eliminado correctamente.",
        icon: "success",
        confirmButtonColor: "#198754",
      });
      window.location.reload();
      return;
    }

    if (data?.status === "protected") {
      const detalles = (data.detalles || [])
        .map(d => `• ${d.cantidad} ${d.nombre}`)
        .join("<br>");

      const rOff = await Swal.fire({
        title: "No se puede eliminar",
        html: `
          Este producto está relacionado con:<br><br>
          ${detalles || "Registros relacionados"}<br><br>
          ¿Deseas desactivarlo en su lugar?
        `,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Sí, desactivar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#0d6efd",
      });

      if (!rOff.isConfirmed) return;

      const data2 = await postAction(url, "deactivate");
      if (data2?.status === "inactivated") {
        await Swal.fire({
          title: "Desactivado",
          text: "El producto fue desactivado correctamente.",
          icon: "success",
          confirmButtonColor: "#198754",
        });
        window.location.reload();
      }
      return;
    }

    await Swal.fire({
      title: "Error",
      text: "Ocurrió un error procesando la solicitud.",
      icon: "error",
      confirmButtonColor: "#dc3545",
    });

  } catch (err) {
    console.error(err);
    await Swal.fire({
      title: "Error",
      text: "Ocurrió un error procesando la solicitud.",
      icon: "error",
      confirmButtonColor: "#dc3545",
    });
  }
});