require('dotenv').config();

const express        = require('express');
const session        = require('express-session');
const passport       = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const FileStore      = require('session-file-store')(session);
const path           = require('path');

const db             = require('./db/setup');
const siteRouter     = require('./routes/site');
const authRouter     = require('./routes/auth');
const adminRouter    = require('./routes/admin');
const { SUPPORTED }  = require('./middleware/locale');

// ── Bootstrap ─────────────────────────────────────────────────────────────────

// Seed first admin from env if admins table is empty
if (process.env.ADMIN_SEED_EMAIL) {
  const count = db.prepare('SELECT COUNT(*) as n FROM admins').get().n;
  if (count === 0) {
    try {
      db.prepare('INSERT INTO admins (email, added_by) VALUES (?, ?)').run(
        process.env.ADMIN_SEED_EMAIL.trim().toLowerCase(),
        'env'
      );
      console.log(`Admin seeded: ${process.env.ADMIN_SEED_EMAIL}`);
    } catch { /* already exists */ }
  }
}

// ── Passport ──────────────────────────────────────────────────────────────────

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  `${process.env.BASE_URL}/auth/google/callback`,
    },
    (_accessToken, _refreshToken, profile, done) => {
      const email = (profile.emails?.[0]?.value || '').toLowerCase();
      const admin = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
      if (!admin) return done(null, false);

      db.prepare('UPDATE admins SET google_id = ?, name = ? WHERE email = ?')
        .run(profile.id, profile.displayName, email);

      return done(null, { id: admin.id, email, name: profile.displayName });
    }
  ));
} else {
  console.warn('GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET not set — admin auth disabled');
}

passport.serializeUser((user, done) => done(null, user.email));
passport.deserializeUser((email, done) => {
  const admin = db.prepare('SELECT id, email, name FROM admins WHERE email = ?').get(email);
  done(null, admin || false);
});

// ── App ───────────────────────────────────────────────────────────────────────

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('strict routing', true);

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  store:             new FileStore({ path: './data/sessions', retries: 1, logFn: () => {} }),
  secret:            process.env.SESSION_SECRET || 'dev-secret-change-me',
  resave:            false,
  saveUninitialized: false,
  cookie: {
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'lax',
  },
}));

app.use(passport.initialize());
app.use(passport.session());

// Make supported locales available in all templates
app.use((req, res, next) => {
  res.locals.supported = SUPPORTED;
  next();
});

// ── Routes ────────────────────────────────────────────────────────────────────

app.use('/auth',  authRouter);
app.use('/admin', adminRouter);
app.use('/',      siteRouter);

// 404
app.use((req, res) => {
  res.status(404).send('Not found');
});

// Error handler
app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).send('Internal server error');
});

// ── Listen ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Meridian site running on http://localhost:${PORT}`));
