let currentPage = 1;
const PAGE_SIZE  = 10;
let deletingId   = null;

document.addEventListener('DOMContentLoaded', async () => {
  initLayout('Árbitros', 'arbitros');

  if (auth.isCoordinador()) {
    document.getElementById('btnNuevoArbitro').classList.remove('d-none');
  }

  await loadArbitros();
  setupEventListeners();
});

// ── Carga y renderizado ───────────────────────────────────────────────────────
async function loadArbitros(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('arbitrosList');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">
    <div class="spinner-border spinner-border-sm text-secondary"></div>
  </td></tr>`;

  const params = buildFiltros();
  params.page = page - 1;
  params.size = PAGE_SIZE;

  try {
    const data = await api.arbitros.getAll(params);
    if (!data) return;

    const arbitros = Array.isArray(data) ? data : (data.content ?? []);
    const total    = data.totalElements ?? arbitros.length;

    document.getElementById('totalArbitrosLabel').textContent =
      `${total} árbitro${total !== 1 ? 's' : ''}`;

    if (arbitros.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state"><i class="bi bi-person-badge"></i><p>No se encontraron árbitros</p></div>
      </td></tr>`;
      renderPaginacion(0, total);
      return;
    }

    tbody.innerHTML = arbitros.map(renderArbitroFila).join('');
    renderPaginacion(page, total);
    bindFilaActions();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3" style="font-size:13px">
      <i class="bi bi-exclamation-triangle me-1"></i> ${err.message}
    </td></tr>`;
  }
}

function renderArbitroFila(a) {
  const puedeEditar = auth.isCoordinador();
  const nombre      = `${a.nombre ?? ''} ${a.apellidos ?? ''}`.trim();
  const competencias = (a.competencias ?? []).join(', ') || '—';

  return `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-2">
          ${avatarHtml(a.nombre ?? '?', a.apellidos ?? '')}
          <div>
            <div class="fw-medium">${nombre}</div>
            <div class="text-muted" style="font-size:11px">${a.licencia ?? ''}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-size:13px">${a.email ?? '—'}</div>
        <div class="text-muted" style="font-size:11px">${a.telefono ?? ''}</div>
      </td>
      <td>${a.categoria ?? '—'}</td>
      <td>${competencias}</td>
      <td>${a.totalPartidos ?? 0}</td>
      <td>${formatEstado(a.disponibilidad ?? 'DISPONIBLE')}</td>
      <td class="text-end">
        <div class="d-flex gap-1 justify-content-end">
          ${puedeEditar ? `
            <button class="btn btn-icon btn-outline-secondary btn-editar-arbitro" data-id="${a.id}" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-icon btn-outline-danger btn-eliminar-arbitro" data-id="${a.id}" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>` : ''}
        </div>
      </td>
    </tr>`;
}

function bindFilaActions() {
  document.querySelectorAll('.btn-editar-arbitro').forEach(btn => {
    btn.addEventListener('click', () => abrirEditar(btn.dataset.id));
  });
  document.querySelectorAll('.btn-eliminar-arbitro').forEach(btn => {
    btn.addEventListener('click', () => confirmarEliminar(btn.dataset.id));
  });
}

// ── Paginación ────────────────────────────────────────────────────────────────
function renderPaginacion(page, total) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const info = document.getElementById('paginacionInfo');
  const ul   = document.getElementById('paginacion');

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to   = Math.min(page * PAGE_SIZE, total);
  info.textContent = total > 0 ? `Mostrando ${from}–${to} de ${total}` : '';

  ul.innerHTML = '';
  if (totalPages <= 1) return;

  const prev = document.createElement('li');
  prev.className = `page-item ${page <= 1 ? 'disabled' : ''}`;
  prev.innerHTML = `<a class="page-link" href="#">«</a>`;
  prev.addEventListener('click', (e) => { e.preventDefault(); if (page > 1) loadArbitros(page - 1); });
  ul.appendChild(prev);

  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === page ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    const num = i;
    li.addEventListener('click', (e) => { e.preventDefault(); loadArbitros(num); });
    ul.appendChild(li);
  }

  const next = document.createElement('li');
  next.className = `page-item ${page >= totalPages ? 'disabled' : ''}`;
  next.innerHTML = `<a class="page-link" href="#">»</a>`;
  next.addEventListener('click', (e) => { e.preventDefault(); if (page < totalPages) loadArbitros(page + 1); });
  ul.appendChild(next);
}

// ── Filtros ───────────────────────────────────────────────────────────────────
function buildFiltros() {
  const params = {};
  const texto  = document.getElementById('filtroTexto').value.trim();
  const disp   = document.getElementById('filtroDisponibilidad').value;
  const cat    = document.getElementById('filtroCategoria').value;
  if (texto) params.q             = texto;
  if (disp)  params.disponibilidad = disp;
  if (cat)   params.categoria     = cat;
  return params;
}

// ── Modal Crear/Editar ────────────────────────────────────────────────────────
function abrirNuevo() {
  document.getElementById('modalArbitroTitle').textContent = 'Nuevo árbitro';
  document.getElementById('formArbitro').reset();
  document.getElementById('arbitroId').value = '';
}

async function abrirEditar(id) {
  document.getElementById('modalArbitroTitle').textContent = 'Editar árbitro';
  try {
    const a = await api.arbitros.getById(id);
    if (!a) return;
    document.getElementById('arbitroId').value           = a.id;
    document.getElementById('arbitroNombre').value       = a.nombre ?? '';
    document.getElementById('arbitroApellidos').value    = a.apellidos ?? '';
    document.getElementById('arbitroDni').value          = a.dni ?? '';
    document.getElementById('arbitroTelefono').value     = a.telefono ?? '';
    document.getElementById('arbitroEmail').value        = a.email ?? '';
    document.getElementById('arbitroCategoria').value    = a.categoria ?? 'LOCAL';
    document.getElementById('arbitroLicencia').value     = a.licencia ?? '';
    document.getElementById('arbitroDisponibilidad').value = a.disponibilidad ?? 'DISPONIBLE';
    document.getElementById('arbitroObservaciones').value  = a.observaciones ?? '';

    // Competencias checkboxes
    document.querySelectorAll('#competenciasCheck input[type=checkbox]').forEach(cb => {
      cb.checked = (a.competencias ?? []).includes(cb.value);
    });

    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalArbitro')).show();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function guardarArbitro() {
  const form = document.getElementById('formArbitro');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const id = document.getElementById('arbitroId').value;
  const competencias = [...document.querySelectorAll('#competenciasCheck input:checked')].map(cb => cb.value);

  const data = {
    nombre:         document.getElementById('arbitroNombre').value.trim(),
    apellidos:      document.getElementById('arbitroApellidos').value.trim(),
    dni:            document.getElementById('arbitroDni').value.trim(),
    telefono:       document.getElementById('arbitroTelefono').value.trim(),
    email:          document.getElementById('arbitroEmail').value.trim(),
    categoria:      document.getElementById('arbitroCategoria').value,
    licencia:       document.getElementById('arbitroLicencia').value.trim(),
    disponibilidad: document.getElementById('arbitroDisponibilidad').value,
    observaciones:  document.getElementById('arbitroObservaciones').value.trim(),
    competencias,
  };

  const txtBtn = document.getElementById('btnGuardarArbitroText');
  const spin   = document.getElementById('btnGuardarArbitroSpinner');
  txtBtn.textContent = 'Guardando…';
  spin.classList.remove('d-none');

  try {
    if (id) {
      await api.arbitros.update(id, data);
      showToast('Árbitro actualizado correctamente.');
    } else {
      await api.arbitros.create(data);
      showToast('Árbitro creado correctamente.');
    }
    bootstrap.Modal.getInstance(document.getElementById('modalArbitro')).hide();
    loadArbitros(currentPage);
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    txtBtn.textContent = 'Guardar';
    spin.classList.add('d-none');
  }
}

function confirmarEliminar(id) {
  deletingId = id;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEliminarArbitro')).show();
}

async function eliminarArbitro() {
  if (!deletingId) return;
  try {
    await api.arbitros.delete(deletingId);
    showToast('Árbitro eliminado.');
    bootstrap.Modal.getInstance(document.getElementById('modalEliminarArbitro')).hide();
    loadArbitros(currentPage);
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    deletingId = null;
  }
}

// ── Event Listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  document.getElementById('btnBuscar')
    ?.addEventListener('click', () => loadArbitros(1));
  document.getElementById('filtroTexto')
    ?.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadArbitros(1); });
  document.getElementById('btnLimpiarFiltros')
    ?.addEventListener('click', () => {
      document.getElementById('filtroTexto').value         = '';
      document.getElementById('filtroDisponibilidad').value = '';
      document.getElementById('filtroCategoria').value      = '';
      loadArbitros(1);
    });
  document.getElementById('btnNuevoArbitro')
    ?.addEventListener('click', abrirNuevo);
  document.getElementById('btnGuardarArbitro')
    ?.addEventListener('click', guardarArbitro);
  document.getElementById('btnConfirmarEliminarArbitro')
    ?.addEventListener('click', eliminarArbitro);
}
