document.addEventListener('DOMContentLoaded', () => {
  // Si ya hay sesión activa, ir directo al dashboard
  if (auth.isAuthenticated()) {
    window.location.href = 'dashboard.html';
    return;
  }

  const SPORT_KEY = 'udc_sport_filter';
  const cards     = document.querySelectorAll('.sport-card');
  const label     = document.getElementById('selectedLabel');
  const btnEntrar = document.getElementById('btnEntrar');

  const sportLabels = {
    TODOS:      'Todos los deportes',
    FUTBOL:     'Fútbol',
    BALONCESTO: 'Baloncesto',
    VOLEIBOL:   'Voleibol',
    BALONMANO:  'Balonmano',
  };

  // Restaurar selección guardada
  const saved = localStorage.getItem(SPORT_KEY) ?? 'TODOS';
  activar(saved);

  // Eventos de selección
  cards.forEach(card => {
    card.addEventListener('click', () => {
      activar(card.dataset.deporte);
    });
  });

  function activar(deporte) {
    cards.forEach(c => c.classList.toggle('active', c.dataset.deporte === deporte));
    localStorage.setItem(SPORT_KEY, deporte);

    const nombre = sportLabels[deporte] ?? deporte;
    label.textContent = deporte === 'TODOS'
      ? 'Verás todos los deportes al entrar'
      : `Verás partidos de ${nombre} al entrar`;
  }

  // Efecto hover en el botón según deporte seleccionado
  btnEntrar.addEventListener('mouseenter', () => {
    const deporte = localStorage.getItem(SPORT_KEY) ?? 'TODOS';
    if (deporte !== 'TODOS') {
      btnEntrar.textContent = `Ver ${sportLabels[deporte]} →`;
    }
  });

  btnEntrar.addEventListener('mouseleave', () => {
    btnEntrar.innerHTML = 'Acceder a la plataforma <i class="bi bi-arrow-right ms-2"></i>';
  });
});
