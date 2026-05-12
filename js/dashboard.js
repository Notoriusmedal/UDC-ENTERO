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
          <td colspan="4">
            <div class="empty-state">
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
          <div style="font-weight:500">${p.equipoLocal} vs ${p.equipoVisitante}</div>
          <div class="text-muted" style="font-size:11px">${p.competicion ?? ''} · ${p.deporte ?? ''}</div>
        </td>
        <td>${formatFechaHora(p.fecha)}</td>
        <td>
          ${p.arbitrosAsignados ?? 0} / ${p.arbitrosRequeridos ?? 1}
          ${(p.arbitrosAsignados ?? 0) < (p.arbitrosRequeridos ?? 1)
            ? '<span class="ms-1 text-warning"><i class="bi bi-exclamation-circle"></i></span>'
            : '<span class="ms-1 text-success"><i class="bi bi-check-circle"></i></span>'}
        </td>
        <td>${formatEstado(p.estado)}</td>
      </tr>`).join('');
  } catch {
    tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-3" style="font-size:13px">
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
        <div class="empty-state" style="padding:20px 0">
          <i class="bi bi-check2-all" style="font-size:28px; opacity:0.3; display:block"></i>
          <p class="mt-1">Sin asignaciones pendientes</p>
        </div>`;
      return;
    }

    container.innerHTML = pendientes.slice(0, 5).map(a => `
      <div class="notification-item">
        <div class="notification-dot bg-warning"></div>
        <div>
          <div class="notification-text">
            ${a.partido?.equipoLocal ?? '?'} vs ${a.partido?.equipoVisitante ?? '?'}
          </div>
          <div class="notification-time">${formatFecha(a.partido?.fecha)}</div>
        </div>
      </div>`).join('');

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
    actions.push({ href: 'partidos.html', icon: 'bi-plus-circle', label: 'Nuevo partido', color: 'primary' });
  }
  if (auth.isCoordinador()) {
    actions.push({ href: 'asignaciones.html', icon: 'bi-person-check', label: 'Asignar árbitros', color: 'success' });
  }
  if (auth.isArbitro()) {
    actions.push({ href: 'asignaciones.html', icon: 'bi-calendar2-check', label: 'Mis asignaciones', color: 'primary' });
    actions.push({ href: 'calendario.html', icon: 'bi-calendar3', label: 'Mi calendario', color: 'info' });
  }
  if (auth.isAdmin()) {
    actions.push({ href: 'usuarios.html', icon: 'bi-people', label: 'Gestionar usuarios', color: 'secondary' });
  }
  actions.push({ href: 'calendario.html', icon: 'bi-calendar3', label: 'Ver calendario', color: 'outline-primary' });

  container.innerHTML = actions.map(a => `
    <a href="${a.href}" class="btn btn-${a.color} btn-sm text-start">
      <i class="bi ${a.icon} me-2"></i>${a.label}
    </a>`).join('');
}
