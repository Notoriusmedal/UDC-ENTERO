const ESTADO_COLORS = {
  PROGRAMADO:  '#2563eb',
  EN_CURSO:    '#16a34a',
  FINALIZADO:  '#64748b',
  CANCELADO:   '#dc2626',
  PENDIENTE:   '#d97706',
};

let calendarInstance = null;

document.addEventListener('DOMContentLoaded', async () => {
  initLayout('Calendario', 'calendario');
  initCalendar();

  document.getElementById('filtroCalendario')
    ?.addEventListener('change', () => calendarInstance?.refetchEvents());
});

function initCalendar() {
  const el = document.getElementById('calendar');

  calendarInstance = new FullCalendar.Calendar(el, {
    locale:              'es',
    initialView:         'dayGridMonth',
    headerToolbar: {
      left:   'prev,next today',
      center: 'title',
      right:  'dayGridMonth,timeGridWeek,listWeek',
    },
    buttonText: {
      today:    'Hoy',
      month:    'Mes',
      week:     'Semana',
      list:     'Lista',
    },
    height:       'auto',
    nowIndicator: true,
    selectable:   false,

    events: fetchEventos,

    eventClick(info) {
      mostrarDetallePartido(info.event);
    },

    eventDidMount(info) {
      // Tooltip con Bootstrap si se usa
      info.el.title = info.event.title;
    },
  });

  calendarInstance.render();
}

async function fetchEventos(fetchInfo, successCallback, failureCallback) {
  const filtro = document.getElementById('filtroCalendario')?.value ?? 'todos';

  try {
    const params = {
      desde: fetchInfo.startStr.split('T')[0],
      hasta: fetchInfo.endStr.split('T')[0],
      size:  500,
    };

    if (filtro === 'mis-asignaciones' && auth.isArbitro()) {
      params.arbitroId = auth.getCurrentUser()?.id;
    } else if (filtro === 'pendientes') {
      params.soloSinArbitro = true;
    }

    const data    = await api.partidos.getAll(params);
    const partidos = Array.isArray(data) ? data : (data?.content ?? []);

    const events = partidos.map(p => ({
      id:              String(p.id),
      title:           `${p.equipoLocal} vs ${p.equipoVisitante}`,
      start:           p.fecha,
      backgroundColor: ESTADO_COLORS[p.estado] ?? '#2563eb',
      borderColor:     ESTADO_COLORS[p.estado] ?? '#2563eb',
      extendedProps:   p,
    }));

    successCallback(events);
  } catch (err) {
    failureCallback(err);
  }
}

function mostrarDetallePartido(event) {
  const p = event.extendedProps;
  const modal = document.getElementById('modalDetallePartido');

  document.getElementById('detallePartidoTitle').textContent =
    `${p.equipoLocal ?? '?'} vs ${p.equipoVisitante ?? '?'}`;

  document.getElementById('detallePartidoBody').innerHTML = `
    <dl class="row mb-0" style="font-size:13px">
      <dt class="col-5 text-muted">Fecha</dt>
      <dd class="col-7">${formatFechaHora(p.fecha)}</dd>
      <dt class="col-5 text-muted">Lugar</dt>
      <dd class="col-7">${p.lugar ?? '—'}</dd>
      <dt class="col-5 text-muted">Competición</dt>
      <dd class="col-7">${p.competicion ?? '—'}</dd>
      <dt class="col-5 text-muted">Deporte</dt>
      <dd class="col-7">${p.deporte ?? '—'}</dd>
      <dt class="col-5 text-muted">Árbitros</dt>
      <dd class="col-7">${p.arbitrosAsignados ?? 0} / ${p.arbitrosRequeridos ?? 1}</dd>
      <dt class="col-5 text-muted">Estado</dt>
      <dd class="col-7">${formatEstado(p.estado)}</dd>
    </dl>`;

  // Mostrar botón de asignar solo a coordinadores y si hay árbitros pendientes
  const btnAsignar = document.getElementById('detalleAsignarBtn');
  if (auth.isCoordinador() && (p.arbitrosAsignados ?? 0) < (p.arbitrosRequeridos ?? 1)) {
    btnAsignar.href = `asignaciones.html?partido=${p.id}`;
    btnAsignar.classList.remove('d-none');
  } else {
    btnAsignar.classList.add('d-none');
  }

  bootstrap.Modal.getOrCreateInstance(modal).show();
}
