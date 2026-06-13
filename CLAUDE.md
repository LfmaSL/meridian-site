repo: meridian-site
purpose: Public marketing/landing site for Meridian app
domain: meridian.pt
hosting: Railway (Node.js server)
registrar: PTisp
stack: Express + EJS · static content from JSON files · no DB · no build step · no native deps

entry: server.js
start: node server.js
dev:   node --watch server.js

---

# Architecture

  config.js          — prices, buy/download URLs, support email (edit + commit)
  locales/en.json    — all EN page text, keyed by section
  locales/pt.json    — all PT page text (informal "tu" register, PT-PT)
  middleware/
    locale.js        — extracts locale from URL prefix (/pt/, /en/)
  routes/
    site.js          — all public pages + /sitemap.xml
  views/
    partials/        — head.ejs (SEO meta), nav.ejs, footer.ejs
    pages/           — index.ejs, privacy.ejs, terms.ejs, refunds.ejs, 404.ejs
  public/
    css/style.css    — centralized, dark/light themes via CSS custom properties
    js/theme.js      — theme toggle + mobile nav toggle
    favicon.svg · robots.txt

  content-editing: edit locales/*.json or config.js, commit, redeploy
  no admin panel, no auth, no database (removed 2026-06-12)

---

# URL structure

  /              → 301 to /pt/ or /en/ (Accept-Language)
  /:locale/      → marketing page (pt | en)
  /:locale/privacy · /:locale/terms · /:locale/refunds · /:locale/support
  /privacy /terms /refunds /support → 301 to detected locale
  /:locale/support POST → contact form handler (Resend API; requires RESEND_API_KEY)
  /sitemap.xml   → generated from BASE_URL
  anything else  → branded 404

---

# Env vars

  BASE_URL — https://meridian.pt (no trailing slash; used for canonical/hreflang/sitemap)
  PORT     — 3000

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
  Content in locales/*.json (NOT in DB)
  PT register: informal "tu" — keep consistent in all new copy
  PT dialect: PT-PT only, not PT-BR — natural European Portuguese cadence

---

# Copy voice

  marketing sections: first-person founder voice — honest, plain, direct
  story arc: too many spreadsheets → weekend script → visuals/categories →
             net worth/projections → tasks/reminders → health
  avoid: marketing fluff, passive constructions, technical jargon for general audience
  jargon to avoid (use plain alternative):
    iteration          → version
    retroactively      → back through your existing history
    cross-reference    → link to
    balance-chain validation / parse → plain description of what it checks
    French amortisation → standard amortisation
    token-authenticated → password-protected
    workbooks / multi-sheet → spreadsheets with multiple tabs
    % delta            → percentage change
  legal pages (privacy/terms/refunds): formal register, leave untouched

---

# Pending before launch

  placeholder-hrefs (config.js):
    download_url  → telemetry CF Worker URL (pending deployment)
    base_buy_url  → Paddle checkout URL (pending product creation)
    full_buy_url  → Paddle checkout URL (pending product creation)

  legal-review:
    terms_page + refunds_page content in locales/*.json is stub wording — owner review before launch
    privacy_page s2b (install ping) — verify wording matches actual telemetry behavior

  railway:
    Set BASE_URL=https://meridian.pt env var
    Set RESEND_API_KEY env var (contact form delivery)
    Set RESEND_FROM_EMAIL=hello@meridian.pt (must be verified Resend sender)
    Custom domain meridian.pt → Railway project �� Networking → Custom domain
    DNS: @ and www → Railway IP/CNAME (PTisp panel)
    TLS: auto via Let's Encrypt once DNS propagates

  marketing (needs assets):
    product screenshots — none on page, biggest conversion gap
    social proof — story section claims users with no evidence

---

# Content accuracy reference

  tier-matrix source of truth: C:/Dev/meridian/docs/product/tier-matrix.md
  pricing source of truth:     C:/Dev/meridian/docs/product/product-plan.md

  key facts for pricing cards:
    Trial:  31 days, free, read-only after expiry; caps: 2 accounts, 3 imports, 10 categories,
            5 habits, 5 metrics; no auto-categorisation, no phone access, no push, no encrypted backup
    Base:   €39 one-time, version-locked; everything unlimited + phone access (LAN/Tailscale),
            push notifications, health trends, backup import, debt schedules, task reminders
            NO encrypted backup (Full-only)
    Full:   €59/year, updates while active; Base + savings rate, net worth projection,
            milestone alerts, encrypted backup, admin panel, MCP server, bank sync (Edenred),
            EnableBanking (coming soon)
