// ── Sidebar HTML ──────────────────────────────────────────────────────────────
function buildSidebar(activePage) {
  const user = auth.getCurrentUser();
  const role = auth.getRole();

  const navItems = [
    { page: 'dashboard',    href: 'dashboard.html',    icon: 'bi-speedometer2',   label: 'Dashboard' },
    { page: 'partidos',     href: 'partidos.html',     icon: 'bi-trophy',         label: 'Partidos' },
    { page: 'arbitros',     href: 'arbitros.html',     icon: 'bi-person-badge',   label: 'Árbitros',
      hidden: role === 'ARBITRO' },
    { page: 'asignaciones', href: 'asignaciones.html', icon: 'bi-calendar-check', label: 'Asignaciones' },
    { page: 'calendario',   href: 'calendario.html',   icon: 'bi-calendar3',      label: 'Calendario' },
  ];

  const adminItems = [
    { page: 'usuarios',     href: 'usuarios.html',     icon: 'bi-people',         label: 'Usuarios' },
  ];

  function renderItem({ page, href, icon, label, hidden }) {
    if (hidden) return '';
    const active = activePage === page ? 'active' : '';
    return `
      <li>
        <a href="${href}" class="nav-link ${active}" data-tooltip="${label}">
          <i class="bi ${icon}"></i>
          <span>${label}</span>
        </a>
      </li>`;
  }

  const adminSection = auth.isAdmin() ? `
    <li><div class="nav-section-label">Administración</div></li>
    ${adminItems.map(renderItem).join('')}
  ` : '';

  const initials = user
    ? (user.nombre?.charAt(0) ?? '') + (user.apellidos?.charAt(0) ?? '')
    : 'U';

  return `
    <nav class="sidebar" id="sidebar">
      <div class="sidebar-header">
        <div class="sidebar-logo-icon">
          <img src="assets/icons/LOGO UDC.png" alt="UDC" style="width:28px;height:28px;object-fit:contain;border-radius:4px"
               onerror="this.style.display='none';this.insertAdjacentHTML('afterend','<i class=&quot;bi bi-trophy-fill&quot; style=&quot;color:white;font-size:18px&quot;></i>')">
        </div>
        <div class="sidebar-brand-text">
          <div class="sidebar-brand">UDC</div>
          <div class="sidebar-subtitle">Deporte Canaria</div>
        </div>
      </div>

      <ul class="sidebar-nav">
        <li><div class="nav-section-label">Principal</div></li>
        ${navItems.map(renderItem).join('')}
        ${adminSection}
      </ul>

      <div class="sidebar-footer">
        <a href="#" class="nav-link" id="logoutBtn" data-tooltip="Cerrar sesión">
          <i class="bi bi-box-arrow-left"></i>
          <span>Cerrar sesión</span>
        </a>
      </div>
    </nav>`;
}

// ── Topbar HTML ───────────────────────────────────────────────────────────────
function buildTopbar(pageTitle) {
  const user = auth.getCurrentUser();
  const initials = user
    ? (user.nombre?.charAt(0) ?? '') + (user.apellidos?.charAt(0) ?? '')
    : 'U';
  const nombre = user ? `${user.nombre ?? ''} ${user.apellidos ?? ''}`.trim() : 'Usuario';

  return `
    <nav class="topbar">
      <div class="topbar-left">
        <button class="sidebar-toggle-btn" id="sidebarToggle" title="Ocultar/mostrar menú">
          <i class="bi bi-list"></i>
        </button>
        <h1 class="topbar-page-title">${pageTitle}</h1>
      </div>
      <div class="topbar-right">
        <button class="topbar-icon-btn" title="Notificaciones" id="notiBtn">
          <i class="bi bi-bell"></i>
          <span class="badge-dot d-none" id="notiBadge"></span>
        </button>
        <div class="dropdown">
          <button class="user-dropdown-toggle" data-bs-toggle="dropdown" aria-expanded="false">
            <div class="user-avatar">${initials.toUpperCase()}</div>
            <div class="user-info">
              <div class="user-info-name">${nombre}</div>
              <div class="user-info-role">${auth.getRoleLabel()}</div>
            </div>
            <i class="bi bi-chevron-down text-secondary ms-1" style="font-size:11px"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end">
            <li><h6 class="dropdown-header">${nombre}</h6></li>
            <li><span class="dropdown-item-text text-muted" style="font-size:12px">${auth.getRoleLabel()}</span></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#"><i class="bi bi-person me-2"></i>Mi perfil</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item text-danger" href="#" id="logoutDropdown"><i class="bi bi-box-arrow-left me-2"></i>Cerrar sesión</a></li>
          </ul>
        </div>
      </div>
    </nav>`;
}

// ── initLayout ────────────────────────────────────────────────────────────────
function initLayout(pageTitle, activePage) {
  auth.requireAuth();

  document.getElementById('sidebar-container').innerHTML = buildSidebar(activePage);
  document.getElementById('topbar-container').innerHTML  = buildTopbar(pageTitle);

  // Toggle sidebar
  const sidebar        = document.getElementById('sidebar');
  const contentWrapper = document.getElementById('content-wrapper');
  const overlay        = document.getElementById('sidebarOverlay');
  const toggleBtn      = document.getElementById('sidebarToggle');

  const isMobile = () => window.innerWidth <= 768;

  toggleBtn?.addEventListener('click', () => {
    if (isMobile()) {
      sidebar.classList.toggle('mobile-open');
      overlay.classList.toggle('active');
    } else {
      sidebar.classList.toggle('collapsed');
      contentWrapper.classList.toggle('expanded');
    }
  });

  overlay?.addEventListener('click', () => {
    sidebar.classList.remove('mobile-open');
    overlay.classList.remove('active');
  });

  // Logout
  document.getElementById('logoutBtn')?.addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });

  document.getElementById('logoutDropdown')?.addEventListener('click', (e) => {
    e.preventDefault();
    auth.logout();
  });
}

// ── Utilidades globales ───────────────────────────────────────────────────────
function showToast(msg, type = 'success') {
  const container = document.getElementById('toastContainer') ?? createToastContainer();
  const id = `toast-${Date.now()}`;
  const icons = { success: 'bi-check-circle-fill', danger: 'bi-x-circle-fill', warning: 'bi-exclamation-triangle-fill' };
  container.insertAdjacentHTML('beforeend', `
    <div id="${id}" class="toast align-items-center text-bg-${type} border-0" role="alert" data-bs-autohide="true" data-bs-delay="3500">
      <div class="d-flex">
        <div class="toast-body d-flex align-items-center gap-2">
          <i class="bi ${icons[type] ?? 'bi-info-circle-fill'}"></i>
          ${msg}
        </div>
        <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button>
      </div>
    </div>`);
  bootstrap.Toast.getOrCreateInstance(document.getElementById(id)).show();
}

function createToastContainer() {
  const div = document.createElement('div');
  div.id = 'toastContainer';
  div.className = 'toast-container position-fixed bottom-0 end-0 p-3';
  div.style.zIndex = '9999';
  document.body.appendChild(div);
  return div;
}

function formatFecha(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
}

function formatFechaHora(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleString('es-ES', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function formatEstado(estado) {
  const map = {
    PROGRAMADO:    { label: 'Programado',    css: 'estado-programado' },
    EN_CURSO:      { label: 'En curso',      css: 'estado-en-curso' },
    FINALIZADO:    { label: 'Finalizado',    css: 'estado-finalizado' },
    CANCELADO:     { label: 'Cancelado',     css: 'estado-cancelado' },
    PENDIENTE:     { label: 'Pendiente',     css: 'estado-pendiente' },
    CONFIRMADO:    { label: 'Confirmado',    css: 'estado-confirmado' },
    RECHAZADO:     { label: 'Cancelado',     css: 'estado-cancelado' },
    DISPONIBLE:    { label: 'Disponible',    css: 'estado-disponible' },
    NO_DISPONIBLE: { label: 'No disponible', css: 'estado-no-disp' },
  };
  const info = map[estado] ?? { label: estado ?? '—', css: '' };
  return `<span class="estado-badge ${info.css}">${info.label}</span>`;
}

function randomColor(str) {
  const colors = ['#2563eb','#7c3aed','#db2777','#16a34a','#d97706','#0891b2'];
  let hash = 0;
  for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

function avatarHtml(nombre, apellidos = '', size = '') {
  const initials = ((nombre?.charAt(0) ?? '') + (apellidos?.charAt(0) ?? '')).toUpperCase() || '?';
  const bg = randomColor(nombre + apellidos);
  return `<div class="avatar ${size}" style="background:${bg}">${initials}</div>`;
}
