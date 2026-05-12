document.addEventListener('DOMContentLoaded', () => {
  // Redirigir si ya hay sesión
  if (auth.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const form         = document.getElementById('loginForm');
  const alertBox     = document.getElementById('loginAlert');
  const alertMsg     = document.getElementById('loginAlertMsg');
  const btnText      = document.getElementById('loginBtnText');
  const btnSpinner   = document.getElementById('loginSpinner');
  const toggleBtn    = document.getElementById('togglePassword');
  const passwordInput = document.getElementById('password');
  const toggleIcon   = document.getElementById('toggleIcon');

  // Mostrar/ocultar contraseña
  toggleBtn.addEventListener('click', () => {
    const isPassword = passwordInput.type === 'password';
    passwordInput.type = isPassword ? 'text' : 'password';
    toggleIcon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye';
  });

  function setLoading(loading) {
    btnText.textContent = loading ? 'Entrando...' : 'Iniciar sesión';
    btnSpinner.classList.toggle('d-none', !loading);
    form.querySelectorAll('input, button').forEach(el => el.disabled = loading);
  }

  function showError(msg) {
    alertMsg.textContent = msg;
    alertBox.classList.remove('d-none');
  }

  function hideError() {
    alertBox.classList.add('d-none');
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideError();

    const username = document.getElementById('username').value.trim();
    const password = passwordInput.value;

    if (!username || !password) {
      showError('Introduce usuario y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const ok = await auth.login(username, password);
      if (ok) {
        window.location.href = 'dashboard.html';
      } else {
        showError('Credenciales incorrectas. Inténtalo de nuevo.');
      }
    } catch (err) {
      showError(err.message ?? 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  });
});
