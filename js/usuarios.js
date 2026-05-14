let currentPage = 1;
const PAGE_SIZE = 10;
let usuariosCache = [];

document.addEventListener('DOMContentLoaded', async () => {
  initLayout('Usuarios', 'usuarios');

  if (!auth.isAdmin()) {
    document.querySelector('.main-content').innerHTML = `
      <div class="empty-state">
        <i class="bi bi-shield-lock"></i>
        <p>No tienes permisos para gestionar usuarios.</p>
      </div>`;
    return;
  }

  setupEventListeners();
  await loadUsuarios();
});

async function loadUsuarios(page = 1) {
  currentPage = page;
  const tbody = document.getElementById('usuariosList');
  tbody.innerHTML = `<tr><td colspan="6" class="text-center py-4">
    <div class="spinner-border spinner-border-sm text-secondary"></div>
  </td></tr>`;

  try {
    const data = await api.usuarios.getAll();
    usuariosCache = Array.isArray(data) ? data : (data?.content ?? []);

    const filtrados = filtrarUsuarios(usuariosCache);
    const total = filtrados.length;
    const pageItems = filtrados.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

    document.getElementById('totalUsuariosLabel').textContent =
      `${total} usuario${total !== 1 ? 's' : ''}`;

    if (pageItems.length === 0) {
      tbody.innerHTML = `<tr><td colspan="6">
        <div class="empty-state"><i class="bi bi-people"></i><p>No se encontraron usuarios</p></div>
      </td></tr>`;
      renderPaginacion(0, total);
      return;
    }

    tbody.innerHTML = pageItems.map(renderUsuarioFila).join('');
    renderPaginacion(page, total);
    bindFilaActions();
  } catch (err) {
    tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger py-3" style="font-size:13px">
      <i class="bi bi-exclamation-triangle me-1"></i> ${escapeHtml(err.message)}
    </td></tr>`;
  }
}

function filtrarUsuarios(usuarios) {
  const texto = document.getElementById('filtroTexto').value.trim().toLowerCase();
  const rol = document.getElementById('filtroRol').value;
  const estado = document.getElementById('filtroEstado').value;

  return usuarios.filter((u) => {
    const activo = u.enabled ? 'ACTIVO' : 'INACTIVO';
    const hayTexto = [
      u.username,
      u.nombre,
      u.apellidos,
      u.correo,
    ].some(value => String(value ?? '').toLowerCase().includes(texto));

    return (!texto || hayTexto)
      && (!rol || u.rol === rol)
      && (!estado || activo === estado);
  });
}

function renderUsuarioFila(u) {
  const nombre = `${u.nombre ?? ''} ${u.apellidos ?? ''}`.trim() || u.username;
  const convocable = u.rol === 'ARBITRO'
    ? (u.convocableParaSeleccionArbitral ? 'Sí' : 'No')
    : '—';

  return `
    <tr>
      <td>
        <div class="d-flex align-items-center gap-2">
          ${avatarHtml(u.nombre ?? u.username ?? '?', u.apellidos ?? '')}
          <div>
            <div class="fw-medium">${escapeHtml(nombre)}</div>
            <div class="text-muted" style="font-size:11px">@${escapeHtml(u.username ?? '')}</div>
          </div>
        </div>
      </td>
      <td>
        <div style="font-size:13px">${escapeHtml(u.correo ?? '—')}</div>
      </td>
      <td>${formatRolBadge(u.rol)}</td>
      <td>${formatEstadoUsuario(u.enabled)}</td>
      <td>${escapeHtml(convocable)}</td>
      <td class="text-end">
        <button class="btn btn-icon btn-outline-secondary btn-editar-usuario" data-id="${u.id}" title="Editar">
          <i class="bi bi-pencil"></i>
        </button>
      </td>
    </tr>`;
}

function bindFilaActions() {
  document.querySelectorAll('.btn-editar-usuario').forEach(btn => {
    btn.addEventListener('click', () => abrirEditar(btn.dataset.id));
  });
}

function renderPaginacion(page, total) {
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const info = document.getElementById('paginacionInfo');
  const ul = document.getElementById('paginacion');

  const from = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(page * PAGE_SIZE, total);
  info.textContent = total > 0 ? `Mostrando ${from}-${to} de ${total}` : '';

  ul.innerHTML = '';
  if (totalPages <= 1) return;

  const prev = document.createElement('li');
  prev.className = `page-item ${page <= 1 ? 'disabled' : ''}`;
  prev.innerHTML = `<a class="page-link" href="#">«</a>`;
  prev.addEventListener('click', (e) => {
    e.preventDefault();
    if (page > 1) loadUsuarios(page - 1);
  });
  ul.appendChild(prev);

  for (let i = Math.max(1, page - 2); i <= Math.min(totalPages, page + 2); i++) {
    const li = document.createElement('li');
    li.className = `page-item ${i === page ? 'active' : ''}`;
    li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
    li.addEventListener('click', (e) => {
      e.preventDefault();
      loadUsuarios(i);
    });
    ul.appendChild(li);
  }

  const next = document.createElement('li');
  next.className = `page-item ${page >= totalPages ? 'disabled' : ''}`;
  next.innerHTML = `<a class="page-link" href="#">»</a>`;
  next.addEventListener('click', (e) => {
    e.preventDefault();
    if (page < totalPages) loadUsuarios(page + 1);
  });
  ul.appendChild(next);
}

function abrirNuevo() {
  document.getElementById('modalUsuarioTitle').textContent = 'Nuevo usuario';
  document.getElementById('formUsuario').reset();
  document.getElementById('usuarioId').value = '';
  document.getElementById('usuarioUsername').disabled = false;
  document.getElementById('usuarioDocumento').disabled = false;
  document.getElementById('usuarioTelefono').required = true;
  document.getElementById('usuarioPassword').required = true;
  document.getElementById('passwordRequiredMark').classList.remove('d-none');
  document.getElementById('passwordHelp').textContent = 'Mínimo 6 caracteres.';
  document.getElementById('usuarioEnabled').value = 'true';
  document.getElementById('usuarioRol').value = 'ARBITRO';
  actualizarConvocable();
}

function abrirEditar(id) {
  const usuario = usuariosCache.find(u => String(u.id) === String(id));
  if (!usuario) {
    showToast('No se pudo cargar el usuario.', 'danger');
    return;
  }

  document.getElementById('modalUsuarioTitle').textContent = 'Editar usuario';
  document.getElementById('formUsuario').reset();
  document.getElementById('usuarioId').value = usuario.id;
  document.getElementById('usuarioUsername').value = usuario.username ?? '';
  document.getElementById('usuarioUsername').disabled = true;
  document.getElementById('usuarioPassword').value = '';
  document.getElementById('usuarioPassword').required = false;
  document.getElementById('passwordRequiredMark').classList.add('d-none');
  document.getElementById('passwordHelp').textContent = 'Déjala vacía para mantener la contraseña actual.';
  document.getElementById('usuarioNombre').value = usuario.nombre ?? '';
  document.getElementById('usuarioApellidos').value = usuario.apellidos ?? '';
  document.getElementById('usuarioCorreo').value = usuario.correo ?? '';
  document.getElementById('usuarioDocumento').value = '';
  document.getElementById('usuarioDocumento').disabled = true;
  document.getElementById('usuarioTelefono').value = usuario.telefono ?? '';
  document.getElementById('usuarioTelefono').required = false;
  document.getElementById('usuarioRol').value = usuario.rol ?? 'ARBITRO';
  document.getElementById('usuarioEnabled').value = String(usuario.enabled ?? true);
  document.getElementById('usuarioConvocable').checked = !!usuario.convocableParaSeleccionArbitral;
  actualizarConvocable();

  bootstrap.Modal.getOrCreateInstance(document.getElementById('modalUsuario')).show();
}

async function guardarUsuario() {
  const form = document.getElementById('formUsuario');
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const id = document.getElementById('usuarioId').value;
  const password = document.getElementById('usuarioPassword').value.trim();
  const rol = document.getElementById('usuarioRol').value;
  const telefono = document.getElementById('usuarioTelefono').value.trim();
  const convocable = rol === 'ARBITRO' && document.getElementById('usuarioConvocable').checked;

  const data = {
    nombre: document.getElementById('usuarioNombre').value.trim(),
    apellidos: document.getElementById('usuarioApellidos').value.trim(),
    correo: document.getElementById('usuarioCorreo').value.trim(),
    rol,
    convocableParaSeleccionArbitral: convocable,
  };

  if (id) {
    data.enabled = document.getElementById('usuarioEnabled').value === 'true';
    if (password) data.passwordClaroOpcional = password;
    if (telefono) data.telefono = telefono;
  } else {
    data.username = document.getElementById('usuarioUsername').value.trim();
    data.passwordClaro = password;
    data.documentoIdentidad = document.getElementById('usuarioDocumento').value.trim();
    data.telefono = telefono;
  }

  const txtBtn = document.getElementById('btnGuardarUsuarioText');
  const spin = document.getElementById('btnGuardarUsuarioSpinner');
  txtBtn.textContent = 'Guardando...';
  spin.classList.remove('d-none');

  try {
    if (id) {
      await api.usuarios.update(id, data);
      showToast('Usuario actualizado correctamente.');
    } else {
      await api.usuarios.create(data);
      showToast('Usuario creado correctamente.');
    }

    bootstrap.Modal.getInstance(document.getElementById('modalUsuario')).hide();
    await loadUsuarios(currentPage);
  } catch (err) {
    showToast(err.message, 'danger');
  } finally {
    txtBtn.textContent = 'Guardar';
    spin.classList.add('d-none');
  }
}

function actualizarConvocable() {
  const rol = document.getElementById('usuarioRol').value;
  const check = document.getElementById('usuarioConvocable');
  check.disabled = rol !== 'ARBITRO';
  if (rol !== 'ARBITRO') check.checked = false;
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

function formatEstadoUsuario(enabled) {
  return enabled
    ? '<span class="estado-badge estado-disponible">Activo</span>'
    : '<span class="estado-badge estado-no-disp">Inactivo</span>';
}

function setupEventListeners() {
  document.getElementById('btnBuscar')
    ?.addEventListener('click', () => loadUsuarios(1));
  document.getElementById('filtroTexto')
    ?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') loadUsuarios(1);
    });
  document.getElementById('btnLimpiarFiltros')
    ?.addEventListener('click', () => {
      document.getElementById('filtroTexto').value = '';
      document.getElementById('filtroRol').value = '';
      document.getElementById('filtroEstado').value = '';
      loadUsuarios(1);
    });
  document.getElementById('btnNuevoUsuario')
    ?.addEventListener('click', abrirNuevo);
  document.getElementById('btnGuardarUsuario')
    ?.addEventListener('click', guardarUsuario);
  document.getElementById('usuarioRol')
    ?.addEventListener('change', actualizarConvocable);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}
