// All dates are plain 'YYYY-MM-DD' strings in the business's local time zone (IST by default).
const TZ = process.env.TZ_NAME || 'Asia/Kolkata';

function today() {
  // en-CA gives YYYY-MM-DD
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
}
const s2d = (s) => new Date(s + 'T00:00:00Z');
const d2s = (d) => d.toISOString().slice(0, 10);
const addDays = (s, n) => { const d = s2d(s); d.setUTCDate(d.getUTCDate() + n); return d2s(d); };
const dow = (s) => s2d(s).getUTCDay();
const isDate = (s) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(s2d(s).getTime()) && d2s(s2d(s)) === s;

module.exports = { today, s2d, d2s, addDays, dow, isDate };
