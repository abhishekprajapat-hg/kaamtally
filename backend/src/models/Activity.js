const { Schema, model } = require('mongoose');

const ActivitySchema = new Schema({
  owner: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  text: { type: String, required: true },
  icon: { type: String, default: 'ph-check-circle' }
}, { timestamps: true });

ActivitySchema.methods.toClient = function () {
  return { id: String(this._id), text: this.text, icon: this.icon, at: this.createdAt };
};
ActivitySchema.statics.log = function (owner, text, icon) { return this.create({ owner, text, icon }); };
module.exports = model('Activity', ActivitySchema);
