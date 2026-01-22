document.addEventListener('DOMContentLoaded', () => {

    const botones = document.querySelectorAll('.btn-ver-detalle');

    botones.forEach(btn => {
        btn.addEventListener('click', () => {

            const set = (id, value) => {
                const el = document.getElementById(id);
                if (el) el.textContent = value || '—';
            };

            set('d-codigo', btn.dataset.codigo);
            set('d-nombre', btn.dataset.nombre);
            set('d-marca', btn.dataset.marca);
            set('d-precio', btn.dataset.precio);
            set('d-linea', btn.dataset.linea);
            set('d-presentacion', btn.dataset.presentacion);
            set('d-unidad', btn.dataset.unidad);
            set('d-estado', btn.dataset.estado);
            set('d-descripcion', btn.dataset.descripcion);
        });
    });

});
