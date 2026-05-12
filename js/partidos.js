let currentPage = 1;
const PAGE_SIZE  = 10;
let deletingId   = null;

document.addEventListener('DOMContentLoaded', async () => {
  initLayout('Partidos', 'partidos');

  // Mostrar botón "Nuevo" solo a organizadores/admin
  if (auth.isOrganizador()) {
    document.getElementById('btnNuevoPartido').classList.remove('d-none');
  }

  await loadPartidos();
  setupEventListeners();
});

// ── Carga y renderizado ───────────────────────────────────────────────────────
async function loadPartidos(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('partidosList');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">
    <div class="spinner-border spinner-border-sm text-secondary"></div>
  </td></tr>`;

  const params = buildFiltros();
  params.page = page - 1;
  params.size = PAGE_SIZE;

  try {
    const data = await api.partidos.getAll(params);
    if (!data) return;

    const partidos  = Array.isArray(data) ? data : (data.content ?? []);
    const total     = data.totalElements ?? partidos.length;

    document.getElementById('totalPartidosLabel').textContent =
      `${total} partido${total !== 1 ? 's' : ''}`;

    if (partidos.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state"><i class="bi bi-trophy"></i><p>No se encontraron partidos</p></div>
      </td></tr>`;
      renderPaginacion(0, total);
      return;
    }

    tbody.innerHTML = partidos.map(renderPartidoFila).join('');
    renderPaginacion(page, total);
    bindFilaActions();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3" style="font-size:13px">
      <i class="bi bi-exclamation-triangle me-1"></i> ${err.message}
    </td></tr>`;
  }
}

function renderPartidoFila(p) {
  const puedeEditar  = auth.isOrganizador();
  const arbitrosHtml = `${p.arbitrosAsignados ?? 0}/${p.arbitrosRequeridos ?? 1}
    ${(p.arbitrosAsignados ?? 0) < (p.arbitrosRequeridos ?? 1)
      ? '<span class="text-warning ms-1"><i class="bi bi-exclamation-circle"></i></span>'
      : '<span class="text-success ms-1"><i class="bi bi-check-circle"></i></span>'}`;

  return `
    <tr>
      <td>
        <span class="fw-medium">${p.equipoLocal ?? '—'}</span>
        <span class="text-muted mx-1">vs</span>
        <span class="fw-medium">${p.equipoVisitante ?? '—'}</span>
        <div class="text-muted" style="font-size:11px">${p.competicion ?? ''}</div>
      </td>
      <td>${formatFechaHora(p.fecha)}</td>
      <td>${p.lugar ?? '—'}</td>
      <td>${p.deporte ?? '—'}</td>
      <td>${arbitrosHtml}</td>
      <td>${formatEstado(p.estado)}</td>
      <td class="text-end">
        <div class="d-flex gap-1 justify-content-end">
          ${puedeEditar ? `
            <button class="btn btn-icon btn-outline-secondary btn-editar-partido" data-id="${p.id}" title="Editar">
              <i class="bi bi-pencil"></i>
            </button>
            <button class="btn btn-icon btn-outline-danger btn-eliminar-partido" data-id="${p.id}" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>` : ''}
          ${auth.isCoordinador() ? `
            <a href="asignaciones.html?partido=${p.id}" class="btn btn-icon btn-outline-primary" title="Asignar árbitros">
              <i class="bi bi-person-check"></i>
            </a>` : ''}
        </div>
      </td>
    </tr>`;
}

function bindFilaActions() {
  document.querySelectorAll('.btn-editar-partido').forEach(btn => {
    btn.addEventListener('click', () => abrirEditar(btn.dataset.id));
  });
  document.querySelectorAll('.btn-eliminar-partido').forEach(btn => {
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
  prev.addEventListener('click', (e) => { e.preventDefault(); if (page > 1) loadPartidos(page - 1); });
  ul.appendChild(prev);

  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === page ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    const num = i;
    li.addEventListener('click', (e) => { e.preventDefault(); loadPartidos(num); });
    ul.appendChild(li);
  }

  const next = document.createElement('li');
  next.className = `page-item ${page >= totalPages ? 'disabled' : ''}`;
  next.innerHTML = `<a class="page-link" href="#">»</a>`;
  next.addEventListener('click', (e) => { e.preventDefault(); if (page < totalPages) loadPartidos(page + 1); });
  ul.appendChild(next);
}

// ── Filtros ───────────────────────────────────────────────────────────────────
function buildFiltros() {
  const params = {};
  const texto  = document.getElementById('filtroTexto').value.trim();
  const estado = document.getElementById('filtroEstado').value;
  const desde  = document.getElementById('filtroDesde').value;
  const hasta  = document.getElementById('filtroHasta').value;
  if (texto)  params.q      = texto;
  if (estado) params.estado = estado;
  if (desde)  params.desde  = desde;
  if (hasta)  params.hasta  = hasta;
  return params;
}

// ── Modal Crear/Editar ────────────────────────────────────────────────────────
function abrirNuevo() {
  document.getElementById('modalPartidoTitle').textContent = 'Nuevo partido';
  document.getElementById('formPartido').reset();
  document.getElementById('partidoId').value = '';
}

async function abrirEditar(id) {
  document.getElementById('modalPartidoTitle').textContent = 'Editar partido';
  try {
    const p = await api.partidos.getById(id);
    if (!p) return;
    document.getElementById('partidoId').value         = p.id;
    document.getElementById('equipoLocal').value       = p.equipoLocal ?? '';
    document.getElementById('equipoVisitante').value   = p.equipoVisitante ?? '';
    document.getElementById('partidoFecha').value      = p.fecha?.split('T')[0] ?? '';
    document.getElementById('partidoHora').value       = p.fecha?.split('T')[1]?.slice(0,5) ?? '';
    document.getElementById('partidoDeporte').value    = p.deporte ?? 'FUTBOL';
    document.getElementById('partidoLugar').value      = p.lugar ?? '';
    document.getElementById('partidoCompeticion').value = p.competicion ?? '';
    document.getElementById('partidoObservaciones').value = p.observaciones ?? '';
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalPartido')).show();
  } catch (err) {
    showToast(err.message, 'danger');
  }
}

async function guardarPartido() {
  const form = document.getElementById('formPartido');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const id       = document.getElementById('partidoId').value;
  const fecha    = document.getElementById('partidoFecha').value;
  const hora     = document.getElementById('partidoHora').value;
  const data = {
    equipoLocal:      document.getElementById('equipoLocal').value.trim(),
    equipoVisitante:  document.getElementById('equipoVisitante').value.trim(),
    fecha:            fecha && hora ? `${fecha}T${hora}:00` : null,
    deporte:          document.getElementById('partidoDeporte').value,
    lugar:            document.getElementById('partidoLugar').value.trim(),
    competicion:      document.getElementById('partidoCompeticion').value.trim(),
    observaciones:    document.getElementById('partidoObservaciones').value.trim(),
  };

  const txtBtn = document.getElementById('btnGuardarPartidoText');
  const spin   = document.getElementById('btnGuardarPartidoSpinner');
  txtBtn.textContent = 'Guardando…';
  spin.classList.remove('d-none');

  try {
    if (id) {
      await api.partidos.update(id, data);
      showToast('Partido actualizado correctamente.');
    } else {
      await api.partidos.create(data);
      showToast('Partido creado correctamente.');
    }
    bootstrap.Modal.getInstance(document.getElementById('modalPartido')).hide();
    loadPartidos(currentPage);
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    txtBtn.textContent = 'Guardar';
    spin.classList.add('d-none');
  }
}

function confirmarEliminar(id) {
  deletingId = id;
  bootstrap.Modal.getOrCreateInstance(document.getElementById('modalEliminarPartido')).show();
}

async function eliminarPartido() {
  if (!deletingId) return;
  try {
    await api.partidos.delete(deletingId);
    showToast('Partido eliminado.');
    bootstrap.Modal.getInstance(document.getElementById('modalEliminarPartido')).hide();
    loadPartidos(currentPage);
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    deletingId = null;
  }
}

// ── Event Listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  document.getElementById('btnBuscar')
    ?.addEventListener('click', () => loadPartidos(1));

  document.getElementById('filtroTexto')
    ?.addEventListener('keydown', (e) => { if (e.key === 'Enter') loadPartidos(1); });

  document.getElementById('btnLimpiarFiltros')
    ?.addEventListener('click', () => {
      document.getElementById('filtroTexto').value  = '';
      document.getElementById('filtroEstado').value = '';
      document.getElementById('filtroDesde').value  = '';
      document.getElementById('filtroHasta').value  = '';
      loadPartidos(1);
    });

  document.getElementById('btnNuevoPartido')
    ?.addEventListener('click', abrirNuevo);

  document.getElementById('btnGuardarPartido')
    ?.addEventListener('click', guardarPartido);

  document.getElementById('btnConfirmarEliminarPartido')
    ?.addEventListener('click', eliminarPartido);
}
