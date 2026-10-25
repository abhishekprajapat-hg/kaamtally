const { Schema, model } = require('mongoose');

// One entry per worker per day. The day's wage is stored on the entry so a later
// wage change never changes old salary (unless the owner picks an earlier effective date).
const AttendanceSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true },
  date: { type: String, required: true },
  s: { type: String, enum: ['P', 'H', 'A', 'O'], required: true },
  site: { type: Schema.Types.ObjectId, ref: 'Site', default: null },
  rate: { type: Number, required: true }
}, { timestamps: true });
AttendanceSchema.index({ worker: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ owner: 1, date: 1 });

AttendanceSchema.methods.toClient = function () {
  return { worker: String(this.worker), date: this.date, s: this.s, site: this.site ? String(this.site) : '', rate: this.rate };
};
module.exports = model('Attendance', AttendanceSchema);
