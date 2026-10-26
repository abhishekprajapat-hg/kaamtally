const express = require('express');
const Worker = require('../models/Worker');
const Site = require('../models/Site');
const Attendance = require('../models/Attendance');
const Activity = require('../models/Activity');
const { bad } = require('../lib/http');
const { today, isDate } = require('../lib/dates');
const { rateOn } = require('../lib/wages');
const { isId, fd } = require('./_util');
const r = express.Router();

// Attendance for a date range (defaults to everything)
r.get('/', async (req, res) => {
  const q = { owner: req.user._id };
  if (isDate(req.query.from) || isDate(req.query.to)) q.date = {};
  if (isDate(req.query.from)) q.date.$gte = req.query.from;
  if (isDate(req.query.to)) q.date.$lte = req.query.to;
  res.json({ attendance: (await Attendance.find(q)).map((a) => a.toClient()) });
});

// Save a day's changes: { entries: [{ worker, s: 'P'|'H'|'A'|'O', site }] }
// Each worker has one entry per day; the wage for that day is stored with it.
r.put('/:date', async (req, res) => {
  const owner = req.user._id, date = req.params.date;
  if (!isDate(date) || date > today()) throw bad('You can only mark attendance for today or earlier');
  const entries = Array.isArray(req.body?.entries) ? req.body.entries : [];
  if (!entries.length) throw bad('Nothing to save');
  if (entries.length > 500) throw bad('Too many entries');
  const ids = entries.map((e) => e.worker);
  if (!ids.every(isId)) throw bad('Unknown worker');
  const workers = new Map((await Worker.find({ owner, _id: { $in: ids } })).map((w) => [String(w._id), w]));
  const siteIds = [...new Set(entries.map((e) => e.site).filter(Boolean))];
  if (!siteIds.every(isId)) throw bad('Unknown site');
  const okSites = new Set((await Site.find({ owner, _id: { $in: siteIds } })).map((s) => String(s._id)));
  const ops = entries.map((e) => {
    const w = workers.get(e.worker);
    if (!w) throw bad('Unknown worker');
    if (!['P', 'H', 'A', 'O'].includes(e.s)) throw bad('Unknown attendance status');
    if (date < w.joined) throw bad(`${w.name} joined on ${fd(w.joined)} — pick a later date`);
    if (w.left && date > w.left) throw bad(`${w.name} left on ${fd(w.left)}`);
    if (e.site && !okSites.has(e.site)) throw bad('Unknown site');
    return { updateOne: { filter: { worker: w._id, date }, update: { $set: { owner, s: e.s, site: e.site || null, rate: rateOn(w, date) } }, upsert: true } };
  });
  await Attendance.bulkWrite(ops);
  const n = ops.length;
  await Activity.log(owner, `Attendance saved for ${n} worker${n > 1 ? 's' : ''} · ${fd(date)}`, 'ph-calendar-check');
  const saved = await Attendance.find({ owner, date, worker: { $in: ids } });
  res.json({ date, attendance: saved.map((a) => a.toClient()) });
});
// Clear a worker's mark for one day, putting it back to "not marked".
r.delete('/:date/:worker', async (req, res) => {
  const owner = req.user._id, date = req.params.date;
  if (!isDate(date)) throw bad('Unknown date');
  if (!isId(req.params.worker)) throw bad('Unknown worker');
  const w = await Worker.findOne({ owner, _id: req.params.worker });
  if (!w) throw bad('Unknown worker');
  const { deletedCount } = await Attendance.deleteOne({ owner, worker: w._id, date });
  if (deletedCount) await Activity.log(owner, `Attendance cleared for ${w.name} · ${fd(date)}`, 'ph-circle-dashed');
  res.json({ date, worker: req.params.worker, cleared: !!deletedCount });
});

module.exports = r;
