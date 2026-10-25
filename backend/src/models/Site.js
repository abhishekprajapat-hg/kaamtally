const { Schema, model } = require('mongoose');

const SiteSchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  area: { type: String, default: '', trim: true },
  client: { type: String, default: '', trim: true },
  address: { type: String, default: '', trim: true },
  start: { type: String, default: null },
  status: { type: String, enum: ['active', 'completed'], default: 'active' }
}, { timestamps: true });

SiteSchema.methods.toClient = function () {
  return { id: String(this._id), name: this.name, area: this.area, client: this.client, address: this.address, start: this.start, status: this.status };
};
module.exports = model('Site', SiteSchema);
