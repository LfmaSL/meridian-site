require('dotenv').config();

const express = require('express');
const path    = require('path');

const { SUPPORTED } = require('./middleware/locale');
const siteRouter    = require('./routes/site');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.set('strict routing', true);

app.use(express.static(path.join(__dirname, 'public')));

app.use((req, res, next) => {
  res.locals.supported = SUPPORTED;
  res.locals.baseUrl   = process.env.BASE_URL || 'http://localhost:3000';
  next();
});

app.use('/', siteRouter);

app.use((req, res) => {
  const locale = req.acceptsLanguages('pt', 'en') || 'pt';
  res.status(404).render('pages/404', { locale });
});

app.use((err, req, res, _next) => {
  console.error(err);
  res.status(500).send('Internal server error');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Meridian site running on http://localhost:${PORT}`));
