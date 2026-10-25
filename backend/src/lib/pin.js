// PIN storage and checking.
// The PIN is never stored. We keep a salted scrypt hash of it — scrypt is
// deliberately slow and memory-hard, so a stolen database can't be brute-forced quickly.
const crypto = require('crypto');
const { promisify } = require('util');
const scrypt = promisify(crypto.scrypt);

const LEN = Number(process.env.PIN_LENGTH || 6);
const PARAMS = { N: 16384, r: 8, p: 1, keylen: 64 };

const pinLength = () => LEN;

// Reject PINs that are trivially guessable.
function weakReason(pin) {
  if (/^(\d)\1+$/.test(pin)) return 'Avoid a PIN with all the same digits';
  const asc = Array.from({ length: 10 }, (_, i) => String(i)).join('').repeat(2); // 01234567890123456789
  const desc = asc.split('').reverse().join('');
  if (asc.includes(pin) || desc.includes(pin)) return 'Avoid a PIN in counting order, like 123456';
  if (pin.length % 2 === 0 && pin.slice(0, pin.length / 2) === pin.slice(pin.length / 2)) return 'Avoid repeating the same digits, like 123123';
  return null;
}

// Returns an error message, or null when the PIN is acceptable.
function validatePin(pin) {
  if (typeof pin !== 'string' || !new RegExp(`^\\d{${LEN}}$`).test(pin)) return `Your PIN must be exactly ${LEN} digits`;
  return weakReason(pin);
}

async function hashPin(pin) {
  const salt = crypto.randomBytes(16);
  const key = await scrypt(pin, salt, PARAMS.keylen, PARAMS);
  return `scrypt$${PARAMS.N}$${PARAMS.r}$${PARAMS.p}$${salt.toString('base64')}$${key.toString('base64')}`;
}

async function verifyPin(pin, stored) {
  if (!stored || typeof pin !== 'string') return false;
  const [scheme, N, r, p, salt, key] = String(stored).split('$');
  if (scheme !== 'scrypt') return false;
  let derived;
  try {
    derived = await scrypt(pin, Buffer.from(salt, 'base64'), Buffer.from(key, 'base64').length, { N: +N, r: +r, p: +p });
  } catch { return false; }
  const expected = Buffer.from(key, 'base64');
  // Constant-time compare so the response time doesn't leak the PIN.
  return derived.length === expected.length && crypto.timingSafeEqual(derived, expected);
}

module.exports = { hashPin, verifyPin, validatePin, pinLength };
