const { Schema, model } = require('mongoose');

const WageSchema = new Schema({ from: { type: String, required: true }, rate: { type: Number, required: true, min: 100, max: 5000 } }, { _id: false });

const WorkerSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  mobile: { type: String, required: true, match: /^[6-9]\d{9}$/ },
  cat: { type: String, enum: ['karigar', 'majdoor'], required: true },   // Mason / Labourer
  wh: { type: [WageSchema], default: [] },                               // wage history
  site: { type: Schema.Types.ObjectId, ref: 'Site', default: null },     // default site
  joined: { type: String, required: true },
  notes: { type: String, default: '' },
  active: { type: Boolean, default: true },
  left: { type: String, default: null }
}, { timestamps: true });
WorkerSchema.index({ owner: 1, mobile: 1 }, { unique: true });

WorkerSchema.methods.toClient = function () {
  return { id: String(this._id), name: this.name, mobile: this.mobile, cat: this.cat, wh: this.wh.map((h) => ({ from: h.from, rate: h.rate })), site: this.site ? String(this.site) : '', joined: this.joined, notes: this.notes, active: this.active, left: this.left, createdAt: this.createdAt };
};
module.exports = model('Worker', WorkerSchema);
