const mongoose = require('mongoose');
const { notFound } = require('../lib/http');
const isId = (v) => typeof v === 'string' && mongoose.isValidObjectId(v);
async function own(Model, id, owner, what) {
  if (!isId(id)) throw notFound(what + ' not found');
  const doc = await Model.findOne({ _id: id, owner });
  if (!doc) throw notFound(what + ' not found');
  return doc;
}
const fd = (s) => { const M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']; const d = new Date(s + 'T00:00:00Z'); return d.getUTCDate() + ' ' + M[d.getUTCMonth()]; };
const inr = (n) => (n < 0 ? '−' : '') + '₹' + Math.round(Math.abs(n)).toLocaleString('en-IN');
module.exports = { isId, own, fd, inr };
