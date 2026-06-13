const express = require('express');
const router  = express.Router({ strict: true });
const { localeMiddleware, detectLocale, SUPPORTED } = require('../middleware/locale');
const cfg     = require('../config');

const BASE_URL    = process.env.BASE_URL || 'http://localhost:3000';
const PAGES       = ['', 'privacy', 'terms', 'refunds', 'support'];
const RESEND_URL  = 'https://api.resend.com/emails';

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

router.get('/:locale/support', localeMiddleware, (req, res, next) => {
  if (!SUPPORTED.includes(req.params.locale)) return next();
  const { locale } = res.locals;
  res.render('pages/support', { c: getContent(locale), cfg, locale, query: req.query });
});

router.post('/:locale/support', localeMiddleware, async (req, res, next) => {
  if (!SUPPORTED.includes(req.params.locale)) return next();
  const { locale } = res.locals;
  const { name, email, subject, message } = req.body || {};

  if (!name || !email || !message) {
    return res.redirect(`/${locale}/support?error=1`);
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (apiKey) {
    try {
      const r = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: `Meridian <${process.env.RESEND_FROM_EMAIL || cfg.support_email}>`,
          to:   [cfg.support_email],
          reply_to: email,
          subject: `[Support] ${subject || 'Contact form'}`,
          text: `From: ${name} <${email}>\nSubject: ${subject || 'Contact form'}\n\n${message}`,
        }),
        signal: AbortSignal.timeout(8000),
      });
      if (r.ok) return res.redirect(`/${locale}/support?sent=1`);
    } catch { /* fall through to error redirect */ }
  }

  res.redirect(`/${locale}/support?error=1`);
});

router.get('/support', (req, res) => {
  res.redirect(301, `/${detectLocale(req)}/support`);
});

module.exports = router;
