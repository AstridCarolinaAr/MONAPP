/* ─────────────────────────────────────────────────────────────────
   lista_usuarios.js
   Lógica de la página de gestión de usuarios (modales, CRUD, switch).
   Las URLs con tags de Django se inyectan desde el HTML como:
       window.USUARIOS_URLS = { crearUsuario: "..." };
───────────────────────────────────────────────────────────────── */

/* ── Utilidad CSRF ── */
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

/* ════════════════════════════════
   MODAL: CREAR USUARIO
════════════════════════════════ */
function abrirModalUsuario() {
    const modal = document.getElementById('modalUsuario');
    const modalBody = document.getElementById('modalUsuarioBody');

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    fetch(window.USUARIOS_URLS.crearUsuario, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        modalBody.innerHTML = data.html_form;

        if (typeof inicializarValidacionesUsuario === 'function') {
            inicializarValidacionesUsuario();
        }

        const form = document.getElementById('form-crear-usuario');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                enviarFormularioUsuario(form);
            });
        }
    })
    .catch(error => {
        console.error('Error:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Error al cargar el formulario. Por favor, intenta nuevamente.
            </div>`;
    });
}

function cerrarModalUsuario() {
    document.getElementById('modalUsuario').style.display = 'none';
    document.body.style.overflow = '';
}

function enviarFormularioUsuario(form) {
    const formData = new FormData(form);
    const modalBody = document.getElementById('modalUsuarioBody');

    fetch(window.USUARIOS_URLS.crearUsuario, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cerrarModalUsuario();
            Swal.fire({
                title: '¡Creado exitosamente!',
                text: data.message,
                icon: 'success',
                confirmButtonColor: '#5d4037',
                background: '#fdfaf8',
                color: '#4b3621',
                timer: 1500,
                showConfirmButton: false
            }).then(() => location.reload());
        } else {
            modalBody.innerHTML = data.html_form;

            if (typeof inicializarValidacionesUsuario === 'function') {
                inicializarValidacionesUsuario();
            }

            const newForm = document.getElementById('form-crear-usuario');
            if (newForm) {
                newForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    enviarFormularioUsuario(newForm);
                });
            }
        }
    })
    .catch(error => {
        console.error('Error:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Error al guardar. Por favor, intenta nuevamente.
            </div>`;
    });
}

/* ════════════════════════════════
   MODAL: ELIMINAR USUARIO
════════════════════════════════ */
function abrirModalEliminarUsuario(usuarioId) {
    const csrftoken = getCookie('csrftoken');

    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#5d4037',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        background: '#fdfaf8',
        color: '#4b3621',
        showLoaderOnConfirm: true,
        preConfirm: () => {
            return fetch(`/auth/usuarios/${usuarioId}/eliminar/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrftoken,
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
            .then(response => {
                if (!response.ok) throw new Error('Error en la solicitud');
                return response.json();
            })
            .then(data => {
                if (!data.success) throw new Error(data.message || 'Error al eliminar');
                return data;
            })
            .catch(error => Swal.showValidationMessage(`Error: ${error.message}`));
        },
        allowOutsideClick: () => !Swal.isLoading()
    }).then(result => {
        if (result.isConfirmed) {
            Swal.fire({
                title: '¡Eliminado!',
                text: result.value.message || 'Usuario eliminado exitosamente',
                icon: 'success',
                confirmButtonColor: '#5d4037',
                background: '#fdfaf8',
                color: '#4b3621',
                timer: 1500,
                showConfirmButton: false
            }).then(() => location.reload());
        }
    });
}

/* ════════════════════════════════
   MODAL: DETALLE USUARIO
════════════════════════════════ */
function abrirModalDetalleUsuario(usuarioId) {
    const modal = document.getElementById('modalDetalleUsuario');
    const modalBody = document.getElementById('modalDetalleUsuarioBody');

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    fetch(`/auth/usuarios/${usuarioId}/detalle/`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        modalBody.innerHTML = data.html_content;
    })
    .catch(error => {
        console.error('Error:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Error al cargar la información. Intenta nuevamente.
            </div>`;
    });
}

function cerrarModalDetalleUsuario() {
    document.getElementById('modalDetalleUsuario').style.display = 'none';
    document.body.style.overflow = '';
}

/* ════════════════════════════════
   MODAL: EDITAR USUARIO
════════════════════════════════ */
function _configurarPreviewFoto(formSelector) {
    const fotoPerfil = document.querySelector(`${formSelector} input[name="foto_perfil"]`);
    if (!fotoPerfil) return;

    fotoPerfil.addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            const preview = document.getElementById('preview-foto-editar');
            const container = document.getElementById('preview-foto-editar-container');
            const icon = container ? container.querySelector('i') : null;
            if (preview) { preview.src = e.target.result; preview.style.display = 'block'; }
            if (icon) { icon.style.display = 'none'; }
        };
        reader.readAsDataURL(file);
    });
}

function abrirModalEditarUsuario(usuarioId) {
    const modal = document.getElementById('modalEditarUsuario');
    const modalBody = document.getElementById('modalEditarUsuarioBody');

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';

    fetch(`/auth/usuarios/${usuarioId}/editar/`, {
        method: 'GET',
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
    .then(response => response.json())
    .then(data => {
        modalBody.innerHTML = data.html_form;

        const form = document.getElementById('form-editar-usuario');
        if (form) {
            form.addEventListener('submit', function (e) {
                e.preventDefault();
                enviarFormularioEditarUsuario(form, usuarioId);
            });
        }

        _configurarPreviewFoto('#form-editar-usuario');

        setTimeout(() => {
            if (typeof window.inicializarValidacionesEditarUsuario === 'function') {
                window.inicializarValidacionesEditarUsuario();
            }
        }, 200);
    })
    .catch(error => {
        console.error('Error:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Error al cargar el formulario. Por favor, intenta nuevamente.
            </div>`;
    });
}

function cerrarModalEditarUsuario() {
    document.getElementById('modalEditarUsuario').style.display = 'none';
    document.body.style.overflow = '';
}

function enviarFormularioEditarUsuario(form, usuarioId) {
    const formData = new FormData(form);
    const modalBody = document.getElementById('modalEditarUsuarioBody');

    fetch(`/auth/usuarios/${usuarioId}/editar/`, {
        method: 'POST',
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            cerrarModalEditarUsuario();
            Swal.fire({
                title: '¡Actualizado exitosamente!',
                text: data.message,
                icon: 'success',
                confirmButtonColor: '#5d4037',
                background: '#fdfaf8',
                color: '#4b3621',
                timer: 1500,
                showConfirmButton: false
            }).then(() => location.reload());
        } else {
            modalBody.innerHTML = data.html_form;

            const newForm = document.getElementById('form-editar-usuario');
            if (newForm) {
                newForm.addEventListener('submit', function (e) {
                    e.preventDefault();
                    enviarFormularioEditarUsuario(newForm, usuarioId);
                });
            }

            _configurarPreviewFoto('#form-editar-usuario');

            setTimeout(() => {
                if (typeof window.inicializarValidacionesEditarUsuario === 'function') {
                    window.inicializarValidacionesEditarUsuario();
                }
            }, 200);
        }
    })
    .catch(error => {
        console.error('Error:', error);
        modalBody.innerHTML = `
            <div class="alert alert-danger">
                <i class="bi bi-exclamation-triangle-fill me-2"></i>
                Error al guardar. Por favor, intenta nuevamente.
            </div>`;
    });
}

/* ════════════════════════════════
   EVENT DELEGATION & TECLADO
════════════════════════════════ */
document.addEventListener('click', function (e) {
    if (e.target.closest('.btn-detalle-usuario')) {
        const btn = e.target.closest('.btn-detalle-usuario');
        abrirModalDetalleUsuario(btn.getAttribute('data-usuario-id'));
    }
    if (e.target.closest('.btn-editar-usuario')) {
        const btn = e.target.closest('.btn-editar-usuario');
        abrirModalEditarUsuario(btn.getAttribute('data-usuario-id'));
    }
    if (e.target.closest('.btn-eliminar-usuario')) {
        const btn = e.target.closest('.btn-eliminar-usuario');
        abrirModalEliminarUsuario(btn.getAttribute('data-usuario-id'));
    }
});

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        cerrarModalUsuario();
        cerrarModalEditarUsuario();
        cerrarModalDetalleUsuario();
    }
});

/* ════════════════════════════════
   SWITCH ACTIVO / INACTIVO
════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
    const toggleCheckboxes = document.querySelectorAll('.toggle-activo-usuario-checkbox');

    toggleCheckboxes.forEach(checkbox => {
        checkbox.addEventListener('change', function () {
            const usuarioId = this.dataset.usuarioId;
            const usuarioNombre = this.dataset.usuarioNombre;
            const isChecked = this.checked;
            const switchEl = this;

            switchEl.disabled = true;

            fetch(`/auth/usuarios/${usuarioId}/toggle-activo/`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken'),
                    'X-Requested-With': 'XMLHttpRequest',
                },
            })
            .then(response => response.json())
            .then(data => {
                switchEl.disabled = false;
                if (data.success) {
                    Swal.fire({
                        title: '¡Estado actualizado!',
                        text: `${usuarioNombre} ahora ${data.activo ? 'está activo' : 'ya no está activo'}`,
                        icon: 'success',
                        confirmButtonColor: '#5d4037',
                        background: '#fdfaf8',
                        color: '#4b3621',
                        timer: 2000,
                        showConfirmButton: false
                    });
                } else {
                    switchEl.checked = !isChecked;
                    Swal.fire({
                        title: 'Error',
                        text: data.mensaje || 'Error al cambiar el estado',
                        icon: 'error',
                        confirmButtonColor: '#5d4037',
                        background: '#fdfaf8',
                        color: '#4b3621'
                    });
                }
            })
            .catch(error => {
                console.error('Error:', error);
                switchEl.checked = !isChecked;
                switchEl.disabled = false;
                Swal.fire({
                    title: 'Error de conexión',
                    text: 'No se pudo cambiar el estado. Intenta nuevamente.',
                    icon: 'error',
                    confirmButtonColor: '#5d4037',
                    background: '#fdfaf8',
                    color: '#4b3621'
                });
            });
        });
    });
});
