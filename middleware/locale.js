const SUPPORTED = ['pt', 'en'];
const DEFAULT   = 'pt';

function detectLocale(req) {
  const accept = req.headers['accept-language'] || '';
  for (const lang of accept.split(',')) {
    const tag = lang.split(';')[0].trim().toLowerCase().slice(0, 2);
    if (SUPPORTED.includes(tag)) return tag;
  }
  return DEFAULT;
}

function localeMiddleware(req, res, next) {
  const locale = SUPPORTED.includes(req.params.locale) ? req.params.locale : DEFAULT;
  res.locals.locale    = locale;
  res.locals.supported = SUPPORTED;
  next();
}

module.exports = { localeMiddleware, detectLocale, SUPPORTED, DEFAULT };
