let currentPage = 1;
const PAGE_SIZE  = 10;
let respondingId = null;
const MAX_SUGERENCIAS = 5;
let partidosSelectorCache = new Map();
let arbitrosSelectorCache = new Map();
let ultimasSugerenciasArbitros = [];

document.addEventListener('DOMContentLoaded', async () => {
  initLayout('Asignaciones', 'asignaciones');

  if (auth.isCoordinador()) {
    document.getElementById('btnNuevaAsignacion').classList.remove('d-none');
    document.getElementById('sugerirArbitrosGroup')?.classList.remove('d-none');
    await cargarSelectores();
  }

  // Si se llega desde partidos.html con ?partido=ID
  const params = new URLSearchParams(window.location.search);
  if (params.has('partido') && auth.isCoordinador()) {
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
    selectPartido.innerHTML = '<option value="">Selecciona un partido...</option>';
    partidosSelectorCache = new Map();
    const lista = Array.isArray(partidos) ? partidos : (partidos?.content ?? []);
    lista.forEach(p => {
      partidosSelectorCache.set(String(p.id), p);
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.equipoLocal} vs ${p.equipoVisitante} – ${formatFecha(p.fecha)}`;
      selectPartido.appendChild(opt);
    });

    const selectArbitro = document.getElementById('asignacionArbitro');
    selectArbitro.innerHTML = '<option value="">Selecciona un árbitro...</option>';
    arbitrosSelectorCache = new Map();
    const listaA = Array.isArray(arbitros) ? arbitros : (arbitros?.content ?? []);
    listaA.forEach(a => {
      arbitrosSelectorCache.set(String(a.id), a);
      const opt = document.createElement('option');
      opt.value = a.id;
      opt.textContent = `${a.nombre} ${a.apellidos}`;
      selectArbitro.appendChild(opt);
    });
  } catch {
    // selectores vacíos si backend no disponible
  }
}

// ── Sugerencia automática de árbitros ─────────────────────────────────────────
async function sugerirArbitros() {
  const partidoId = document.getElementById('asignacionPartido').value;

  if (!partidoId) {
    showToast('Selecciona primero un partido.', 'warning');
    limpiarSugerenciasArbitros();
    return;
  }

  setSugerenciasLoading(true);
  renderSugerenciasEstado('secondary', 'bi-hourglass-split', 'Buscando árbitros recomendados...');

  try {
    const partido = await obtenerPartidoParaSugerencia(partidoId);

    if (!partido?.fecha) {
      renderSugerenciasEstado('warning', 'bi-exclamation-circle', 'Este partido no tiene fecha definida.');
      showToast('El partido debe tener fecha para poder sugerir árbitros.', 'warning');
      return;
    }

    if (!partido?.deporte) {
      renderSugerenciasEstado('warning', 'bi-exclamation-circle', 'Este partido no tiene deporte definido.');
      showToast('El partido debe tener deporte para poder sugerir árbitros.', 'warning');
      return;
    }

    const arbitrosRequeridos = Number(partido.arbitrosRequeridos ?? 1);
    const arbitrosAsignados = Number(partido.arbitrosAsignados ?? 0);
    if (arbitrosRequeridos > 0 && arbitrosAsignados >= arbitrosRequeridos) {
      renderSugerenciasEstado('info', 'bi-check-circle', 'Este partido ya tiene la cobertura arbitral completa.');
      return;
    }

    const [arbitros, asignaciones] = await Promise.all([
      cargarArbitrosCandidatos(partido),
      cargarAsignacionesParaConflictos(),
    ]);

    if (!arbitros.length) {
      renderSugerenciasEstado('warning', 'bi-exclamation-circle', 'No hay árbitros disponibles para este partido.');
      showToast('No hay árbitros disponibles para este partido.', 'warning');
      return;
    }

    arbitros
      .filter(a => a?.id)
      .forEach(a => arbitrosSelectorCache.set(String(a.id), a));

    const sugerencias = arbitros
      .map(arbitro => {
        const resultado = calcularPuntuacionArbitro(arbitro, partido, asignaciones);
        return {
          arbitro,
          puntos: resultado.puntos,
          valido: resultado.valido,
          motivos: resultado.motivos,
          motivo: explicarMotivoSugerencia(arbitro, partido, resultado),
        };
      })
      .filter(s => s.valido)
      .sort((a, b) => {
        const cargaA = Number(a.arbitro.totalPartidos ?? 0);
        const cargaB = Number(b.arbitro.totalPartidos ?? 0);
        return b.puntos - a.puntos
          || cargaA - cargaB
          || nombreCompletoArbitro(a.arbitro).localeCompare(nombreCompletoArbitro(b.arbitro), 'es');
      })
      .slice(0, MAX_SUGERENCIAS);

    if (!sugerencias.length) {
      renderSugerenciasEstado('warning', 'bi-exclamation-circle', 'No hay árbitros recomendados para este partido.');
      return;
    }

    renderSugerenciasArbitros(sugerencias);
  } catch (err) {
    renderSugerenciasEstado('danger', 'bi-exclamation-triangle', 'No se pudo obtener la lista de árbitros.');
    showToast(err.message || 'No se pudo obtener la lista de árbitros.', 'danger');
  } finally {
    setSugerenciasLoading(false);
  }
}

async function obtenerPartidoParaSugerencia(partidoId) {
  try {
    const partido = await api.partidos.getById(partidoId);
    if (partido) {
      partidosSelectorCache.set(String(partido.id), partido);
      return partido;
    }
  } catch (err) {
    const cached = partidosSelectorCache.get(String(partidoId));
    if (cached?.fecha && cached?.deporte) return cached;
    throw new Error('No se pudo cargar la información del partido.');
  }

  const cached = partidosSelectorCache.get(String(partidoId));
  if (cached) return cached;
  throw new Error('No se pudo cargar la información del partido.');
}

async function cargarArbitrosCandidatos(partido) {
  let errorDisponibles = null;

  if (partido.fecha) {
    try {
      return normalizarRespuestaLista(
        await api.arbitros.getDisponibles(encodeURIComponent(partido.fecha))
      );
    } catch (err) {
      errorDisponibles = err;
    }
  }

  try {
    return normalizarRespuestaLista(
      await api.arbitros.getAll({ disponibilidad: 'DISPONIBLE', size: 100 })
    );
  } catch (err) {
    throw errorDisponibles ?? err;
  }
}

async function cargarAsignacionesParaConflictos() {
  try {
    return normalizarRespuestaLista(await api.asignaciones.getAll({ size: 500 }));
  } catch {
    return [];
  }
}

function calcularPuntuacionArbitro(arbitro, partido, asignaciones = []) {
  let puntos = 0;
  const motivos = [];

  if (!arbitro.id) {
    return { puntos: 0, valido: false, motivos: ['Árbitro sin identificador'] };
  }

  const disponibilidad = normalizarClave(arbitro.disponibilidad ?? 'DISPONIBLE');
  if (disponibilidad !== 'DISPONIBLE') {
    return { puntos: 0, valido: false, motivos: ['No disponible'] };
  }
  puntos += 30;
  motivos.push('Disponible');

  const deporte = normalizarClave(partido.deporte);
  const competencias = getCompetenciasArbitro(arbitro).map(normalizarClave);
  if (!competencias.includes(deporte)) {
    return {
      puntos: 0,
      valido: false,
      motivos: [`No tiene competencia en ${formatClave(partido.deporte)}`],
    };
  }
  puntos += 25;
  motivos.push(`Competente en ${formatClave(partido.deporte)}`);

  if (estaAsignadoAlPartido(arbitro, partido, asignaciones)) {
    return { puntos: 0, valido: false, motivos: ['Ya asignado a este partido'] };
  }

  if (tieneConflictoHorario(arbitro, partido, asignaciones)) {
    return { puntos: 0, valido: false, motivos: ['Conflicto horario'] };
  }
  puntos += 10;
  motivos.push('Sin conflicto horario');

  const categoriaPuntos = {
    NACIONAL: 20,
    REGIONAL: 15,
    PROVINCIAL: 10,
    LOCAL: 5,
  };
  const categoria = normalizarClave(arbitro.categoria ?? '');
  puntos += categoriaPuntos[categoria] ?? 0;
  motivos.push(`Categoría ${formatClave(arbitro.categoria || 'sin categoría')}`);

  const totalPartidos = Number(arbitro.totalPartidos ?? 0);
  if (totalPartidos <= 2) {
    puntos += 15;
    motivos.push('Baja carga de partidos');
  } else if (totalPartidos <= 5) {
    puntos += 10;
    motivos.push('Carga moderada');
  } else if (totalPartidos <= 10) {
    puntos += 5;
    motivos.push('Carga alta');
  } else {
    motivos.push('Carga muy alta');
  }

  return { puntos, valido: true, motivos };
}

function tieneConflictoHorario(arbitro, partido, asignaciones = []) {
  const arbitroId = String(arbitro.id ?? '');
  const partidoId = String(partido.id ?? '');
  const fechaPartido = fechaMinutoKey(partido.fecha);
  if (!arbitroId || !fechaPartido) return false;

  return asignaciones.some(asignacion => {
    if (normalizarClave(asignacion.estado) === 'RECHAZADO') return false;
    if (String(asignacion.arbitro?.id ?? asignacion.arbitroId ?? '') !== arbitroId) return false;

    const partidoAsignado = asignacion.partido ?? {};
    const partidoAsignadoId = String(partidoAsignado.id ?? asignacion.partidoId ?? '');
    if (partidoAsignadoId && partidoAsignadoId === partidoId) return false;

    const fechaAsignada = fechaMinutoKey(partidoAsignado.fecha ?? asignacion.fecha ?? asignacion.partidoFecha);
    return fechaAsignada && fechaAsignada === fechaPartido;
  });
}

function estaAsignadoAlPartido(arbitro, partido, asignaciones = []) {
  const arbitroId = String(arbitro.id ?? '');
  const partidoId = String(partido.id ?? '');
  if (!arbitroId || !partidoId) return false;

  return asignaciones.some(asignacion => {
    if (normalizarClave(asignacion.estado) === 'RECHAZADO') return false;
    const asignacionArbitroId = String(asignacion.arbitro?.id ?? asignacion.arbitroId ?? '');
    const asignacionPartidoId = String(asignacion.partido?.id ?? asignacion.partidoId ?? '');
    return asignacionArbitroId === arbitroId && asignacionPartidoId === partidoId;
  });
}

function renderSugerenciasArbitros(sugerencias) {
  const container = document.getElementById('sugerenciasArbitrosContainer');
  ultimasSugerenciasArbitros = sugerencias;

  container.classList.remove('d-none');
  container.innerHTML = `
    <div class="suggestions-panel">
      <div class="d-flex justify-content-between align-items-center gap-2 mb-2">
        <div class="fw-semibold" style="font-size:13px">
          <i class="bi bi-stars text-primary me-1"></i>
          Árbitros sugeridos
        </div>
        <span class="text-muted" style="font-size:12px">Top ${sugerencias.length}</span>
      </div>

      <div class="d-grid gap-2">
        ${sugerencias.map((s, index) => renderSugerenciaItem(s, index)).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.btn-usar-sugerido').forEach(btn => {
    btn.addEventListener('click', () => seleccionarArbitroSugerido(btn.dataset.id));
  });
}

function renderSugerenciaItem(sugerencia, index) {
  const arbitro = sugerencia.arbitro;
  const nombre = nombreCompletoArbitro(arbitro) || 'Árbitro sin nombre';
  const competencias = getCompetenciasArbitro(arbitro).map(formatClave).join(', ') || 'Sin competencias';
  const categoria = formatClave(arbitro.categoria || 'Sin categoría');

  return `
    <div class="suggestion-item">
      <div class="suggestion-item-main">
        ${avatarHtml(arbitro.nombre ?? '?', arbitro.apellidos ?? '')}
        <div class="suggestion-item-content">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="fw-semibold">${escapeHtml(nombre)}</span>
            ${index === 0 ? '<span class="badge text-bg-success">Mejor opción</span>' : ''}
          </div>
          <div class="suggestion-meta">
            ${escapeHtml(categoria)} · ${escapeHtml(competencias)} · ${Number(arbitro.totalPartidos ?? 0)} partido${Number(arbitro.totalPartidos ?? 0) !== 1 ? 's' : ''}
          </div>
          <div class="suggestion-reason">${escapeHtml(sugerencia.motivo)}</div>
        </div>
        <div class="suggestion-actions">
          <span class="badge text-bg-primary">${sugerencia.puntos}/100</span>
          <button type="button"
                  class="btn btn-sm btn-outline-success btn-usar-sugerido"
                  data-id="${escapeHtml(String(arbitro.id))}">
            Usar
          </button>
        </div>
      </div>
    </div>
  `;
}

function seleccionarArbitroSugerido(arbitroId) {
  const select = document.getElementById('asignacionArbitro');
  const id = String(arbitroId);
  const arbitro = arbitrosSelectorCache.get(id)
    ?? ultimasSugerenciasArbitros.find(s => String(s.arbitro.id) === id)?.arbitro;

  if (!arbitro) {
    showToast('No se pudo seleccionar el árbitro sugerido.', 'danger');
    return;
  }

  const existeEnSelect = [...select.options].some(opt => String(opt.value) === id);
  if (!existeEnSelect) {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = nombreCompletoArbitro(arbitro) || `Árbitro ${id}`;
    select.appendChild(opt);
  }

  select.value = id;
  select.dispatchEvent(new Event('change'));
  showToast('Árbitro seleccionado. Pulsa "Asignar" para confirmar.');
}

function explicarMotivoSugerencia(_arbitro, _partido, resultado) {
  return (resultado.motivos ?? []).join(' · ') || 'Candidato recomendado para este partido.';
}

function renderSugerenciasEstado(type, icon, mensaje) {
  const container = document.getElementById('sugerenciasArbitrosContainer');
  container.classList.remove('d-none');
  container.innerHTML = `
    <div class="alert alert-${type} py-2 mb-0" style="font-size:13px">
      <i class="bi ${icon} me-1"></i>
      ${escapeHtml(mensaje)}
    </div>
  `;
}

function limpiarSugerenciasArbitros() {
  const container = document.getElementById('sugerenciasArbitrosContainer');
  if (!container) return;
  container.classList.add('d-none');
  container.innerHTML = '';
  ultimasSugerenciasArbitros = [];
}

function setSugerenciasLoading(isLoading) {
  const btn = document.getElementById('btnSugerirArbitros');
  if (!btn) return;

  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? '<span class="spinner-border spinner-border-sm me-1"></span> Buscando...'
    : '<i class="bi bi-stars me-1"></i> Sugerir árbitros';
}

function normalizarRespuestaLista(data) {
  if (Array.isArray(data)) return data;
  return data?.content ?? [];
}

function getCompetenciasArbitro(arbitro) {
  const competencias = arbitro.competencias ?? arbitro.deportes ?? [];
  if (!Array.isArray(competencias)) return [];

  return competencias
    .map(c => typeof c === 'string' ? c : (c?.deporte ?? c?.nombre ?? c?.codigo ?? ''))
    .filter(Boolean);
}

function nombreCompletoArbitro(arbitro) {
  return `${arbitro.nombre ?? ''} ${arbitro.apellidos ?? ''}`.trim();
}

function normalizarClave(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
    .replace(/[\s-]+/g, '_');
}

function formatClave(value) {
  const labels = {
    FUTBOL: 'Fútbol',
    BALONCESTO: 'Baloncesto',
    VOLEIBOL: 'Voleibol',
    BALONMANO: 'Balonmano',
    LOCAL: 'Local',
    PROVINCIAL: 'Provincial',
    REGIONAL: 'Regional',
    NACIONAL: 'Nacional',
  };
  const normalizada = normalizarClave(value);
  return labels[normalizada] ?? String(value ?? '—').replaceAll('_', ' ');
}

function fechaMinutoKey(fecha) {
  if (!fecha) return '';

  const date = new Date(fecha);
  if (Number.isNaN(date.getTime())) return String(fecha).slice(0, 16);

  const pad = n => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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
    limpiarSugerenciasArbitros();
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
  document.getElementById('btnSugerirArbitros')
    ?.addEventListener('click', sugerirArbitros);
  document.getElementById('asignacionPartido')
    ?.addEventListener('change', limpiarSugerenciasArbitros);
  document.getElementById('modalAsignacion')
    ?.addEventListener('hidden.bs.modal', limpiarSugerenciasArbitros);

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
