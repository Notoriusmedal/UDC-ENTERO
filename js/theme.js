// Apply saved theme immediately to avoid flash
(function () {
  const saved = localStorage.getItem('theme') || 'light';
  document.documentElement.setAttribute('data-theme', saved);
  // Update icons once DOM is ready
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.theme-icon').forEach(function (icon) {
      icon.className = 'bi ' + (saved === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill') + ' theme-icon';
    });
  });
})();

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || 'light';
  const next = current === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
  document.querySelectorAll('.theme-icon').forEach(function (icon) {
    icon.className = 'bi ' + (next === 'dark' ? 'bi-sun-fill' : 'bi-moon-fill') + ' theme-icon';
  });
}
