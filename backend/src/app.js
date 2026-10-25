const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { requireAuth } = require('./lib/auth');
const { HttpError } = require('./lib/http');

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/me', requireAuth, require('./routes/me'));
app.use('/api/bootstrap', requireAuth, require('./routes/bootstrap'));
app.use('/api/workers', requireAuth, require('./routes/workers'));
app.use('/api/sites', requireAuth, require('./routes/sites'));
app.use('/api/attendance', requireAuth, require('./routes/attendance'));
app.use('/api/transactions', requireAuth, require('./routes/transactions'));
app.use('/api/activity', requireAuth, require('./routes/activity'));

app.use((_req, _res, next) => next(new HttpError(404, 'Not found')));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err.name === 'ValidationError') return res.status(400).json({ error: 'Please check the details and try again' });
  if (err.code === 11000) return res.status(409).json({ error: 'This entry already exists' });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Invalid request' });
  const status = err.status || 500;
  if (status >= 500) console.error(err);
  res.status(status).json({ error: status >= 500 ? 'Something went wrong. Please try again.' : err.message, ...(err.fields ? { fields: err.fields } : {}) });
});

module.exports = app;
