const express = require('express');
const Worker = require('../models/Worker');
const Transaction = require('../models/Transaction');
const Activity = require('../models/Activity');
const { bad } = require('../lib/http');
const { today, isDate } = require('../lib/dates');
const { isId, fd, inr } = require('./_util');
const r = express.Router();

r.get('/', async (req, res) => {
  const q = { owner: req.user._id };
  if (isId(req.query.worker)) q.worker = req.query.worker;
  res.json({ transactions: (await Transaction.find(q).sort({ date: 1, createdAt: 1 })).map((t) => t.toClient()) });
});

// { wid, type: payment|advance|extra, amount, date, method, note }
r.post('/', async (req, res) => {
  const owner = req.user._id, b = req.body || {}, e = {};
  const w = isId(b.wid) ? await Worker.findOne({ _id: b.wid, owner }) : null;
  const a = parseInt(b.amount, 10);
  if (!w) e.wid = 'Please choose a worker';
  if (!['payment', 'advance', 'extra'].includes(b.type)) e.type = 'Choose payment, advance or extra';
  if (!(a > 0)) e.amount = 'Enter an amount'; else if (a > 200000) e.amount = 'Amount cannot be more than ₹2,00,000';
  if (!isDate(b.date) || b.date > today()) e.date = 'Choose today or an earlier date';
  else if (w && b.date < w.joined) e.date = `This worker joined on ${fd(w.joined)} — pick a later date`;
  const method = b.type === 'extra' ? '' : (['Cash', 'UPI', 'Bank Transfer', 'Other'].includes(b.method) ? b.method : 'Cash');
  if (Object.keys(e).length) throw bad('Please fix the highlighted fields', e);
  const t = await Transaction.create({ owner, worker: w._id, date: b.date, type: b.type, amount: a, method, note: String(b.note || '').trim().slice(0, 200) });
  const tl = b.type === 'payment' ? 'Payment' : b.type === 'advance' ? 'Advance' : 'Extra earning';
  const icon = b.type === 'payment' ? 'ph-hand-coins' : b.type === 'advance' ? 'ph-arrow-circle-up-right' : 'ph-plus-circle';
  await Activity.log(owner, `${tl} ${inr(a)} · ${w.name.split(' ').slice(0, 2).join(' ')}`, icon);
  res.status(201).json({ transaction: t.toClient() });
});
module.exports = r;
