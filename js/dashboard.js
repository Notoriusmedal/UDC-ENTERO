document.addEventListener('DOMContentLoaded', async () => {
  initLayout('Dashboard', 'dashboard');

  const user = auth.getCurrentUser();

  // Saludo personalizado
  const hour = new Date().getHours();
  const greeting = hour < 13 ? 'Buenos días' : hour < 20 ? 'Buenas tardes' : 'Buenas noches';
  document.getElementById('welcomeTitle').textContent =
    `${greeting}, ${user?.nombre ?? 'usuario'}`;

  // Fecha actual
  document.getElementById('currentDate').textContent =
    new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  // Cargar datos en paralelo
  await Promise.all([
    loadStats(),
    loadProximosPartidos(),
    loadPendientes(),
    loadActividad(),
  ]);

  renderQuickActions();
});

async function loadStats() {
  try {
    const stats = await api.dashboard.stats();
    if (!stats) return;

    document.getElementById('statPartidos').textContent        = stats.partidosSemana ?? 0;
    document.getElementById('statPartidosCambio').innerHTML    = `<i class="bi bi-arrow-up-short"></i> ${stats.partidosSemanaAnterior ?? 0} la semana pasada`;
    document.getElementById('statArbitros').textContent        = stats.arbitrosDisponibles ?? 0;
    document.getElementById('statArbitrosCambio').innerHTML    = `<i class="bi bi-people"></i> de ${stats.totalArbitros ?? 0} en total`;
    document.getElementById('statAsignaciones').textContent    = stats.asignacionesPendientes ?? 0;
    const asignacionesCambio = document.getElementById('statAsignacionesCambio');
    asignacionesCambio.innerHTML = (stats.asignacionesPendientes ?? 0) === 0
      ? '<i class="bi bi-check-circle"></i> Todo cubierto'
      : '<i class="bi bi-clock"></i> Requieren revisión';
    asignacionesCambio.className = (stats.asignacionesPendientes ?? 0) === 0
      ? 'stat-change up'
      : 'stat-change down';
    document.getElementById('statConflictos').textContent      = stats.conflictos ?? 0;

    const conflCambio = document.getElementById('statConflictosCambio');
    if ((stats.conflictos ?? 0) === 0) {
      conflCambio.textContent = 'Sin conflictos activos';
      conflCambio.className = 'stat-change up';
    } else {
      conflCambio.innerHTML = `<i class="bi bi-exclamation-circle me-1"></i>Requieren atención`;
      conflCambio.className = 'stat-change down';
    }
  } catch {
    // Si el backend no está listo, se muestran los guiones por defecto
  }
}

async function loadProximosPartidos() {
  const tbody = document.getElementById('proximosPartidosList');
  try {
    const partidos = await api.partidos.proximos();

    if (!partidos || partidos.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-state compact">
              <i class="bi bi-trophy"></i>
              <p>No hay partidos próximos</p>
            </div>
          </td>
        </tr>`;
      return;
    }

    tbody.innerHTML = partidos.slice(0, 8).map(p => `
      <tr>
        <td>
          <div class="match-name">${escapeHtml(p.equipoLocal ?? 'Local')} vs ${escapeHtml(p.equipoVisitante ?? 'Visitante')}</div>
          <div class="match-meta">${escapeHtml(p.competicion ?? 'Competición')} · ${escapeHtml(p.deporte ?? 'Deporte')}</div>
        </td>
        <td><span class="match-date">${formatFechaHora(p.fecha)}</span></td>
        <td><span class="match-location"><i class="bi bi-geo-alt"></i>${escapeHtml(p.lugar ?? 'Por definir')}</span></td>
        <td>${renderCoverage(p)}</td>
        <td>${formatEstado(p.estado)}</td>
        <td class="text-end">
          <a class="btn btn-icon btn-outline-secondary" href="partidos.html" title="Ver partido">
            <i class="bi bi-arrow-right"></i>
          </a>
        </td>
      </tr>`).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3" style="font-size:13px">
      <i class="bi bi-wifi-off me-1"></i> Backend no disponible
    </td></tr>`;
  }
}

async function loadPendientes() {
  const container = document.getElementById('pendientesList');
  try {
    const pendientes = await api.asignaciones.pendientes();

    if (!pendientes || pendientes.length === 0) {
      container.innerHTML = `
        <div class="empty-state compact">
          <i class="bi bi-check2-all"></i>
          <p class="mt-1">Sin asignaciones pendientes</p>
        </div>`;
      return;
    }

    container.innerHTML = pendientes.slice(0, 5).map(a => `
      <a class="pending-item" href="asignaciones.html">
        <div class="pending-icon"><i class="bi bi-exclamation-circle"></i></div>
        <div class="pending-content">
          <div class="pending-title">
            ${escapeHtml(a.partido?.equipoLocal ?? '?')} vs ${escapeHtml(a.partido?.equipoVisitante ?? '?')}
          </div>
          <div class="pending-meta">${formatFecha(a.partido?.fecha)} · Requiere revisión</div>
        </div>
        <i class="bi bi-arrow-right-short pending-arrow"></i>
      </a>`).join('');

    if (pendientes.length > 5) {
      container.insertAdjacentHTML('beforeend', `
        <a href="asignaciones.html" class="btn btn-sm btn-outline-warning w-100 mt-2">
          Ver todos (${pendientes.length})
        </a>`);
    }
  } catch {
    container.innerHTML = `<p class="text-muted mb-0" style="font-size:13px">
      <i class="bi bi-wifi-off me-1"></i> No disponible
    </p>`;
  }
}

function renderQuickActions() {
  const container = document.getElementById('quickActionsList');
  const actions = [];

  if (auth.isOrganizador()) {
    actions.push({ href: 'partidos.html', icon: 'bi-plus-circle', label: 'Nuevo partido', hint: 'Crear encuentro' });
  }
  if (auth.isCoordinador()) {
    actions.push({ href: 'asignaciones.html', icon: 'bi-person-check', label: 'Asignar árbitros', hint: 'Cubrir partidos' });
  }
  if (auth.isArbitro()) {
    actions.push({ href: 'asignaciones.html', icon: 'bi-calendar2-check', label: 'Mis asignaciones', hint: 'Ver pendientes' });
    actions.push({ href: 'calendario.html', icon: 'bi-calendar3', label: 'Mi calendario', hint: 'Agenda personal' });
  }
  if (auth.isAdmin()) {
    actions.push({ href: 'usuarios.html', icon: 'bi-people', label: 'Gestionar usuarios', hint: 'Roles y acceso' });
  }
  actions.push({ href: 'calendario.html', icon: 'bi-calendar3', label: 'Ver calendario', hint: 'Vista semanal' });

  container.innerHTML = actions.map(a => `
    <a href="${a.href}" class="quick-action">
      <span class="quick-action-icon"><i class="bi ${a.icon}"></i></span>
      <span>
        <strong>${a.label}</strong>
        <small>${a.hint}</small>
      </span>
    </a>`).join('');
}

async function loadActividad() {
  const container = document.getElementById('actividadRecienteList');
  if (!container) return;

  try {
    const actividad = await api.dashboard.actividad();
    const items = Array.isArray(actividad) ? actividad : [];

    if (items.length === 0) {
      container.innerHTML = `
        <div class="empty-state compact">
          <i class="bi bi-check2-circle"></i>
          <p>Todo está funcionando correctamente.</p>
        </div>`;
      return;
    }

    container.innerHTML = items.slice(0, 5).map(item => `
      <div class="activity-item">
        <div class="activity-icon"><i class="bi bi-activity"></i></div>
        <div>
          <div class="activity-title">${escapeHtml(item.titulo ?? item.mensaje ?? 'Actividad')}</div>
          <div class="activity-meta">${escapeHtml(item.descripcion ?? item.fecha ?? 'Actualizado recientemente')}</div>
        </div>
      </div>
    `).join('');
  } catch {
    container.innerHTML = `
      <div class="empty-state compact">
        <i class="bi bi-wifi-off"></i>
        <p>Actividad no disponible</p>
      </div>`;
  }
}

function renderCoverage(partido) {
  const asignados = partido.arbitrosAsignados ?? 0;
  const requeridos = partido.arbitrosRequeridos ?? 1;
  const completa = asignados >= requeridos;

  return `
    <span class="coverage-pill ${completa ? 'complete' : 'pending'}">
      <i class="bi ${completa ? 'bi-check-circle' : 'bi-exclamation-circle'}"></i>
      ${asignados}/${requeridos}
    </span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
