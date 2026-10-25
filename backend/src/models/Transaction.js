const { Schema, model } = require('mongoose');

const TransactionSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  worker: { type: Schema.Types.ObjectId, ref: 'Worker', required: true, index: true },
  date: { type: String, required: true },
  type: { type: String, enum: ['payment', 'advance', 'extra'], required: true },
  amount: { type: Number, required: true, min: 1, max: 200000 },
  method: { type: String, enum: ['Cash', 'UPI', 'Bank Transfer', 'Other', ''], default: '' },
  note: { type: String, default: '', trim: true }
}, { timestamps: true });

TransactionSchema.methods.toClient = function () {
  return { id: String(this._id), wid: String(this.worker), date: this.date, type: this.type, amount: this.amount, method: this.method, note: this.note, createdAt: this.createdAt };
};
module.exports = model('Transaction', TransactionSchema);
