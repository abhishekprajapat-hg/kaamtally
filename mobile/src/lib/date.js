export const MON = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
export const MONF = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const DAY = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
export const DSH = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
export const s2d = (s) => new Date(s + 'T00:00:00Z');
export const d2s = (d) => d.toISOString().slice(0, 10);
export const addDays = (s, n) => { const d = s2d(s); d.setUTCDate(d.getUTCDate() + n); return d2s(d); };
export const dow = (s) => s2d(s).getUTCDay();
export const fd = (s) => { const d = s2d(s); return d.getUTCDate() + ' ' + MON[d.getUTCMonth()]; };
export const fdy = (s) => fd(s) + ' ' + s2d(s).getUTCFullYear();
export const localToday = () => { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); };
export const monthKey = (s) => s.slice(0, 7);
export const prevMonthKey = (k) => { const [y, m] = k.split('-').map(Number); return d2s(new Date(Date.UTC(y, m - 2, 1))).slice(0, 7); };
export const monthEnd = (k) => { const [y, m] = k.split('-').map(Number); return k + '-' + String(new Date(Date.UTC(y, m, 0)).getUTCDate()).padStart(2, '0'); };
export const monthName = (k, full) => (full ? MONF : MON)[Number(k.slice(5, 7)) - 1];
export function timeAgo(iso, today) {
  const d = new Date(iso); const ds = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  if (ds === today) { let h = d.getHours(); const m = d.getMinutes(); const ap = h >= 12 ? 'pm' : 'am'; h = h % 12 || 12; return `${h}:${String(m).padStart(2, '0')} ${ap}`; }
  if (ds === addDays(today, -1)) return 'Yesterday';
  return fd(ds);
}
