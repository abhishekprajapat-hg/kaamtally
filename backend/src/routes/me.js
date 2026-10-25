const express = require('express');
const { bad } = require('../lib/http');
const r = express.Router();

// Update business profile and app settings
r.patch('/', async (req, res) => {
  const u = req.user, b = req.body || {};
  if (b.name !== undefined) { if (String(b.name).trim().length < 2) throw bad('Please enter your name'); u.name = String(b.name).trim(); }
  if (b.biz !== undefined) u.biz = String(b.biz).trim();
  if (b.city !== undefined) u.city = String(b.city).trim();
  if (b.settings && typeof b.settings === 'object') {
    for (const k of ['sundayOff', 'pastConfirm']) if (typeof b.settings[k] === 'boolean') u.settings[k] = b.settings[k];
    if (['English', 'हिंदी'].includes(b.settings.lang)) u.settings.lang = b.settings.lang;
    if (['light', 'dark', 'auto'].includes(b.settings.theme)) u.settings.theme = b.settings.theme;
  }
  if (b.backupNow) u.lastBackup = new Date();
  await u.save();
  res.json({ user: u.toClient() });
});
module.exports = r;
