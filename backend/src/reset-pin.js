// Resets a forgotten PIN.  npm run reset-pin -- 9000012345 445566
require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const { hashPin, validatePin, pinLength } = require('./lib/pin');

const [mobile, pin] = process.argv.slice(2);
if (!mobile || !pin) {
  console.error(`Usage: npm run reset-pin -- <10-digit mobile> <${pinLength()}-digit new PIN>`);
  process.exit(1);
}
const err = validatePin(pin);
if (err) { console.error(err); process.exit(1); }

mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaam-hisab')
  .then(async () => {
    const user = await User.findOne({ mobile });
    if (!user) { console.error('No account with mobile number ' + mobile); process.exit(1); }
    user.pinHash = await hashPin(pin);
    user.pinSetAt = new Date();
    user.failedPins = 0;
    user.lockedUntil = null;
    await user.save();
    console.log(`PIN reset for ${user.name} (+91 ${mobile}). They can log in with the new PIN now.`);
    return mongoose.disconnect();
  })
  .catch((e) => { console.error(e.message); process.exit(1); });
