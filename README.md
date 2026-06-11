# meridian-site

Public marketing site for [Meridian](https://github.com/LfmaSL/Meridian).

- **Domain**: meridian.pt (PTisp)
- **Hosting**: Railway
- **Stack**: plain HTML/CSS — no build step, edit files directly

## Files

- `index.html` — single-page site (hero, features, pricing, download)
- `privacy.html` — Privacy Policy (required for Paddle merchant approval)
- `CNAME` — custom domain config

## Before launch

- [ ] Update `CNAME` → `meridian.pt`
- [ ] Fix pricing: €29 → €39 (Base), €49 → €59 (Full) in pricing cards + buy buttons
- [ ] Fix Trial feature list: remove "encrypted backup export" (Trial = JSON export only)
- [ ] Add v1.1.0 features: task reminders, habit reminders, medication mode, toast notifications, debt/goal alerts
- [ ] Replace placeholder buy button `href="#"` with real Paddle checkout URLs (after Paddle products created)
- [ ] Replace placeholder download `href="#"` with telemetry /download URL (after CF Worker deployed)
- [ ] Replace `support@yourdomain.com` with real support email in footer + `privacy.html`
- [ ] Deploy to Railway; configure meridian.pt custom domain
