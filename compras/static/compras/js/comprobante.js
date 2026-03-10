(function () {
  function initComprobante() {
    console.log("comprobante.js cargado");

    const modalElement = document.getElementById("modalComprobante");
    const previewBody = document.getElementById("comprobantePreviewBody");
    const btnDescargar = document.getElementById("btnDescargarComprobante");

    console.log("modalElement:", modalElement);
    console.log("previewBody:", previewBody);
    console.log("btnDescargar:", btnDescargar);

    if (!modalElement || !previewBody || !btnDescargar) {
      console.error("No se encontraron los elementos del comprobante.");
      return;
    }

    let currentPdfUrl = "";
    let currentExcelUrl = "";

    const loadingHTML = `
      <div class="comprobante-loading">
        <div class="spinner-border" role="status"></div>
        <p class="mt-3 mb-0">Cargando vista previa...</p>
      </div>
    `;

    const errorHTML = (message) => `
      <div class="alert alert-danger mb-0">
        <strong>Error:</strong> ${message}
      </div>
    `;

    document.addEventListener("click", async function (event) {
      const trigger = event.target.closest(".js-open-comprobante");
      if (!trigger) return;

      console.log("click detectado en comprobante");

      const previewUrl = trigger.dataset.previewUrl;
      const pdfUrl = trigger.dataset.pdfUrl;
      const excelUrl = trigger.dataset.excelUrl;

      console.log("previewUrl:", previewUrl);
      console.log("pdfUrl:", pdfUrl);
      console.log("excelUrl:", excelUrl);

      currentPdfUrl = pdfUrl || "";
      currentExcelUrl = excelUrl || "";

      previewBody.innerHTML = loadingHTML;

      try {
        const response = await fetch(previewUrl, {
          method: "GET",
          headers: {
            "X-Requested-With": "XMLHttpRequest"
          }
        });

        console.log("status:", response.status);
        console.log("content-type:", response.headers.get("content-type"));

        const text = await response.text();
        console.log("respuesta cruda:", text);

        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error("La respuesta no fue JSON válido.");
        }

        if (!response.ok || !data.success) {
          throw new Error(data.message || "No se pudo cargar la vista previa.");
        }

        previewBody.innerHTML = data.html;
      } catch (error) {
        console.error("ERROR FETCH COMPROBANTE:", error);
        previewBody.innerHTML = errorHTML(error.message || "Error inesperado.");
      }
    });

    btnDescargar.addEventListener("click", async function () {
      if (!currentPdfUrl || !currentExcelUrl) {
        Swal.fire({
          icon: "warning",
          title: "Sin comprobante",
          text: "Primero abre un comprobante."
        });
        return;
      }

      const result = await Swal.fire({
        title: "Descargar comprobante",
        text: "Selecciona el formato",
        icon: "question",
        showCancelButton: true,
        showDenyButton: true,
        confirmButtonText: "PDF",
        denyButtonText: "Excel",
        cancelButtonText: "Cancelar",
        reverseButtons: true,
        buttonsStyling: false,
        customClass: {
          confirmButton: "btn btn-danger me-2",
          denyButton: "btn btn-success me-2",
          cancelButton: "btn btn-secondary"
        }
      });

      if (result.isConfirmed) {
        window.location.href = currentPdfUrl;
      } else if (result.isDenied) {
        window.location.href = currentExcelUrl;
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initComprobante);
  } else {
    initComprobante();
  }
})();