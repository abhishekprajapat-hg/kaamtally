const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { HttpError } = require('./http');

const secret = () => process.env.JWT_SECRET || 'dev-secret-change-me';
const sign = (user) => jwt.sign({ sub: String(user._id) }, secret(), { expiresIn: process.env.JWT_EXPIRES_IN || '90d' });

async function requireAuth(req, _res, next) {
  const h = req.headers.authorization || '';
  const token = h.startsWith('Bearer ') ? h.slice(7) : null;
  if (!token) throw new HttpError(401, 'Please log in');
  let payload;
  try { payload = jwt.verify(token, secret()); } catch { throw new HttpError(401, 'Session expired — please log in again'); }
  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, 'Account not found');
  req.user = user;
  next();
}
module.exports = { sign, requireAuth };
