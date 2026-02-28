function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getCSRFToken() {
  const el = document.querySelector('[name=csrfmiddlewaretoken]');
  return el ? el.value : "";
}

/** POST que NO rompe cuando es 409 (porque necesitamos leer el JSON) */
async function postAction(url, action, extra = {}) {
  const formData = new FormData();
  formData.append("action", action);
  Object.entries(extra).forEach(([k, v]) => formData.append(k, v));

  const res = await fetch(url, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      "X-CSRFToken": getCSRFToken(),
      "X-Requested-With": "XMLHttpRequest",
    },
    body: formData,
  });

  let data = {};
  try {
    data = await res.json();
  } catch {
    data = {};
  }

  return { ok: res.ok, status: res.status, data };
}

/** Normaliza relaciones desde tu backend actual (data.detalles) o futuro (data.related.detalle_compras.items) */
function getRelacionItems(data) {
  // Formato actual: data.detalles = [{cantidad, nombre}, ...]
  if (Array.isArray(data?.detalles) && data.detalles.length) {
    const items = data.detalles.map((d, i) => ({
      id: i + 1,
      title: `${d.cantidad ?? ""} ${d.nombre ?? ""}`.trim(),
      meta: "",
    }));
    return { label: "Relaciones", count: items.length, items };
  }

  // Formato nuevo: data.related.detalle_compras.items = [...]
  const dc = data?.related?.detalle_compras;
  if (dc && Array.isArray(dc.items)) {
    const items = dc.items.map((it) => ({
      id: it.id,
      title: [
        it.compra_id ? `Compra #${it.compra_id}` : null,
        it.fecha ? it.fecha : null,
      ].filter(Boolean).join(" — "),
      meta: [
        it.cantidad != null ? `Cant: ${it.cantidad}` : null,
        it.precio != null ? `Precio: ${it.precio}` : null,
      ].filter(Boolean).join(" · "),
    }));
    return { label: "Detalle compras", count: dc.count ?? items.length, items };
  }

  return { label: "Relaciones", count: 0, items: [] };
}

/** Render interactivo: muestra 3 y botón ver más */
function renderInteractiveRelacionados(data, limit = 3) {
  const rel = getRelacionItems(data);
  const items = rel.items || [];
  const count = rel.count ?? items.length;

  if (!items.length) {
    return `<div class="text-muted">No se encontraron detalles para mostrar.</div>`;
  }

  const preview = items.slice(0, limit);
  const rest = items.slice(limit);

  const renderItem = (it) => `
    <div style="padding:8px 10px;border:1px solid #eee;border-radius:10px;margin:6px 0;">
      <div style="font-weight:600">${escapeHtml(it.title || `#${it.id}`)}</div>
      ${it.meta ? `<div style="opacity:.75;font-size:13px;margin-top:2px;">${escapeHtml(it.meta)}</div>` : ""}
    </div>
  `;

  const moreId = `swal_more_${Math.random().toString(16).slice(2)}`;

  return `
    <div style="text-align:left;">
      <div style="margin-bottom:8px;">
        <b>• ${escapeHtml(rel.label)}</b>
        <span style="opacity:.7">(${escapeHtml(count)})</span>
      </div>

      ${preview.map(renderItem).join("")}

      ${
        rest.length
          ? `
          <button id="${moreId}" type="button"
                  style="border:none;background:transparent;color:#0d6efd;padding:0;margin-top:6px;font-weight:600;">
            Ver más (${rest.length})
          </button>
          <div id="${moreId}_box" style="display:none;margin-top:6px;">
            ${rest.map(renderItem).join("")}
          </div>
        `
          : ""
      }
    </div>
  `;
}

/** Conecta el botón Ver más dentro del Swal */
function wireSwalMoreButton() {
  const btn = document.querySelector('[id^="swal_more_"]:not([id$="_box"])');
  if (!btn) return;

  const box = document.getElementById(btn.id + "_box");
  if (!box) return;

  btn.addEventListener("click", () => {
    const open = box.style.display !== "none";
    box.style.display = open ? "none" : "block";
    btn.textContent = open ? "Ver más" : "Ocultar";
  });
}

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".btn-toggle-activo");
  if (!btn) return;

  const url = btn.dataset.url;
  const nombre = btn.dataset.nombre || "este producto";
  const activo = btn.dataset.activo === "1";

  try {
    // 1) ACTIVAR
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

      const resp = await postAction(url, "activate");
      if (resp.data?.status === "activated") {
        await Swal.fire("Activado", "El producto fue activado correctamente.", "success");
        window.location.reload();
        return;
      }

      await Swal.fire("Error", "No se pudo activar el producto.", "error");
      return;
    }

    // 2) ELIMINAR
    const rDel = await Swal.fire({
      title: "Eliminar producto",
      html: `Vas a eliminar <strong>"${escapeHtml(nombre)}"</strong>.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#dc3545",
    });
    if (!rDel.isConfirmed) return;

    const resp = await postAction(url, "delete");

    if (resp.data?.status === "deleted") {
      await Swal.fire("Eliminado", "El producto fue eliminado correctamente.", "success");
      window.location.reload();
      return;
    }

    // 3) PROTEGIDO (409 o status protected/blocked)
    if (resp.status === 409 || resp.data?.status === "protected" || resp.data?.status === "blocked") {
      const detallesHtml = renderInteractiveRelacionados(resp.data, 3);

      const rOff = await Swal.fire({
        title: "No se puede eliminar",
        icon: "info",
        html: `
          <div style="margin-bottom:10px;">Este producto está relacionado con:</div>
          ${detallesHtml}
          <div style="margin-top:12px;">¿Deseas desactivarlo en su lugar?</div>
        `,
        showCancelButton: true,
        confirmButtonText: "Sí, desactivar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#0d6efd",
        didOpen: () => wireSwalMoreButton(),
      });

      if (!rOff.isConfirmed) return;

      const resp2 = await postAction(url, "deactivate");
      if (resp2.data?.status === "inactivated") {
        await Swal.fire("Desactivado", "El producto fue desactivado correctamente.", "success");
        window.location.reload();
        return;
      }

      await Swal.fire("Error", "No se pudo desactivar el producto.", "error");
      return;
    }

    await Swal.fire("Error", "Ocurrió un error procesando la solicitud.", "error");
  } catch (err) {
    console.error(err);
    await Swal.fire("Error", "Ocurrió un error procesando la solicitud.", "error");
  }
});