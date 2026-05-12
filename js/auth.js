const auth = {
  TOKEN_KEY: 'udc_token',
  USER_KEY:  'udc_user',

  // Roles disponibles
  ROLES: {
    ADMIN:        'ADMIN',
    COORDINADOR:  'COORDINADOR',
    ORGANIZADOR:  'ORGANIZADOR',
    ARBITRO:      'ARBITRO',
  },

  // ── Usuarios de prueba (se ignoran cuando el backend responde) ──────────────
  _mockUsers: [
    { username: 'admin',        password: 'admin',  nombre: 'Admin',      apellidos: 'UDC',      rol: 'ADMIN',        id: 1 },
    { username: 'coordinador',  password: '1234',   nombre: 'Carlos',     apellidos: 'Pérez',    rol: 'COORDINADOR',  id: 2 },
    { username: 'organizador',  password: '1234',   nombre: 'Laura',      apellidos: 'Martín',   rol: 'ORGANIZADOR',  id: 3 },
    { username: 'arbitro',      password: '1234',   nombre: 'Miguel',     apellidos: 'González', rol: 'ARBITRO',      id: 4 },
  ],

  async login(username, password) {
    // Intentar login real contra el backend
    try {
      const data = await api.auth.login({ username, password });
      if (data?.token) {
        localStorage.setItem(auth.TOKEN_KEY, data.token);
        localStorage.setItem(auth.USER_KEY, JSON.stringify(data.user));
        return true;
      }
    } catch {
      // Backend no disponible → usar mock
    }

    // Fallback: usuarios de prueba locales
    const mock = auth._mockUsers.find(
      u => u.username === username && u.password === password
    );
    if (!mock) return false;

    localStorage.setItem(auth.TOKEN_KEY, `mock-token-${mock.id}`);
    const { password: _, username: __, ...user } = mock;
    localStorage.setItem(auth.USER_KEY, JSON.stringify(user));
    return true;
  },

  logout() {
    localStorage.removeItem(auth.TOKEN_KEY);
    localStorage.removeItem(auth.USER_KEY);
    window.location.href = 'login.html';
  },

  getCurrentUser() {
    const raw = localStorage.getItem(auth.USER_KEY);
    return raw ? JSON.parse(raw) : null;
  },

  getToken() {
    return localStorage.getItem(auth.TOKEN_KEY);
  },

  getRole() {
    const user = auth.getCurrentUser();
    return user?.rol ?? null;
  },

  isAuthenticated() {
    return !!auth.getToken();
  },

  requireAuth() {
    if (!auth.isAuthenticated()) {
      window.location.href = 'login.html';
    }
  },

  hasRole(...roles) {
    return roles.includes(auth.getRole());
  },

  isAdmin()        { return auth.hasRole('ADMIN'); },
  isCoordinador()  { return auth.hasRole('ADMIN', 'COORDINADOR'); },
  isOrganizador()  { return auth.hasRole('ADMIN', 'ORGANIZADOR'); },
  isArbitro()      { return auth.hasRole('ARBITRO'); },

  getRoleLabel() {
    const labels = {
      ADMIN:       'Administrador',
      COORDINADOR: 'Coordinador',
      ORGANIZADOR: 'Organizador',
      ARBITRO:     'Árbitro',
    };
    return labels[auth.getRole()] ?? auth.getRole() ?? '—';
  },
};
