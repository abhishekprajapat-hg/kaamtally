// Wage helpers shared by routes. Mirrors the app's rules:
// Present = 1 day wage, Half day = 0.5, Absent / Off = 0.
function rateOn(worker, date) {
  const wh = [...(worker.wh || [])].sort((a, b) => (a.from < b.from ? -1 : 1));
  if (!wh.length) return 0;
  let r = wh[0].rate;
  wh.forEach((x) => { if (x.from <= date) r = x.rate; });
  return r;
}
const pay = (s, rate) => (s === 'P' ? rate : s === 'H' ? rate * 0.5 : 0);
module.exports = { rateOn, pay };
