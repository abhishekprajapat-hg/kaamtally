// Creates the demo account with the same team, sites, attendance
// and payments as the design prototype — shifted so the last day is today.
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const Site = require('./models/Site');
const Worker = require('./models/Worker');
const Attendance = require('./models/Attendance');
const Transaction = require('./models/Transaction');
const Activity = require('./models/Activity');
const { today, addDays, dow, s2d } = require('./lib/dates');
const { rateOn, pay } = require('./lib/wages');
const { hashPin } = require('./lib/pin');

// The one place the demo login lives. Override with DEMO_MOBILE / DEMO_PIN in .env.
const DEMO_MOBILE = process.env.DEMO_MOBILE || '9000012345';
const DEMO_PIN = process.env.DEMO_PIN || '314159';
const DEMO_PRETTY = DEMO_MOBILE.slice(0, 5) + ' ' + DEMO_MOBILE.slice(5);

async function seedDemo() {
  const TODAY = today();
  const shift = Math.round((s2d(TODAY) - s2d('2026-10-22')) / 864e5);
  const D = (s) => addDays(s, shift); // design date → real date
  const START = D('2026-09-01');
  const MONTH_END = D('2026-09-30');

  const old = await User.findOne({ mobile: DEMO_MOBILE });
  if (old) await Promise.all([Site, Worker, Attendance, Transaction, Activity].map((M) => M.deleteMany({ owner: old._id })).concat(User.deleteOne({ _id: old._id })));
  const user = await User.create({ name: 'Rajendra Shinde', biz: 'Shree Ganesh Tiles Contractor', mobile: DEMO_MOBILE, city: 'Pune', lastBackup: new Date(Date.now() - 2 * 864e5), pinHash: await hashPin(DEMO_PIN) });
  const owner = user._id;

  const S = await Site.insertMany([
    { owner, name: 'Sharma Residency', area: 'Baner, Pune', client: 'Rajesh Sharma', address: 'Plot 14, Baner Road', start: D('2026-08-18'), status: 'active' },
    { owner, name: 'Patil Bungalow', area: 'Kothrud, Pune', client: 'Dr. Sunita Patil', address: 'Lane 7, Karve Nagar', start: D('2026-09-01'), status: 'active' },
    { owner, name: 'Om Sai Complex', area: 'Wakad, Pune', client: 'Om Sai Builders', address: 'Survey No. 112, Wakad', start: D('2026-04-02'), status: 'completed' }
  ]);
  const site = { s1: S[0]._id, s2: S[1]._id };
  const W0 = [
    ['w1', 'Ramesh Kumar Yadav', '9822041736', 'karigar', [['2022-03-01', 950]], 's1', '2022-03-01', 'Head mason. Skilled in Italian marble.'],
    ['w2', 'Suresh Patil', '9765318204', 'karigar', [['2023-06-12', 900]], 's1', '2023-06-12', ''],
    ['w3', 'Mohammed Irfan Shaikh', '8806127459', 'karigar', [['2021-11-08', 1000]], 's2', '2021-11-08', 'Wall cladding specialist'],
    ['w4', 'Anil Gaikwad', '9049271635', 'karigar', [['2024-01-15', 850], ['2026-10-01', 900]], 's2', '2024-01-15', ''],
    ['w5', 'Raju Pawar', '7387450921', 'majdoor', [['2024-05-02', 600]], 's1', '2024-05-02', ''],
    ['w6', 'Santosh Jadhav', '9158836027', 'majdoor', [['2023-09-20', 650]], 's2', '2023-09-20', ''],
    ['w7', 'Vikas Kumar', '8459102378', 'majdoor', [['2025-02-10', 600]], 's1', '2025-02-10', 'From Gaya, Bihar'],
    ['w8', 'Vikas Kamble', '9370615842', 'majdoor', [['2025-07-01', 620]], 's2', '2025-07-01', 'Lives in Kothrud'],
    ['w9', 'Ganesh More', '7620983415', 'majdoor', [['2026-10-12', 600]], 's1', '2026-10-12', 'New joiner'],
    ['w10', 'Babu Lal Verma', '9921347608', 'majdoor', [['2023-02-01', 580]], 's1', '2023-02-01', 'Went back to his village']
  ];
  const docs = await Worker.insertMany(W0.map(([k, name, mobile, cat, wh, s, joined, notes]) => ({
    owner, name, mobile, cat, wh: wh.map(([from, rate]) => ({ from: D(from), rate })), site: site[s], joined: D(joined), notes,
    active: k !== 'w10', left: k === 'w10' ? MONTH_END : null
  })));
  const W = {}; W0.forEach(([k], i) => { W[k] = docs[i]; });

  let sd = 11; const rnd = () => { sd = (sd * 16807) % 2147483647; return sd / 2147483647; };
  const att = []; const map = {};
  const put = (w, d, s) => { const e = { owner, worker: w._id, date: d, s, site: w.site, rate: rateOn(w, d) }; att.push(e); (map[d] ||= {})[String(w._id)] = e; };
  for (let d = START; d < TODAY; d = addDays(d, 1)) {
    W0.forEach(([k]) => {
      const w = W[k];
      if (d < w.joined || (w.left && d > w.left)) return;
      let st; if (dow(d) === 0) st = 'O'; else { const r = rnd(); st = r < 0.8 ? 'P' : r < 0.9 ? 'H' : 'A'; }
      if (k === 'w7' && d >= D('2026-10-13') && d <= D('2026-10-17')) st = 'A';
      put(w, d, st);
    });
  }
  [['w1', 'P'], ['w2', 'P'], ['w5', 'H']].forEach(([k, s]) => put(W[k], TODAY, s));
  await Attendance.insertMany(att);

  const tx = [];
  const add = (k, date, type, amount, method, note) => tx.push({ owner, worker: W[k]._id, date: D(date), type, amount, method, note });
  add('w6', '2026-09-03', 'advance', 3000, 'Cash', 'For house rent');
  add('w1', '2026-09-12', 'advance', 1000, 'UPI', 'For medicines');
  add('w10', '2026-09-20', 'advance', 2000, 'Cash', 'Travel to village');
  const bal = (w, upto) => {
    let b = 0; for (const e of att) if (String(e.worker) === String(w._id) && e.date <= upto) b += pay(e.s, e.rate);
    for (const t of tx) if (String(t.worker) === String(w._id) && t.date <= upto) b += t.type === 'extra' ? t.amount : -t.amount;
    return b;
  };
  W0.forEach(([k]) => {
    const w = W[k]; if (w.joined > MONTH_END) return;
    const b = bal(w, MONTH_END); const fin = k === 'w10'; const amt = fin ? b : Math.floor(b / 500) * 500;
    if (amt > 0) add(k, fin ? '2026-10-01' : '2026-10-03', 'payment', amt, w.cat === 'karigar' ? 'UPI' : 'Cash', fin ? 'Final settlement — fully paid' : 'Last month wages');
  });
  add('w1', '2026-10-10', 'advance', 2000, 'Cash', "Daughter's school fees");
  add('w1', '2026-10-11', 'extra', 500, '', 'Sunday overtime — Sharma Residency');
  add('w5', '2026-10-14', 'advance', 1500, 'Cash', '');
  add('w3', '2026-10-15', 'payment', 5000, 'UPI', 'Part payment — rest before Diwali');
  add('w2', '2026-10-17', 'payment', 1000, 'Cash', 'Weekly expenses');
  add('w4', '2026-10-17', 'payment', 4000, 'Bank Transfer', 'UTR 629104837215');
  add('w8', '2026-10-18', 'advance', 500, 'Cash', 'Gas cylinder');
  add('w9', '2026-10-19', 'advance', 1000, 'Cash', 'Room rent');
  await Transaction.insertMany(tx);

  const now = Date.now();
  await Activity.insertMany([
    { owner, text: `Attendance saved for 9 workers · yesterday`, icon: 'ph-calendar-check', createdAt: new Date(now - 864e5) },
    { owner, text: 'Ramesh Kumar Yadav marked Present', icon: 'ph-check-circle', createdAt: new Date(now - 3 * 60e3) },
    { owner, text: 'Suresh Patil marked Present', icon: 'ph-check-circle', createdAt: new Date(now - 2 * 60e3) },
    { owner, text: 'Raju Pawar marked Half Day', icon: 'ph-circle-half', createdAt: new Date(now - 60e3) }
  ]);
  return { user, mobile: DEMO_MOBILE, pretty: DEMO_PRETTY, pin: DEMO_PIN, workers: docs.length, attendance: att.length, transactions: tx.length };
}

if (require.main === module) {
  mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaam-hisab')
    .then(seedDemo)
    .then((r) => { console.log(`Demo account ready: +91 ${r.pretty} · PIN ${r.pin} · ${r.workers} workers, ${r.attendance} attendance entries, ${r.transactions} transactions`); return mongoose.disconnect(); })
    .catch((e) => { console.error(e); process.exit(1); });
}
module.exports = { seedDemo, DEMO_MOBILE, DEMO_PIN, DEMO_PRETTY };
