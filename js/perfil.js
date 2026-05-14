document.addEventListener('DOMContentLoaded', async () => {
  initLayout('Mi perfil', 'perfil');
  setupPerfilEvents();
  await loadPerfil();
});

async function loadPerfil() {
  setPerfilLoading(true);

  try {
    const freshUser = await api.auth.me().catch(() => null);
    const user = freshUser
      ? auth.normalizeUser(freshUser)
      : auth.getCurrentUser();

    if (freshUser) {
      localStorage.setItem(auth.USER_KEY, JSON.stringify(user));
    }

    renderPerfil(user);
  } catch (err) {
    showToast(err.message, 'danger');
    renderPerfil(auth.getCurrentUser());
  } finally {
    setPerfilLoading(false);
  }
}

function renderPerfil(user) {
  if (!user) {
    auth.logout();
    return;
  }

  const nombre = `${user.nombre ?? ''} ${user.apellidos ?? ''}`.trim() || user.username || 'Usuario';
  const rol = user.backendRol ?? user.rol;

  document.getElementById('perfilAvatar').innerHTML = avatarHtml(user.nombre ?? user.username ?? '?', user.apellidos ?? '', 'avatar-xl');
  document.getElementById('perfilNombre').textContent = nombre;
  document.getElementById('perfilRol').innerHTML = formatRolBadge(rol);
  document.getElementById('perfilUsername').textContent = user.username ?? '—';
  document.getElementById('perfilCorreo').textContent = user.correo ?? '—';
  document.getElementById('perfilNombreDetalle').textContent = user.nombre ?? '—';
  document.getElementById('perfilApellidos').textContent = user.apellidos ?? '—';
  document.getElementById('perfilRolInterno').textContent = rol ?? '—';
  document.getElementById('perfilId').textContent = user.id ?? '—';

  renderAccesos(user.rol);
}

function renderAccesos(rol) {
  const accesos = [
    { label: 'Dashboard', icon: 'bi-speedometer2', enabled: true },
    { label: 'Partidos', icon: 'bi-trophy', enabled: true },
    { label: 'Árbitros', icon: 'bi-person-badge', enabled: rol !== 'ARBITRO' },
    { label: 'Asignaciones', icon: 'bi-calendar-check', enabled: true },
    { label: 'Calendario', icon: 'bi-calendar3', enabled: true },
    { label: 'Usuarios', icon: 'bi-people', enabled: rol === 'ADMIN' },
  ];

  document.getElementById('perfilAccesos').innerHTML = accesos.map(item => `
    <div class="col-sm-6 col-lg-4">
      <div class="profile-access ${item.enabled ? 'enabled' : 'disabled'}">
        <i class="bi ${item.icon}"></i>
        <span>${item.label}</span>
        <strong>${item.enabled ? 'Disponible' : 'Sin acceso'}</strong>
      </div>
    </div>
  `).join('');
}

function setPerfilLoading(isLoading) {
  const btn = document.getElementById('btnRecargarPerfil');
  if (!btn) return;
  btn.disabled = isLoading;
  btn.innerHTML = isLoading
    ? '<span class="spinner-border spinner-border-sm me-1"></span> Cargando'
    : '<i class="bi bi-arrow-clockwise me-1"></i> Recargar';
}

function setupPerfilEvents() {
  document.getElementById('btnRecargarPerfil')
    ?.addEventListener('click', loadPerfil);
  document.getElementById('btnCerrarSesionPerfil')
    ?.addEventListener('click', auth.logout);
}

function formatRolBadge(rol) {
  const roles = {
    ADMIN: { label: 'Administrador', css: 'bg-danger' },
    COORDINADOR_ARBITROS: { label: 'Coordinador', css: 'bg-primary' },
    COORDINADOR: { label: 'Coordinador', css: 'bg-primary' },
    ORGANIZADOR: { label: 'Organizador', css: 'bg-info text-dark' },
    ARBITRO: { label: 'Árbitro', css: 'bg-success' },
  };
  const info = roles[rol] ?? { label: rol ?? '—', css: 'bg-secondary' };
  return `<span class="badge ${info.css}">${escapeHtml(info.label)}</span>`;
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
