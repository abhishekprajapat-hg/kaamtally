const express = require('express');
const Site = require('../models/Site');
const Worker = require('../models/Worker');
const Attendance = require('../models/Attendance');
const Transaction = require('../models/Transaction');
const Activity = require('../models/Activity');
const { today } = require('../lib/dates');
const r = express.Router();

// Everything the app needs in one call. A contractor's team is small (tens of workers),
// so the app keeps the whole hisab in memory and computes balances on the phone.
r.get('/', async (req, res) => {
  const owner = req.user._id;
  const [sites, workers, att, tx, activity] = await Promise.all([
    Site.find({ owner }).sort({ createdAt: 1 }),
    Worker.find({ owner }).sort({ createdAt: 1 }),
    Attendance.find({ owner }),
    Transaction.find({ owner }).sort({ date: 1, createdAt: 1 }),
    Activity.find({ owner }).sort({ createdAt: -1 }).limit(5)
  ]);
  res.json({
    today: today(),
    user: req.user.toClient(),
    sites: sites.map((x) => x.toClient()),
    workers: workers.map((x) => x.toClient()),
    attendance: att.map((x) => x.toClient()),
    transactions: tx.map((x) => x.toClient()),
    activity: activity.map((x) => x.toClient())
  });
});
module.exports = r;
