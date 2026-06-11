const express        = require('express');
const router         = express.Router();
const db             = require('../db/setup');
const { requireAdmin } = require('../middleware/auth');

router.use(requireAdmin);

// ── Helpers ──────────────────────────────────────────────────────────────────

function allContent() {
  const rows = db.prepare('SELECT key, locale, value FROM content_text ORDER BY key, locale').all();
  const en = {}, pt = {};
  for (const r of rows) {
    const parsed = JSON.parse(r.value);
    if (r.locale === 'en') en[r.key] = parsed;
    else                   pt[r.key] = parsed;
  }
  return { en, pt };
}

function allConfig() {
  const rows = db.prepare('SELECT key, value FROM content_config ORDER BY key').all();
  const cfg = {};
  for (const r of rows) cfg[r.key] = r.value;
  return cfg;
}

// ── Dashboard (content editor) ───────────────────────────────────────────────

router.get('/', (req, res) => {
  const { en, pt } = allContent();
  const cfg        = allConfig();
  res.render('admin/dashboard', { en, pt, cfg, user: req.user, flash: req.session.flash || null });
  delete req.session.flash;
});

// Save config values
router.post('/config', (req, res) => {
  const stmt = db.prepare(
    'INSERT INTO content_config (key, value, updated_by) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value=excluded.value, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP'
  );
  db.exec('BEGIN');
  try {
    for (const [key, value] of Object.entries(req.body)) {
      if (typeof value === 'string') stmt.run(key, value.trim(), req.user.email);
    }
    db.exec('COMMIT');
  } catch (err) { db.exec('ROLLBACK'); throw err; }
  req.session.flash = { type: 'success', msg: 'Config saved.' };
  res.redirect('/admin#config');
});

// Save a content section (one locale at a time)
router.post('/content/:locale/:section', (req, res) => {
  const { locale, section } = req.params;
  if (!['en', 'pt'].includes(locale)) return res.status(400).send('Bad locale');

  // Reconstruct value: arrays come in as repeated fields (checkboxes/multi)
  // For our use case all values are strings or arrays of strings
  const raw = req.body;
  const obj = {};
  for (const [key, val] of Object.entries(raw)) {
    obj[key] = Array.isArray(val) ? val : val;
  }

  db.prepare(
    'INSERT INTO content_text (key, locale, value, updated_by) VALUES (?, ?, ?, ?) ON CONFLICT(key, locale) DO UPDATE SET value=excluded.value, updated_by=excluded.updated_by, updated_at=CURRENT_TIMESTAMP'
  ).run(section, locale, JSON.stringify(obj), req.user.email);

  req.session.flash = { type: 'success', msg: `${section} (${locale}) saved.` };
  res.redirect(`/admin#${section}`);
});

// ── User management ───────────────────────────────────────────────────────────

router.get('/users', (req, res) => {
  const admins = db.prepare('SELECT id, email, name, added_by, added_at FROM admins ORDER BY added_at').all();
  res.render('admin/users', { admins, user: req.user, flash: req.session.flash || null });
  delete req.session.flash;
});

router.post('/users', (req, res) => {
  const email = (req.body.email || '').trim().toLowerCase();
  if (!email || !email.includes('@')) {
    req.session.flash = { type: 'error', msg: 'Invalid email.' };
    return res.redirect('/admin/users');
  }
  try {
    db.prepare('INSERT INTO admins (email, added_by) VALUES (?, ?)').run(email, req.user.email);
    req.session.flash = { type: 'success', msg: `${email} added as admin.` };
  } catch {
    req.session.flash = { type: 'error', msg: `${email} is already an admin.` };
  }
  res.redirect('/admin/users');
});

router.post('/users/:id/remove', (req, res) => {
  const target = db.prepare('SELECT id, email FROM admins WHERE id = ?').get(req.params.id);
  if (!target) return res.redirect('/admin/users');

  if (target.email === req.user.email) {
    req.session.flash = { type: 'error', msg: 'You cannot remove yourself.' };
    return res.redirect('/admin/users');
  }

  const remaining = db.prepare('SELECT COUNT(*) as n FROM admins').get().n;
  if (remaining <= 1) {
    req.session.flash = { type: 'error', msg: 'Cannot remove the last admin.' };
    return res.redirect('/admin/users');
  }

  db.prepare('DELETE FROM admins WHERE id = ?').run(req.params.id);
  req.session.flash = { type: 'success', msg: `${target.email} removed.` };
  res.redirect('/admin/users');
});

module.exports = router;
