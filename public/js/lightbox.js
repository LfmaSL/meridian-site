(function () {
  let overlay, overlayImg, closeBtn, lastTrigger;

  function buildOverlay() {
    overlay = document.createElement('div');
    overlay.id = 'lightbox-overlay';
    overlay.className = 'lightbox-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');

    overlayImg = document.createElement('img');
    overlay.appendChild(overlayImg);

    closeBtn = document.createElement('button');
    closeBtn.className = 'lightbox-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.textContent = '×';
    overlay.appendChild(closeBtn);

    overlay.addEventListener('click', function (e) {
      if (e.target === overlay || e.target === closeBtn) close();
    });

    document.body.appendChild(overlay);
  }

  function open(src, alt, trigger) {
    if (!overlay) buildOverlay();
    overlayImg.src = src;
    overlayImg.alt = alt || '';
    overlay.classList.add('open');
    lastTrigger = trigger || null;
    closeBtn.focus();
  }

  function close() {
    if (overlay) overlay.classList.remove('open');
    if (lastTrigger) lastTrigger.focus();
    lastTrigger = null;
  }

  document.addEventListener('DOMContentLoaded', function () {
    document.querySelectorAll('img.screenshot').forEach(function (img) {
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.addEventListener('click', function () { open(img.src, img.alt, img); });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(img.src, img.alt, img);
        }
      });
    });
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') close();
  });
})();
