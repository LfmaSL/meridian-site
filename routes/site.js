const express  = require('express');
const router   = express.Router({ strict: true });
const db       = require('../db/setup');
const { localeMiddleware, detectLocale, SUPPORTED, DEFAULT } = require('../middleware/locale');

function getContent(locale) {
  const rows = db.prepare('SELECT key, value FROM content_text WHERE locale = ?').all(locale);
  const c = {};
  for (const r of rows) c[r.key] = JSON.parse(r.value);
  return c;
}

function getConfig() {
  const rows = db.prepare('SELECT key, value FROM content_config').all();
  const cfg = {};
  for (const r of rows) cfg[r.key] = r.value;
  return cfg;
}

// Root: redirect to preferred locale
router.get('/', (req, res) => {
  const locale = detectLocale(req);
  res.redirect(301, `/${locale}/`);
});

// Locale root
router.get('/:locale', localeMiddleware, (req, res, next) => {
  if (!SUPPORTED.includes(req.params.locale)) return next();
  res.redirect(301, `/${req.params.locale}/`);
});

// Marketing page
router.get('/:locale/', localeMiddleware, (req, res, next) => {
  if (!SUPPORTED.includes(req.params.locale)) return next();
  const { locale } = res.locals;
  res.render('pages/index', {
    c:      getContent(locale),
    cfg:    getConfig(),
    locale,
    user:   req.user || null,
  });
});

// Privacy page
router.get('/:locale/privacy', localeMiddleware, (req, res, next) => {
  if (!SUPPORTED.includes(req.params.locale)) return next();
  const { locale } = res.locals;
  res.render('pages/privacy', {
    c:      getContent(locale),
    cfg:    getConfig(),
    locale,
    user:   req.user || null,
  });
});

// Legacy redirects for old static paths
router.get('/privacy', (req, res) => {
  res.redirect(301, `/${detectLocale(req)}/privacy`);
});

module.exports = router;
