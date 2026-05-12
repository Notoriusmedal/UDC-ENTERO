let currentPage = 1;
const PAGE_SIZE  = 10;
let respondingId = null;

document.addEventListener('DOMContentLoaded', async () => {
  initLayout('Asignaciones', 'asignaciones');

  if (auth.isCoordinador()) {
    document.getElementById('btnNuevaAsignacion').classList.remove('d-none');
    await cargarSelectores();
  }

  // Si se llega desde partidos.html con ?partido=ID
  const params = new URLSearchParams(window.location.search);
  if (params.has('partido')) {
    document.getElementById('asignacionPartido').value = params.get('partido');
    bootstrap.Modal.getOrCreateInstance(document.getElementById('modalAsignacion')).show();
  }

  await loadAsignaciones();
  setupEventListeners();
});

// ── Carga y renderizado ───────────────────────────────────────────────────────
async function loadAsignaciones(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('asignacionesList');
  tbody.innerHTML = `<tr><td colspan="7" class="text-center py-4">
    <div class="spinner-border spinner-border-sm text-secondary"></div>
  </td></tr>`;

  const params = buildFiltros();
  params.page = page - 1;
  params.size = PAGE_SIZE;

  // Árbitros solo ven sus asignaciones
  if (auth.isArbitro()) {
    params.arbitroId = auth.getCurrentUser()?.id;
  }

  try {
    const data = await api.asignaciones.getAll(params);
    if (!data) return;

    const asignaciones = Array.isArray(data) ? data : (data.content ?? []);
    const total        = data.totalElements ?? asignaciones.length;

    document.getElementById('totalAsignacionesLabel').textContent =
      `${total} asignación${total !== 1 ? 'es' : ''}`;

    if (asignaciones.length === 0) {
      tbody.innerHTML = `<tr><td colspan="7">
        <div class="empty-state"><i class="bi bi-calendar-check"></i><p>No hay asignaciones</p></div>
      </td></tr>`;
      renderPaginacion(0, total);
      return;
    }

    tbody.innerHTML = asignaciones.map(renderAsignacionFila).join('');
    renderPaginacion(page, total);
    bindFilaActions();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="7" class="text-center text-danger py-3" style="font-size:13px">
      <i class="bi bi-exclamation-triangle me-1"></i> ${err.message}
    </td></tr>`;
  }
}

function renderAsignacionFila(a) {
  const partido  = a.partido  ?? {};
  const arbitro  = a.arbitro  ?? {};
  const asignadoPor = a.asignadoPor ?? {};
  const nombreArbitro = `${arbitro.nombre ?? ''} ${arbitro.apellidos ?? ''}`.trim();
  const nombreAsignado = `${asignadoPor.nombre ?? ''} ${asignadoPor.apellidos ?? ''}`.trim();

  const esArbitro = auth.isArbitro() && a.estado === 'PENDIENTE';
  const puedeEliminar = auth.isCoordinador();

  return `
    <tr>
      <td>
        <div class="fw-medium">${partido.equipoLocal ?? '—'} vs ${partido.equipoVisitante ?? '—'}</div>
        <div class="text-muted" style="font-size:11px">${partido.competicion ?? ''}</div>
      </td>
      <td>${formatFechaHora(partido.fecha)}</td>
      <td>
        <div class="d-flex align-items-center gap-2">
          ${avatarHtml(arbitro.nombre ?? '?', arbitro.apellidos ?? '')}
          <span>${nombreArbitro || '—'}</span>
        </div>
      </td>
      <td>${a.rol ?? '—'}</td>
      <td>${nombreAsignado || '—'}</td>
      <td>${formatEstado(a.estado)}</td>
      <td class="text-end">
        <div class="d-flex gap-1 justify-content-end">
          ${esArbitro ? `
            <button class="btn btn-icon btn-outline-success btn-responder-asignacion"
              data-id="${a.id}" data-accion="confirmar" title="Confirmar">
              <i class="bi bi-check-lg"></i>
            </button>
            <button class="btn btn-icon btn-outline-danger btn-responder-asignacion"
              data-id="${a.id}" data-accion="rechazar" title="Rechazar">
              <i class="bi bi-x-lg"></i>
            </button>` : ''}
          ${puedeEliminar ? `
            <button class="btn btn-icon btn-outline-danger btn-eliminar-asignacion"
              data-id="${a.id}" title="Eliminar">
              <i class="bi bi-trash"></i>
            </button>` : ''}
        </div>
      </td>
    </tr>`;
}

function bindFilaActions() {
  document.querySelectorAll('.btn-responder-asignacion').forEach(btn => {
    btn.addEventListener('click', () => {
      respondingId = btn.dataset.id;
      const accion = btn.dataset.accion;
      const modal  = document.getElementById('modalResponderAsignacion');
      document.getElementById('modalResponderTitle').textContent =
        accion === 'confirmar' ? 'Confirmar asignación' : 'Rechazar asignación';
      document.getElementById('modalResponderMsg').textContent =
        accion === 'confirmar'
          ? '¿Confirmas que puedes asistir a este partido?'
          : '¿Seguro que quieres rechazar esta asignación?';
      // Activar solo el botón de la acción correspondiente
      document.getElementById('btnConfirmarAsignacion').classList.toggle('d-none', accion !== 'confirmar');
      document.getElementById('btnRechazarAsignacion').classList.toggle('d-none',  accion !== 'rechazar');
      bootstrap.Modal.getOrCreateInstance(modal).show();
    });
  });

  document.querySelectorAll('.btn-eliminar-asignacion').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('¿Eliminar esta asignación?')) return;
      try {
        await api.asignaciones.delete(btn.dataset.id);
        showToast('Asignación eliminada.');
        loadAsignaciones(currentPage);
      } catch (err) {
        showToast(err.message, 'danger');
      }
    });
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
  prev.addEventListener('click', (e) => { e.preventDefault(); if (page > 1) loadAsignaciones(page - 1); });
  ul.appendChild(prev);

  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === page ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    const num = i;
    li.addEventListener('click', (e) => { e.preventDefault(); loadAsignaciones(num); });
    ul.appendChild(li);
  }

  const next = document.createElement('li');
  next.className = `page-item ${page >= totalPages ? 'disabled' : ''}`;
  next.innerHTML = `<a class="page-link" href="#">»</a>`;
  next.addEventListener('click', (e) => { e.preventDefault(); if (page < totalPages) loadAsignaciones(page + 1); });
  ul.appendChild(next);
}

// ── Filtros ───────────────────────────────────────────────────────────────────
function buildFiltros() {
  const params = {};
  const estado = document.getElementById('filtroEstado').value;
  const desde  = document.getElementById('filtroDesde').value;
  const hasta  = document.getElementById('filtroHasta').value;
  if (estado) params.estado = estado;
  if (desde)  params.desde  = desde;
  if (hasta)  params.hasta  = hasta;
  return params;
}

// ── Selectores del modal ──────────────────────────────────────────────────────
async function cargarSelectores() {
  try {
    const [partidos, arbitros] = await Promise.all([
      api.partidos.getAll({ estado: 'PROGRAMADO', size: 100 }),
      api.arbitros.getAll({ disponibilidad: 'DISPONIBLE', size: 100 }),
    ]);

    const selectPartido = document.getElementById('asignacionPartido');
    const lista = Array.isArray(partidos) ? partidos : (partidos?.content ?? []);
    lista.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.equipoLocal} vs ${p.equipoVisitante} – ${formatFecha(p.fecha)}`;
      selectPartido.appendChild(opt);
    });

    const selectArbitro = document.getElementById('asignacionArbitro');
    const listaA = Array.isArray(arbitros) ? arbitros : (arbitros?.content ?? []);
    listaA.forEach(a => {
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.nombre} ${a.apellidos}`;
      selectArbitro.appendChild(opt);
    });
  } catch {
    // selectores vacíos si backend no disponible
  }
}

// ── Guardar asignación ────────────────────────────────────────────────────────
async function guardarAsignacion() {
  const form = document.getElementById('formAsignacion');
  if (!form.checkValidity()) { form.reportValidity(); return; }

  const data = {
    partidoId:    document.getElementById('asignacionPartido').value,
    arbitroId:    document.getElementById('asignacionArbitro').value,
    rol:          document.getElementById('asignacionRol').value,
    observaciones: document.getElementById('asignacionObservaciones').value.trim(),
  };

  const txtBtn = document.getElementById('btnGuardarAsignacionText');
  const spin   = document.getElementById('btnGuardarAsignacionSpinner');
  txtBtn.textContent = 'Asignando…';
  spin.classList.remove('d-none');

  try {
    await api.asignaciones.create(data);
    showToast('Árbitro asignado correctamente.');
    bootstrap.Modal.getInstance(document.getElementById('modalAsignacion')).hide();
    form.reset();
    loadAsignaciones(currentPage);
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    txtBtn.textContent = 'Asignar';
    spin.classList.add('d-none');
  }
}

// ── Event Listeners ───────────────────────────────────────────────────────────
function setupEventListeners() {
  document.getElementById('btnBuscar')
    ?.addEventListener('click', () => loadAsignaciones(1));
  document.getElementById('btnLimpiarFiltros')
    ?.addEventListener('click', () => {
      document.getElementById('filtroEstado').value = '';
      document.getElementById('filtroDesde').value  = '';
      document.getElementById('filtroHasta').value  = '';
      loadAsignaciones(1);
    });
  document.getElementById('btnGuardarAsignacion')
    ?.addEventListener('click', guardarAsignacion);

  document.getElementById('btnConfirmarAsignacion')?.addEventListener('click', async () => {
    if (!respondingId) return;
    try {
      await api.asignaciones.confirmar(respondingId);
      showToast('Asignación confirmada.');
      bootstrap.Modal.getInstance(document.getElementById('modalResponderAsignacion')).hide();
      loadAsignaciones(currentPage);
    } catch (err) { showToast(err.message, 'danger'); }
  });

  document.getElementById('btnRechazarAsignacion')?.addEventListener('click', async () => {
    if (!respondingId) return;
    try {
      await api.asignaciones.rechazar(respondingId);
      showToast('Asignación rechazada.', 'warning');
      bootstrap.Modal.getInstance(document.getElementById('modalResponderAsignacion')).hide();
      loadAsignaciones(currentPage);
    } catch (err) { showToast(err.message, 'danger'); }
  });
}
