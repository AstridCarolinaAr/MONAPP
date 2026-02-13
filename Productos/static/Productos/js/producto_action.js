function getCSRFToken() {
  const el = document.querySelector('[name=csrfmiddlewaretoken]');
  if (el) return el.value;

  const m = document.cookie.split("; ").find(r => r.startsWith("csrftoken="));
  return m ? m.split("=")[1] : "";
}

async function postJson(url) {
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "X-CSRFToken": getCSRFToken(),
      "X-Requested-With": "XMLHttpRequest",
    },
    credentials: "same-origin",
  });

  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, data };
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-eliminar");
  if (!btn) return;

  const nombre = btn.dataset.nombre || "este producto";
  const urlEliminar = btn.dataset.url;
  const urlToggle = btn.dataset.toggleUrl;

  const confirm1 = await Swal.fire({
    title: "Confirmar",
    html: `Vas a eliminar <strong>${nombre}</strong>.`,
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Eliminar",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#d33",
    cancelButtonColor: "#6c757d",
  });

  if (!confirm1.isConfirmed) return;

  try {
    const r = await postJson(urlEliminar);

    if (r.data.status === "deleted") {
      await Swal.fire({
        title: "Listo",
        text: "Producto eliminado.",
        icon: "success",
        confirmButtonColor: "#198754",
      });
      location.reload();
      return;
    }

    if (r.data.status === "protected") {
      const confirm2 = await Swal.fire({
        title: "No se puede eliminar",
        html: `Está vinculado a <strong>${r.data.cantidad}</strong> ${r.data.detalle}.<br>¿Deseas inactivarlo?`,
        icon: "info",
        showCancelButton: true,
        confirmButtonText: "Inactivar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#0d6efd",
        cancelButtonColor: "#6c757d",
      });

      if (!confirm2.isConfirmed) return;

      const t = await postJson(urlToggle);

      if (t.data.status === "inactivated") {
        await Swal.fire({
          title: "Listo",
          text: "Producto inactivado.",
          icon: "success",
          confirmButtonColor: "#198754",
        });
        location.reload();
        return;
      }

      await Swal.fire("Error", "No se pudo inactivar.", "error");
      return;
    }

    await Swal.fire("Error", "Respuesta inesperada del servidor.", "error");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Ocurrió un error.", "error");
  }
});

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-toggle-estado");
  if (!btn) return;

  const nombre = btn.dataset.nombre || "este producto";
  const url = btn.dataset.url;
  const estado = btn.dataset.estado;

  const accion = estado === "descontinuado" ? "activar" : "inactivar";

  const ok = await Swal.fire({
    title: "Confirmar",
    html: `¿Deseas ${accion} <strong>${nombre}</strong>?`,
    icon: "question",
    showCancelButton: true,
    confirmButtonText: "Sí",
    cancelButtonText: "Cancelar",
    confirmButtonColor: "#198754",
    cancelButtonColor: "#6c757d",
  });

  if (!ok.isConfirmed) return;

  try {
    const r = await postJson(url);
    if (r.data.status === "activated" || r.data.status === "inactivated") {
      location.reload();
      return;
    }
    Swal.fire("Error", "No se pudo cambiar el estado.", "error");
  } catch (err) {
    console.error(err);
    Swal.fire("Error", "Ocurrió un error.", "error");
  }
});