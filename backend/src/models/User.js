const { Schema, model } = require('mongoose');

const UserSchema = new Schema({
  name: { type: String, required: true, trim: true },
  biz: { type: String, default: '', trim: true },
  mobile: { type: String, required: true, unique: true, match: /^[6-9]\d{9}$/ },
  city: { type: String, default: '', trim: true },
  settings: {
    sundayOff: { type: Boolean, default: true },
    pastConfirm: { type: Boolean, default: true },
    lang: { type: String, enum: ['English', 'हिंदी'], default: 'English' },
    theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' }
  },
  lastBackup: { type: Date, default: null },
  pinHash: { type: String, required: true, select: false },
  pinSetAt: { type: Date, default: Date.now },
  failedPins: { type: Number, default: 0 },
  lockedUntil: { type: Date, default: null }
}, { timestamps: true });

UserSchema.methods.toClient = function () {
  return { id: String(this._id), name: this.name, biz: this.biz, mobile: this.mobile, city: this.city, settings: this.settings, lastBackup: this.lastBackup, pinSetAt: this.pinSetAt, createdAt: this.createdAt };
};

module.exports = model('User', UserSchema);
