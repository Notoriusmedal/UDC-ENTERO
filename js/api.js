const API_BASE_URL = 'http://localhost:8080/api';

const api = {

  async request(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('udc_token');
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const config = { method, headers };
    if (body) config.body = JSON.stringify(body);

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

      if (response.status === 401 && endpoint !== '/auth/login') {
        auth.logout();
        return null;
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.mensaje || `Error ${response.status}`);
      }

      if (response.status === 204) return null;
      return response.json();

    } catch (err) {
      if (err.name === 'TypeError') {
        // Backend no disponible
        throw new Error('No se puede conectar con el servidor. Comprueba que el backend está activo.');
      }
      throw err;
    }
  },

  get:    (endpoint)        => api.request(endpoint, 'GET'),
  post:   (endpoint, body)  => api.request(endpoint, 'POST', body),
  put:    (endpoint, body)  => api.request(endpoint, 'PUT', body),
  patch:  (endpoint, body)  => api.request(endpoint, 'PATCH', body),
  delete: (endpoint)        => api.request(endpoint, 'DELETE'),

  // ── Auth ──────────────────────────────────────────────
  auth: {
    login:  (data) => api.post('/auth/login', data),
    logout: ()     => api.post('/auth/logout'),
    me:     ()     => api.get('/auth/me'),
  },

  // ── Partidos ──────────────────────────────────────────
  partidos: {
    getAll:   (params = {}) => api.get(`/partidos?${new URLSearchParams(params)}`),
    getById:  (id)          => api.get(`/partidos/${id}`),
    create:   (data)        => api.post('/partidos', data),
    update:   (id, data)    => api.patch(`/partidos/${id}`, data),
    delete:   (id)          => api.delete(`/partidos/${id}`),
    proximos: ()            => api.get('/partidos/proximos'),
  },

  // ── Árbitros ──────────────────────────────────────────
  arbitros: {
    getAll:            (params = {}) => api.get(`/arbitros?${new URLSearchParams(params)}`),
    getById:           (id)          => api.get(`/arbitros/${id}`),
    create:            (data)        => api.post('/arbitros', data),
    update:            (id, data)    => api.put(`/arbitros/${id}`, data),
    delete:            (id)          => api.delete(`/arbitros/${id}`),
    getDisponibles:    (fecha)       => api.get(`/arbitros/disponibles?fecha=${fecha}`),
    setDisponibilidad: (id, estado)  => api.patch(`/arbitros/${id}/disponibilidad`, { estado }),
  },

  // ── Asignaciones ──────────────────────────────────────
  asignaciones: {
    getAll:    (params = {}) => api.get(`/asignaciones?${new URLSearchParams(params)}`),
    getById:   (id)          => api.get(`/asignaciones/${id}`),
    create:    (data)        => api.post('/asignaciones', data),
    update:    (id, data)    => api.put(`/asignaciones/${id}`, data),
    delete:    (id)          => api.delete(`/asignaciones/${id}`),
    pendientes: ()           => api.get('/asignaciones/pendientes'),
    confirmar: (id)          => api.patch(`/asignaciones/${id}/confirmar`),
    rechazar:  (id)          => api.patch(`/asignaciones/${id}/rechazar`),
  },

  // ── Usuarios (admin) ──────────────────────────────────
  usuarios: {
    getAll:  ()          => api.get('/admin/usuarios'),
    create:  (data)      => api.post('/admin/usuarios', data),
    update:  (id, data)  => api.put(`/admin/usuarios/${id}`, data),
  },

  // ── Dashboard ─────────────────────────────────────────
  dashboard: {
    stats:     () => api.get('/dashboard/stats'),
    actividad: () => api.get('/dashboard/actividad'),
  },
};
