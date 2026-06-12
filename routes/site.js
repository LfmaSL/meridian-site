const express = require('express');
const router  = express.Router({ strict: true });
const { localeMiddleware, detectLocale, SUPPORTED } = require('../middleware/locale');
const cfg     = require('../config');

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const PAGES    = ['', 'privacy', 'terms', 'refunds'];

function getContent(locale) {
  return require(`../locales/${locale}.json`);
}

router.get('/', (req, res) => {
  res.redirect(301, `/${detectLocale(req)}/`);
});

router.get('/sitemap.xml', (req, res) => {
  const urls = SUPPORTED.flatMap((l) => PAGES.map((p) => `${BASE_URL}/${l}/${p}`));
  const xml =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls.map((u) => `  <url><loc>${u}</loc></url>`).join('\n') +
    '\n</urlset>\n';
  res.type('application/xml').send(xml);
});

router.get('/:locale', localeMiddleware, (req, res, next) => {
  if (!SUPPORTED.includes(req.params.locale)) return next();
  res.redirect(301, `/${req.params.locale}/`);
});

router.get('/:locale/', localeMiddleware, (req, res, next) => {
  if (!SUPPORTED.includes(req.params.locale)) return next();
  const { locale } = res.locals;
  res.render('pages/index', { c: getContent(locale), cfg, locale });
});

for (const page of ['privacy', 'terms', 'refunds']) {
  router.get(`/:locale/${page}`, localeMiddleware, (req, res, next) => {
    if (!SUPPORTED.includes(req.params.locale)) return next();
    const { locale } = res.locals;
    res.render(`pages/${page}`, { c: getContent(locale), cfg, locale });
  });

  router.get(`/${page}`, (req, res) => {
    res.redirect(301, `/${detectLocale(req)}/${page}`);
  });
}

module.exports = router;
