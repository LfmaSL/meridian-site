repo: meridian-site
purpose: Public marketing/landing site for Meridian app
domain: meridian.pt
hosting: Railway (Node.js server)
registrar: PTisp
stack: Express + EJS + node:sqlite (built-in) · no build step · no native deps

entry: server.js
start: node server.js
dev:   node --watch server.js

---

# Architecture

  db/setup.js        — node:sqlite schema (admins, content_config, content_text)
  db/seed.js         — initial EN + PT content seed (runs once on first boot)
  middleware/
    locale.js        — extracts locale from URL prefix (/pt/, /en/)
    auth.js          — requireAdmin guard
  routes/
    auth.js          — /auth/google + callback + logout
    site.js          — /:locale/ and /:locale/privacy public pages
    admin.js         — /admin/* content editor + user management
  views/
    partials/        — head.ejs, nav.ejs, footer.ejs
    pages/           — index.ejs, privacy.ejs
    admin/           — dashboard.ejs, users.ejs
    auth/            — denied.ejs
  public/
    css/style.css    — centralized, dark/light themes via CSS custom properties
    js/theme.js      — theme toggle (localStorage, no-flash)

---

# URL structure

  /              → 301 to /pt/ or /en/ (Accept-Language)
  /pt/           → Portuguese marketing page
  /en/           → English marketing page
  /pt/privacy    → Portuguese privacy policy
  /en/privacy    → English privacy policy
  /admin         → content editor (Google OAuth protected)
  /admin/users   → admin user management
  /auth/google   → OAuth start
  /auth/logout   → POST to sign out

---

# Content model (SQLite)

  content_config (key, value)             — prices, URLs, email (not locale-specific)
  content_text   (key, locale, value)     — all page text as JSON per section per locale
  admins         (id, google_id, email, name, added_by, added_at)
  sessions stored in ./data/sessions/ (session-file-store)

  content_config keys:
    base_price · full_price · base_price_note · full_price_note
    download_url · base_buy_url · full_buy_url · support_email

  content_text section keys (each locale 'en' / 'pt'):
    meta · nav · hero · trust · story · import_sec · privacy_sec
    finance · health · automations · full_tier · pricing · download
    footer_text · privacy_page

---

# Env vars

  GOOGLE_CLIENT_ID       — from Google Cloud Console
  GOOGLE_CLIENT_SECRET   — from Google Cloud Console
  SESSION_SECRET         — random string (openssl rand -hex 32)
  ADMIN_SEED_EMAIL       — first admin email (bootstrapped on first run)
  BASE_URL               — https://meridian.pt (no trailing slash)
  PORT                   — 3000
  DB_PATH                — optional, default ./data/meridian.db

  OAuth callback to register: ${BASE_URL}/auth/google/callback

---

# Theme

  CSS custom properties in style.css:
    dark (default): --bg #0f172a, --surface #1e293b, --text #e2e8f0
    light:          --bg #f8fafc, --surface #ffffff, --text #0f172a
    accent:         #14b8a6 (same both themes)
  Toggle: data-theme attribute on <html>, stored in localStorage
  No-flash: inline script in <head> reads localStorage before CSS renders

---

# i18n

  URL-based: /pt/* and /en/*
  Default: /pt/ (auto-detect from Accept-Language header on /)
  Supported: ['en', 'pt']
  Content stored in DB (content_text), NOT in files
  Admin edits per locale via dashboard tabs

---

# Pending before launch

  placeholder-hrefs:
    download_url  → telemetry CF Worker URL (pending deployment)
    base_buy_url  → Paddle checkout URL (pending product creation)
    full_buy_url  → Paddle checkout URL (pending product creation)

  google-oauth:
    GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET → pending Console project setup
    Authorized redirect URI: https://meridian.pt/auth/google/callback
    Also add: http://localhost:3000/auth/google/callback (for dev)

  railway:
    Custom domain meridian.pt → Railway project → Networking → Custom domain
    DNS: @ and www → Railway IP/CNAME (PTisp panel)
    TLS: auto via Let's Encrypt once DNS propagates

  cname:
    current: yourdomain.com
    required: meridian.pt

---

# Content accuracy reference

  tier-matrix source of truth: C:/Dev/meridian/docs/product/tier-matrix.md
  pricing source of truth:     C:/Dev/meridian/docs/product/product-plan.md

  key facts for pricing cards:
    Trial:  31 days, free, read-only after expiry; caps: 2 accounts, 3 imports, 10 categories,
            5 habits, 5 metrics; no auto-categorisation, no phone access, no push, no encrypted backup
    Base:   €39 one-time, version-locked; everything unlimited + phone access (LAN/Tailscale),
            push notifications, health trends, backup import, debt schedules, task reminders
    Full:   €59/year, updates while active; Base + savings rate, net worth projection,
            milestone alerts, encrypted backup, admin panel, MCP server, bank sync (Edenred),
            EnableBanking (coming soon)
