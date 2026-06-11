const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const fs   = require('fs');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../data/meridian.db');
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const db = new DatabaseSync(DB_PATH);

db.exec(`PRAGMA journal_mode = WAL`);
db.exec(`PRAGMA foreign_keys = ON`);

db.exec(`
  CREATE TABLE IF NOT EXISTS admins (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    google_id   TEXT UNIQUE,
    email       TEXT UNIQUE NOT NULL,
    name        TEXT,
    added_by    TEXT,
    added_at    TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content_config (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,
    updated_by  TEXT,
    updated_at  TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content_text (
    key         TEXT NOT NULL,
    locale      TEXT NOT NULL,
    value       TEXT NOT NULL,
    updated_by  TEXT,
    updated_at  TEXT DEFAULT (datetime('now')),
    PRIMARY KEY (key, locale)
  );
`);

// Seed defaults on first boot (skipped if content_config already has rows)
const empty = db.prepare('SELECT COUNT(*) as n FROM content_config').get().n === 0;
if (empty) {
  const CONFIG = [
    ['base_price',      '€39'],
    ['full_price',      '€59'],
    ['base_price_note', 'One-time · yours forever'],
    ['full_price_note', 'Per year · updates included while active'],
    ['download_url',    '#'],
    ['base_buy_url',    '#'],
    ['full_buy_url',    '#'],
    ['support_email',   'support@meridian.pt'],
  ];

  const EN = require('../locales/en.json');
  const PT = require('../locales/pt.json');

  const insertConfig = db.prepare('INSERT OR IGNORE INTO content_config (key, value) VALUES (?, ?)');
  const insertText   = db.prepare('INSERT OR IGNORE INTO content_text  (key, locale, value) VALUES (?, ?, ?)');

  db.exec('BEGIN');
  try {
    for (const [key, value] of CONFIG) insertConfig.run(key, value);
    for (const [key, value] of Object.entries(EN)) insertText.run(key, 'en', JSON.stringify(value));
    for (const [key, value] of Object.entries(PT)) insertText.run(key, 'pt', JSON.stringify(value));
    db.exec('COMMIT');
    console.log('DB seeded');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

module.exports = db;
