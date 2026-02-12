document.addEventListener('DOMContentLoaded', function () {

    const modal = document.getElementById('modalCrearCliente');
    const btnGuardar = document.getElementById('btnGuardarCliente');

    if (!modal || !btnGuardar) return;

    const form = modal.querySelector('form');

    /* ===============================
       FUNCIÓN: ESTADO DEL BOTÓN
    =============================== */
    function actualizarEstadoBoton() {

        // Campos obligatorios
        const obligatorios = [
            'tipo_documento',
            'numero_documento',
            'nombre',
            'apellido',
            'fecha_nacimiento'
        ];

        let hayError = false;
        let hayVacios = false;
        let noValidos = false;

        obligatorios.forEach(id => {
            const campo = document.getElementById(id);
            if (!campo) return;

            if (campo.value.trim() === '') {
                hayVacios = true;
            }

            if (campo.classList.contains('is-invalid')) {
                hayError = true;
            }

            if (
                campo.value.trim() !== '' &&
                !campo.classList.contains('is-valid')
            ) {
                noValidos = true;
            }
        });

        if (hayError || hayVacios || noValidos) {
            btnGuardar.disabled = true;
            btnGuardar.classList.remove('btn-dark');
            btnGuardar.classList.add('btn-secondary');
        } else {
            btnGuardar.disabled = false;
            btnGuardar.classList.remove('btn-secondary');
            btnGuardar.classList.add('btn-dark');
        }
    }

    /* ===============================
       VALIDACIONES EN TIEMPO REAL
    =============================== */
    document.addEventListener('input', async function (e) {

        const input = e.target;
        const feedback = input.nextElementSibling;
        if (!feedback) return;

        const valor = input.value.trim();

        /* ===== NÚMERO DOCUMENTO ===== */
        if (input.id === 'numero_documento') {

            if (valor === '') {
                limpiar(input, feedback);
                actualizarEstadoBoton();
                return;
            }

            if (!/^\d+$/.test(valor)) {
                invalido(input, feedback, 'Solo se permiten números.');
                actualizarEstadoBoton();
                return;
            }

            if (valor.length < 6 || valor.length > 12) {
                invalido(input, feedback, 'Debe tener entre 6 y 12 dígitos.');
                actualizarEstadoBoton();
                return;
            }

            try {
                const clienteId = document.getElementById('cliente_id');

                let url = `/clientes/validar-documento/?numero=${valor}`;
                if (clienteId) {
                    url += `&cliente_id=${clienteId.value}`;
                }

                const res = await fetch(url);
                const data = await res.json();

                if (!data.valido) {
                    invalido(input, feedback, data.mensaje);
                } else {
                    valido(input, feedback);
                }
            } catch {
                invalido(input, feedback, 'Error validando el documento.');
            }

            actualizarEstadoBoton();
        }

        /* ===== NOMBRE / APELLIDO ===== */
        if (input.id === 'nombre' || input.id === 'apellido') {

            if (valor === '') {
                limpiar(input, feedback);
                actualizarEstadoBoton();
                return;
            }

            const soloLetras = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;

            if (!soloLetras.test(valor)) {
                invalido(
                    input,
                    feedback,
                    input.id === 'nombre'
                        ? 'El nombre solo puede contener letras.'
                        : 'El apellido solo puede contener letras.'
                );
            } else {
                valido(input, feedback);
            }

            actualizarEstadoBoton();
        }

        /* ===== TELÉFONO ===== */
        if (input.id === 'telefono') {

            if (valor === '') {
                limpiar(input, feedback);
                actualizarEstadoBoton();
                return;
            }

            if (!/^\d+$/.test(valor)) {
                invalido(input, feedback, 'Solo se permiten números.');
                actualizarEstadoBoton();
                return;
            }

            if (valor.length !== 10) {
                invalido(input, feedback, 'Debe tener exactamente 10 dígitos.');
                actualizarEstadoBoton();
                return;
            }

            valido(input, feedback);
            actualizarEstadoBoton();
        }

        /* ===== CORREO ===== */
        if (input.id === 'correo') {

            if (valor === '') {
                limpiar(input, feedback);
                actualizarEstadoBoton();
                return;
            }

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!emailRegex.test(valor)) {
                invalido(input, feedback, 'Correo electrónico inválido.');
            } else {
                valido(input, feedback);
            }

            actualizarEstadoBoton();
        }

        /* ===== FECHA NACIMIENTO ===== */
        if (input.id === 'fecha_nacimiento') {

            if (valor === '') {
                limpiar(input, feedback);
                actualizarEstadoBoton();
                return;
            }

            const fecha = new Date(valor);
            const hoy = new Date();

            if (fecha > hoy) {
                invalido(input, feedback, 'La fecha no puede ser futura.');
            } else {
                valido(input, feedback);
            }

            actualizarEstadoBoton();
        }

    });

    /* ===============================
       LIMPIAR TODO AL CERRAR MODAL
    =============================== */
    modal.addEventListener('hidden.bs.modal', function () {

        if (!form) return;

        form.reset();

        form.querySelectorAll('input, select, textarea').forEach(el => {
            el.value = '';
            el.defaultValue = '';
            el.classList.remove('is-valid', 'is-invalid');
        });

        form.querySelectorAll('.invalid-feedback').forEach(el => {
            el.textContent = '';
        });

        btnGuardar.disabled = true;
        btnGuardar.classList.remove('btn-dark');
        btnGuardar.classList.add('btn-secondary');
    });

    /* ===============================
       AL ABRIR MODAL → BOTÓN BLOQUEADO
    =============================== */
    modal.addEventListener('shown.bs.modal', function () {
        actualizarEstadoBoton();
    });

});

/* ===============================
   FUNCIONES REUTILIZABLES
=============================== */
function invalido(input, feedback, mensaje) {
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    feedback.textContent = mensaje;
}

function valido(input, feedback) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    feedback.textContent = '';
}

function limpiar(input, feedback) {
    input.classList.remove('is-invalid', 'is-valid');
    feedback.textContent = '';
}
document.addEventListener('DOMContentLoaded', () => {

  const numero = document.getElementById('numero_documento');
  const nombre = document.getElementById('nombre');
  const apellido = document.getElementById('apellido');
  const fecha = document.getElementById('fecha_nacimiento');
  const clienteId = document.getElementById('cliente_id')?.value;

  /* ===============================
     FUNCIONES AUX
  =============================== */
  function setError(input, mensaje) {
    input.classList.add('is-invalid');
    input.nextElementSibling.textContent = mensaje;
  }

  function setOk(input) {
    input.classList.remove('is-invalid');
    input.classList.add('is-valid');
    input.nextElementSibling.textContent = '';
  }

  /* ===============================
     VALIDAR DOCUMENTO (AJAX)
  =============================== */
  if (numero) {
    numero.addEventListener('blur', () => {

      const valor = numero.value.trim();
      if (!valor) {
        setError(numero, 'El documento es obligatorio.');
        return;
      }

      fetch(`/clientes/validar-documento/?numero=${valor}&cliente_id=${clienteId}`)
        .then(res => res.json())
        .then(data => {
          if (!data.valido) {
            setError(numero, data.mensaje);
          } else {
            setOk(numero);
          }
        });
    });
  }

  /* ===============================
     VALIDAR NOMBRE
  =============================== */
  if (nombre) {
    nombre.addEventListener('input', () => {
      const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
      if (!nombre.value.trim()) {
        setError(nombre, 'El nombre es obligatorio.');
      } else if (!regex.test(nombre.value)) {
        setError(nombre, 'Solo letras.');
      } else {
        setOk(nombre);
      }
    });
  }

  /* ===============================
     VALIDAR APELLIDO
  =============================== */
  if (apellido) {
    apellido.addEventListener('input', () => {
      const regex = /^[A-Za-zÁÉÍÓÚáéíóúÑñ\s]+$/;
      if (!apellido.value.trim()) {
        setError(apellido, 'El apellido es obligatorio.');
      } else if (!regex.test(apellido.value)) {
        setError(apellido, 'Solo letras.');
      } else {
        setOk(apellido);
      }
    });
  }

  /* ===============================
     VALIDAR FECHA
  =============================== */
  if (fecha) {
    fecha.addEventListener('change', () => {
      const hoy = new Date().toISOString().split('T')[0];
      if (!fecha.value) {
        setError(fecha, 'La fecha es obligatoria.');
      } else if (fecha.value > hoy) {
        setError(fecha, 'No puede ser futura.');
      } else {
        setOk(fecha);
      }
    });
  }

});
// document.addEventListener("DOMContentLoaded", () => {

//     if (!window.mostrarModalGestion) return;

//     const modalEl = document.getElementById("modalGestionDatos");
//     if (!modalEl) return;

//     new bootstrap.Modal(modalEl).show();

// });
document.addEventListener("DOMContentLoaded", function () {

    if (window.mostrarModalGestion === true) {
        const modalEl = document.getElementById("modalGestionDatos");

        if (modalEl) {
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        }
    }

});

document.addEventListener("DOMContentLoaded", () => {

    document
        .querySelectorAll(".btn-eliminar[data-control-eliminar]")
        .forEach(btn => {

            btn.addEventListener("click", function (e) {

                const esAdmin = this.dataset.esAdmin === "true";
                const modalId = this.dataset.modalId;

                if (esAdmin) {
                    const modalEl = document.getElementById(modalId);
                    if (!modalEl) return;
                    new bootstrap.Modal(modalEl).show();
                } else {
                    e.preventDefault();

                    const modal = document.getElementById("modalAccionNoPermitida");
                    if (!modal) return;

                    const bsModal = new bootstrap.Modal(modal);
                    bsModal.show();

                    setTimeout(() => {
                        bsModal.hide();
                        document.querySelectorAll(".modal-backdrop").forEach(b => b.remove());
                        document.body.classList.remove("modal-open");
                    }, 3500);
                }
            });

        });
});
