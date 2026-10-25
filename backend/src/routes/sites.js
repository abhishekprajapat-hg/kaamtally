const express = require('express');
const Site = require('../models/Site');
const Worker = require('../models/Worker');
const { bad } = require('../lib/http');
const { isDate } = require('../lib/dates');
const { own } = require('./_util');
const r = express.Router();

r.post('/', async (req, res) => {
  const b = req.body || {};
  if (String(b.name || '').trim().length < 2) throw bad('Please enter a site name');
  const s = await Site.create({ owner: req.user._id, name: b.name.trim(), client: b.client || '', address: b.address || '', area: b.area || b.address || '', start: isDate(b.start) ? b.start : null });
  res.status(201).json({ site: s.toClient() });
});

r.patch('/:id', async (req, res) => {
  const owner = req.user._id, b = req.body || {};
  const s = await own(Site, req.params.id, owner, 'Site');
  for (const k of ['name', 'client', 'address', 'area']) if (typeof b[k] === 'string') s[k] = b[k].trim();
  if (b.start !== undefined) s.start = isDate(b.start) ? b.start : null;
  let cleared = 0;
  if (['active', 'completed'].includes(b.status) && b.status !== s.status) {
    s.status = b.status;
    // A completed site stops being anyone's default site. Past attendance and costs are kept.
    if (b.status === 'completed') cleared = (await Worker.updateMany({ owner, site: s._id }, { $set: { site: null } })).modifiedCount || 0;
  }
  if (s.name.length < 2) throw bad('Please enter a site name');
  await s.save();
  res.json({ site: s.toClient(), cleared });
});
module.exports = r;
