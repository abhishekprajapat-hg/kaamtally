const express = require('express');
const Worker = require('../models/Worker');
const Site = require('../models/Site');
const Attendance = require('../models/Attendance');
const Activity = require('../models/Activity');
const { bad } = require('../lib/http');
const { today, isDate } = require('../lib/dates');
const { rateOn } = require('../lib/wages');
const { own, isId, inr } = require('./_util');
const r = express.Router();

async function validate(owner, b, id) {
  const e = {};
  const wage = parseInt(b.wage, 10);
  if (String(b.name || '').trim().length < 2) e.name = 'Please enter a name (at least 2 letters)';
  if (!/^[6-9]\d{9}$/.test(b.mobile || '')) e.mobile = 'Enter a valid 10-digit mobile number (starts with 6–9)';
  else if (await Worker.exists({ owner, mobile: b.mobile, ...(id ? { _id: { $ne: id } } : {}) })) e.mobile = 'This number already belongs to another worker';
  if (!(wage >= 100 && wage <= 5000)) e.wage = 'Daily wage must be between ₹100 and ₹5,000';
  if (!['karigar', 'majdoor'].includes(b.cat)) e.cat = 'Choose the type of work';
  if (!isDate(b.joined) || b.joined > today()) e.joined = 'Choose a joining date (today or earlier)';
  if (b.site && !(isId(b.site) && await Site.exists({ _id: b.site, owner }))) e.site = 'Choose a valid site';
  if (Object.keys(e).length) throw bad('Please fix the highlighted fields', e);
  return wage;
}

r.post('/', async (req, res) => {
  const owner = req.user._id, b = req.body || {};
  const wage = await validate(owner, b);
  const w = await Worker.create({ owner, name: b.name.trim(), mobile: b.mobile, cat: b.cat, wh: [{ from: b.joined, rate: wage }], site: b.site || null, joined: b.joined, notes: String(b.notes || '').trim() });
  await Activity.log(owner, `Added ${w.name}`, 'ph-user-plus');
  res.status(201).json({ worker: w.toClient() });
});

// Edit details. A wage change takes effect from `eff`; attendance on/after that date is re-rated.
r.patch('/:id', async (req, res) => {
  const owner = req.user._id, b = req.body || {};
  const w = await own(Worker, req.params.id, owner, 'Worker');
  const wage = await validate(owner, b, w._id);
  const T = today();
  const orig = rateOn(w, T);
  let recalculated = 0;
  if (wage !== orig) {
    let eff = isDate(b.eff) ? b.eff : T;
    if (eff > T) eff = T;
    if (eff < b.joined) eff = b.joined;
    w.wh = [...w.wh.filter((h) => h.from < eff), { from: eff, rate: wage }];
    const u = await Attendance.updateMany({ worker: w._id, date: { $gte: eff } }, { $set: { rate: wage } });
    recalculated = u.modifiedCount || 0;
  }
  w.name = b.name.trim(); w.mobile = b.mobile; w.cat = b.cat; w.site = b.site || null;
  w.joined = b.joined; w.notes = String(b.notes || '').trim();
  if (typeof b.active === 'boolean') { w.left = b.active ? null : (w.left || T); w.active = b.active; }
  await w.save();
  if (wage !== orig) await Activity.log(owner, `Wage changed · ${w.name.split(' ')[0]} ${inr(orig)} → ${inr(wage)}`, 'ph-currency-inr');
  const attendance = recalculated ? (await Attendance.find({ worker: w._id })).map((a) => a.toClient()) : undefined;
  res.json({ worker: w.toClient(), recalculated, attendance });
});

module.exports = r;
