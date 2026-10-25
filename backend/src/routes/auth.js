const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const { bad, HttpError } = require('../lib/http');
const { sign, requireAuth } = require('../lib/auth');
const { hashPin, verifyPin, validatePin, pinLength } = require('../lib/pin');

const r = express.Router();
const MOBILE = /^[6-9]\d{9}$/;
const MAX_TRIES = Number(process.env.PIN_MAX_TRIES || 5);
const LOCK_MINUTES = Number(process.env.PIN_LOCK_MINUTES || 15);

// Per-IP guard on top of the per-account lockout below.
const limiter = rateLimit({ windowMs: 10 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false, message: { error: 'Too many attempts. Please wait a few minutes.' } });

const lockMsg = (until) => {
  const mins = Math.max(1, Math.ceil((until - Date.now()) / 60000));
  return `Too many wrong PINs. Try again in ${mins} minute${mins > 1 ? 's' : ''}.`;
};

// Is this mobile number already registered? Lets the app show the right screen.
r.post('/check', limiter, async (req, res) => {
  const { mobile = '' } = req.body || {};
  if (!MOBILE.test(mobile)) throw bad('Enter a valid 10-digit mobile number');
  const user = await User.findOne({ mobile });
  res.json({ registered: !!user, name: user ? user.name.split(' ')[0] : '', pinLength: pinLength() });
});

// Create the account and set the PIN in one step.
r.post('/signup', limiter, async (req, res) => {
  const { mobile = '', name = '', biz = '', pin = '', confirmPin } = req.body || {};
  if (String(name).trim().length < 2) throw bad('Please enter your name', { name: 'Please enter your name' });
  if (!MOBILE.test(mobile)) throw bad('Enter a valid 10-digit mobile number', { mobile: 'Enter a valid 10-digit mobile number' });
  const pinErr = validatePin(pin);
  if (pinErr) throw bad(pinErr, { pin: pinErr });
  if (confirmPin !== undefined && confirmPin !== pin) throw bad("Both PINs don't match", { confirmPin: "Both PINs don't match" });
  if (await User.exists({ mobile })) throw bad('This number is already registered. Please log in.', { mobile: 'This number is already registered. Please log in.' });

  const user = await User.create({ name: String(name).trim().replace(/\s+/g, ' '), biz: String(biz).trim(), mobile, pinHash: await hashPin(pin) });
  res.status(201).json({ token: sign(user), user: user.toClient() });
});

// Log in with mobile number + PIN.
r.post('/login', limiter, async (req, res) => {
  const { mobile = '', pin = '' } = req.body || {};
  if (!MOBILE.test(mobile)) throw bad('Enter a valid 10-digit mobile number', { mobile: 'Enter a valid 10-digit mobile number' });
  if (!new RegExp(`^\\d{${pinLength()}}$`).test(pin)) throw bad(`Enter your ${pinLength()}-digit PIN`, { pin: `Enter your ${pinLength()}-digit PIN` });

  const user = await User.findOne({ mobile }).select('+pinHash');
  if (!user) throw bad('No account with this number. Tap Sign up to create one.', { mobile: 'No account with this number. Tap Sign up to create one.' });
  if (user.lockedUntil && user.lockedUntil > new Date()) throw new HttpError(429, lockMsg(user.lockedUntil));

  if (!(await verifyPin(pin, user.pinHash))) {
    user.failedPins += 1;
    if (user.failedPins >= MAX_TRIES) {
      user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000);
      user.failedPins = 0;
      await user.save();
      throw new HttpError(429, lockMsg(user.lockedUntil));
    }
    await user.save();
    const left = MAX_TRIES - user.failedPins;
    throw bad(`Wrong PIN. ${left} ${left > 1 ? 'tries' : 'try'} left.`, { pin: `Wrong PIN. ${left} ${left > 1 ? 'tries' : 'try'} left.` });
  }

  if (user.failedPins || user.lockedUntil) { user.failedPins = 0; user.lockedUntil = null; await user.save(); }
  res.json({ token: sign(user), user: user.toClient() });
});

// Change the PIN from inside the app (needs the current one).
r.post('/change-pin', requireAuth, limiter, async (req, res) => {
  const { currentPin = '', newPin = '', confirmPin } = req.body || {};
  const user = await User.findById(req.user._id).select('+pinHash');
  if (user.lockedUntil && user.lockedUntil > new Date()) throw new HttpError(429, lockMsg(user.lockedUntil));
  if (!(await verifyPin(currentPin, user.pinHash))) {
    user.failedPins += 1;
    if (user.failedPins >= MAX_TRIES) { user.lockedUntil = new Date(Date.now() + LOCK_MINUTES * 60 * 1000); user.failedPins = 0; }
    await user.save();
    throw bad('Your current PIN is wrong', { currentPin: 'Your current PIN is wrong' });
  }
  const pinErr = validatePin(newPin);
  if (pinErr) throw bad(pinErr, { newPin: pinErr });
  if (confirmPin !== undefined && confirmPin !== newPin) throw bad("Both PINs don't match", { confirmPin: "Both PINs don't match" });
  if (await verifyPin(newPin, user.pinHash)) throw bad('Your new PIN must be different from the old one', { newPin: 'Your new PIN must be different from the old one' });

  user.pinHash = await hashPin(newPin);
  user.pinSetAt = new Date();
  user.failedPins = 0; user.lockedUntil = null;
  await user.save();
  res.json({ ok: true, user: user.toClient() });
});

r.get('/me', requireAuth, (req, res) => res.json({ user: req.user.toClient() }));

module.exports = r;
