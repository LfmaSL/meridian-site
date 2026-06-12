(function () {
  const STORAGE_KEY = 'meridian-theme';
  const root = document.documentElement;

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }

  function toggleTheme() {
    const current = root.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  }

  // Wire toggle buttons after DOM ready
  document.addEventListener('DOMContentLoaded', function () {
    const btn = document.getElementById('theme-toggle');
    if (btn) btn.addEventListener('click', toggleTheme);

    // Mobile nav
    const navToggle = document.getElementById('nav-toggle');
    const nav = navToggle && navToggle.closest('nav');
    if (navToggle && nav) {
      navToggle.addEventListener('click', function () {
        const open = nav.classList.toggle('open');
        navToggle.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('.nav-links a').forEach(function (a) {
        a.addEventListener('click', function () {
          nav.classList.remove('open');
          navToggle.setAttribute('aria-expanded', 'false');
        });
      });
    }
  });
})();
