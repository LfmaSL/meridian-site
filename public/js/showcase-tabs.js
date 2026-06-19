(function () {
  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('.showcase-tabs').forEach(function (group) {
      const tabs = Array.from(group.querySelectorAll('.showcase-tab'));
      const panels = group.querySelectorAll('.showcase-panel');

      function activate(tab, focus) {
        const target = tab.getAttribute('data-tab');
        tabs.forEach(function (t) {
          const active = t === tab;
          t.classList.toggle('active', active);
          t.setAttribute('aria-selected', String(active));
          t.setAttribute('tabindex', active ? '0' : '-1');
        });
        panels.forEach(function (p) {
          p.classList.toggle('active', p.getAttribute('data-panel') === target);
        });
        if (focus) tab.focus();
      }

      tabs.forEach(function (tab, i) {
        tab.addEventListener('click', function () { activate(tab, false); });
        tab.addEventListener('keydown', function (e) {
          let next = null;
          if (e.key === 'ArrowRight') next = tabs[(i + 1) % tabs.length];
          else if (e.key === 'ArrowLeft') next = tabs[(i - 1 + tabs.length) % tabs.length];
          else if (e.key === 'Home') next = tabs[0];
          else if (e.key === 'End') next = tabs[tabs.length - 1];
          if (next) {
            e.preventDefault();
            activate(next, true);
          }
        });
      });
    });
  });
})();
