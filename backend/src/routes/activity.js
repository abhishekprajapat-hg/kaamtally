const express = require('express');
const Activity = require('../models/Activity');
const r = express.Router();
r.get('/', async (req, res) => {
  res.json({ activity: (await Activity.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(5)).map((a) => a.toClient()) });
});
module.exports = r;
