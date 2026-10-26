// Kaamtally — app controller. State and logic are ported from the design prototype
// ("Kaam Hisab v3" design), with every change saved through the Express/MongoDB API.
import React from 'react';
import { Appearance, BackHandler, Dimensions, Linking } from 'react-native';
import { ThemeProvider } from './ui/theme-context';
import { ST, seg, pill, sw } from './theme';
import { D, inr, ini, mobFmt, CAT, rateOn, pay, stats, txSum, balance } from './lib/calc';
import { s2d, d2s, addDays, dow, fd, fdy, DAY, DSH, MONF, localToday, monthKey, prevMonthKey, monthEnd, monthName, timeAgo } from './lib/date';
import { api, session } from './lib/api';
import { DEMO_MOBILE } from './lib/demo';
import { shareCsv, sharePdf } from './lib/files';
import Shell from './screens/Shell';

const TITLES = { history: 'History', home: 'Home', att: 'Attendance', workers: 'Workers', form: '', profile: 'Worker', hisab: 'Salary', ledger: 'Ledger', tx: '', sites: 'Sites', reports: 'Reports', report: '', more: 'More', settings: 'Settings' };
const REPORTS = [
  { k: 'daily', icon: 'ph-calendar-check', title: 'Daily attendance', sub: 'One day — who came and the cost' },
  { k: 'monthly', icon: 'ph-calendar-blank', title: 'Monthly attendance', sub: 'Present, half, absent days per worker' },
  { k: 'salary', icon: 'ph-money', title: 'Salary by worker', sub: 'Earned, advances and payments' },
  { k: 'outstanding', icon: 'ph-wallet', title: 'Outstanding payments', sub: 'How much is still to be paid' },
  { k: 'advance', icon: 'ph-arrow-circle-up-right', title: 'Advance balance', sub: 'Advances given and recovered' },
  { k: 'site', icon: 'ph-buildings', title: 'Labour cost by site', sub: 'Wages spent at each site' }];
const AUTH0 = { mode: 'login', step: 'phone', name: '', biz: '', mobile: '', pin: '', confirmPin: '', err: '', fieldErr: {} };
const PIN_LEN = 6;

function indexAtt(list) {
  const att = {};
  list.forEach((a) => { (att[a.date] || (att[a.date] = {}))[a.worker] = { s: a.s, site: a.site || '', rate: a.rate }; });
  return att;
}

export default class KaamHisab extends React.Component {
  constructor(props) {
    super(props);
    const T0 = localToday(); D.TODAY = T0;
    this.state = {
      booting: true, loadErr: '', loadOffline: false, busy: false, user: null, sites: [], workers: [], att: {}, tx: [], activity: [],
      screen: 'home', stack: [], vw: Dimensions.get('window').width, scrolled: false, activeSite: 'all', attDate: T0, attSite: 'all', draft: {}, pastAck: {}, dayEdit: null, dayBusy: false,
      wq: '', wcat: 'all', form: null, ferr: {}, wid: null, profTab: 'overview', profMonth: monthKey(T0), period: 'cur', cFrom: monthKey(T0) + '-01', cTo: T0,
      txf: null, txErr: {}, report: 'daily', rDate: T0, dialog: null, toast: null, lang: 'English', sundayOff: true, pastConfirm: true, newIds: {},
      siteForm: null, siteErr: '', pinForm: null, pinErr: {}, auth: { ...AUTH0 }, theme: 'light', hView: 'month', hDate: T0, hWorker: 'all'
    };
    this.scrollRef = React.createRef();
  }

  // ---------- lifecycle ----------
  async componentDidMount() {
    this._dim = Dimensions.addEventListener('change', ({ window }) => this.setState({ vw: window.width }));
    this._bk = BackHandler.addEventListener('hardwareBackPress', this.onHardwareBack);
    this._ap = Appearance.addChangeListener(() => { if (this.state.theme === 'auto') this.forceUpdate(); });
    const tok = await session.load();
    if (tok) await this.load(); else this.setState({ booting: false });
  }
  componentWillUnmount() { this._dim && this._dim.remove(); this._bk && this._bk.remove(); this._ap && this._ap.remove(); clearTimeout(this._t); }
  mode() { const t = this.state.theme; if (t === 'auto') return Appearance.getColorScheme() === 'dark' ? 'dark' : 'light'; return t === 'dark' ? 'dark' : 'light'; }

  onHardwareBack = () => {
    const s = this.state;
    if (s.dialog) { this.setState({ dialog: null }); return true; }
    if (s.siteForm) { this.setState({ siteForm: null }); return true; }
    if (s.pinForm) { this.setState({ pinForm: null, pinErr: {} }); return true; }
    if (s.user && s.stack.length) { this.back(); return true; }
    if (s.user && s.screen !== 'home') { this.tab('home'); return true; }
    if (!s.user && s.auth.step === 'pin') { this.setState((z) => ({ auth: { ...z.auth, step: 'phone', pin: '', confirmPin: '', err: '', fieldErr: {} } })); return true; }
    return false;
  };

  async load() {
    this.setState({ booting: true, loadErr: '', loadOffline: false });
    try {
      const b = await api.bootstrap();
      const T = b.today || localToday(); D.TODAY = T;
      const created = (b.user.createdAt || '').slice(0, 10) || T;
      const firstPrev = prevMonthKey(monthKey(T)) + '-01';
      D.START = [created, firstPrev, ...b.attendance.map((a) => a.date), ...b.transactions.map((t) => t.date)].reduce((a, x) => (x && x < a ? x : a), T);
      const st = b.user.settings || {};
      this.setState({
        booting: false, user: b.user, sites: b.sites, workers: b.workers, att: indexAtt(b.attendance), tx: b.transactions, activity: b.activity,
        sundayOff: st.sundayOff !== false, pastConfirm: st.pastConfirm !== false, lang: st.lang || 'English', theme: st.theme || 'light',
        attDate: T, rDate: T, hDate: T, cTo: T, cFrom: monthKey(T) + '-01', profMonth: monthKey(T)
      });
    } catch (e) {
      if (e.status === 401) { await session.clear(); this.setState({ booting: false, user: null }); return; }
      this.setState({ booting: false, loadErr: e.message, loadOffline: e.status === 0 });
    }
  }
  async refreshActivity() { try { const r = await api.activity(); this.setState({ activity: r.activity }); } catch {} }

  // ---------- helpers ----------
  top() { try { this.scrollRef.current && this.scrollRef.current.scrollTo({ y: 0, animated: false }); } catch {} this.setState({ scrolled: false }); }
  onScroll = (e) => { const sc = e.nativeEvent.contentOffset.y > 40; if (sc !== this.state.scrolled) this.setState({ scrolled: sc }); };
  W(id) { return this.state.workers.find((w) => w.id === id); }
  siteName(id) { const s = this.state.sites.find((x) => x.id === id); return s ? s.name : 'No site'; }
  guard(fn) { const n = Object.keys(this.state.draft).length; if (this.state.screen === 'att' && n) { this.ask({ icon: 'ph-warning', title: 'Attendance not saved', body: `You have ${n} unsaved change${n > 1 ? 's' : ''}. Leave without saving?`, ok: 'Discard changes', cancel: 'Keep editing', onOk: () => this.setState({ draft: {} }, fn) }); } else fn(); }
  go(screen, patch) { this.guard(() => { this.setState((s) => ({ stack: [...s.stack, s.screen], screen, ...(patch || {}) })); this.top(); }); }
  tab(screen, patch) { this.guard(() => { this.setState({ screen, stack: [], ...(patch || {}) }); this.top(); }); }
  back = () => this.guard(() => { this.setState((s) => { const st = [...s.stack]; const p = st.pop() || 'home'; return { stack: st, screen: p }; }); this.top(); });
  ask(d) { this.setState({ dialog: Object.assign({ icon: 'ph-question', cancel: 'Cancel', ok: 'Yes' }, d) }); }
  toast(text, kind, action) { const id = Date.now() + Math.random(); this.setState({ toast: { text, kind: kind || 'ok', action, id } }); clearTimeout(this._t); this._t = setTimeout(() => { if (this.state.toast && this.state.toast.id === id) this.setState({ toast: null }); }, action ? 7000 : 3200); }
  // One place to report a failed request, so offline never reads as a server error.
  failToast(e, retry) {
    if (e && e.status === 0) this.toast('No internet — nothing was saved. Try again when you are back online.', 'offline', retry ? { label: 'Retry', on: () => { this.setState({ toast: null }); retry(); } } : undefined);
    else this.toast((e && e.message) || 'Something went wrong. Please try again.', 'err', retry ? { label: 'Retry', on: () => { this.setState({ toast: null }); retry(); } } : undefined);
  }
  wv(w) {
    const s = this.state; const rate = rateOn(w, D.TODAY); const first = w.name.split(' ')[0].toLowerCase();
    const dup = s.workers.some((x) => x.id !== w.id && x.name.split(' ')[0].toLowerCase() === first);
    return { id: w.id, name: w.name, ini: ini(w.name), cat: CAT[w.cat], wage: inr(rate) + '/day', rate, mobileFmt: mobFmt(w.mobile), site: w.site ? this.siteName(w.site) : 'No default site', avBg: w.cat === 'karigar' ? 'var(--color-accent-800)' : 'var(--color-neutral-700)', avFg: w.cat === 'karigar' ? 'var(--color-accent-100)' : 'var(--color-neutral-100)', dup: dup ? '··' + w.mobile.slice(-4) : '', inactive: !w.active, open: () => this.go('profile', { wid: w.id, profTab: 'overview' }) };
  }
  months() { const cur = monthKey(D.TODAY); return { cur, prev: prevMonthKey(cur) }; }
  perRange() {
    const s = this.state; const { cur, prev } = this.months();
    if (s.period === 'prev') return [prev + '-01', monthEnd(prev)];
    if (s.period === 'all') return [D.START, D.TODAY];
    if (s.period === 'custom') { let a = s.cFrom < D.START ? D.START : s.cFrom, b = s.cTo > D.TODAY ? D.TODAY : s.cTo; if (b < a) b = a; return [a, b]; }
    return [cur + '-01', D.TODAY];
  }
  ledger(wid, a, b) {
    const s = this.state; const open = balance(s.att, s.tx, wid, addDays(a, -1)); const rows = []; let cs = a;
    while (cs <= b && cs <= D.TODAY) {
      let ce = cs; while (dow(ce) !== 0 && ce < b && ce < D.TODAY) ce = addDays(ce, 1);
      const st = stats(s.att, wid, cs, ce);
      if (st.full + st.half > 0) { const rs = Object.keys(st.groups); rows.push({ date: ce, ord: 0, type: 'wage', desc: `Wages ${fd(cs)}–${fd(ce)}`, sub: `${st.full} full, ${st.half} half day` + (rs.length === 1 ? ` @ ${inr(+rs[0])}` : ' · rate changed'), amt: st.earned }); }
      cs = addDays(ce, 1);
    }
    s.tx.filter((t) => t.wid === wid && t.date >= a && t.date <= b).forEach((t) => rows.push({ date: t.date, ord: 1, type: t.type, desc: t.type === 'payment' ? 'Payment' : t.type === 'advance' ? 'Advance given' : 'Extra earning', sub: [t.method, t.note].filter(Boolean).join(' · '), amt: t.type === 'extra' ? t.amount : -t.amount }));
    rows.sort((x, y) => (x.date < y.date ? -1 : x.date > y.date ? 1 : x.ord - y.ord)); let run = open; rows.forEach((r) => { run += r.amt; r.bal = run; });
    return { open, rows, close: run };
  }

  // ---------- attendance ----------
  setAttDate(d) { if (!d || d > D.TODAY || d < D.START) return; if (d === this.state.attDate) return; this.guard(() => this.setState({ attDate: d, draft: {} })); }
  mark(wid, st) {
    const s = this.state, w = this.W(wid), d = s.attDate, saved = (s.att[d] || {})[wid];
    const site = s.attSite !== 'all' ? s.attSite : (saved ? saved.site : (w.site || ''));
    const apply = () => this.setState((x) => { const dr = { ...x.draft }; if (saved && saved.s === st && saved.site === site) delete dr[wid]; else dr[wid] = { s: st, site }; return { draft: dr, pastAck: d < D.TODAY ? { ...x.pastAck, [d]: true } : x.pastAck }; });
    const cur = s.draft[wid] ? s.draft[wid].s : saved && saved.s; if (cur === st && !(saved && saved.site !== site)) return;
    if (saved && saved.site !== site) { this.ask({ icon: 'ph-map-pin', title: 'Marked at another site', body: `${w.name} is already marked at ${this.siteName(saved.site)} on ${fd(d)}. A worker can have only one entry per day. Move it to ${this.siteName(site)}?`, ok: 'Move here', onOk: apply }); return; }
    if (d < D.TODAY && saved && s.pastConfirm && !s.pastAck[d]) { this.ask({ icon: 'ph-clock-counter-clockwise', title: 'Change past attendance?', body: `${w.name} on ${fdy(d)}: "${ST[saved.s].label}" → "${ST[st].label}". Salary will update too. We won't ask again for this date.`, ok: 'Yes, change it', onOk: apply }); return; }
    apply();
  }
  attRows() { const s = this.state, d = s.attDate, day = s.att[d] || {}; let list = s.workers.filter((w) => (w.active || day[w.id]) && w.joined <= d && !(w.left && d > w.left)); if (s.attSite !== 'all') list = list.filter((w) => w.site === s.attSite || (day[w.id] && day[w.id].site === s.attSite)); return list; }
  markAll = () => {
    const s = this.state, day = s.att[s.attDate] || {}; const un = this.attRows().filter((w) => !day[w.id] && !s.draft[w.id]); if (!un.length) return;
    this.ask({ icon: 'ph-checks', title: 'Mark everyone Present?', body: `${un.length} unmarked worker${un.length > 1 ? 's' : ''} will be marked Present (full day) for ${fd(s.attDate)}. Already-marked workers won't change. You can still adjust anyone before saving.`, ok: `Mark ${un.length} Present`, onOk: () => this.setState((x) => { const dr = { ...x.draft }; un.forEach((w) => { dr[w.id] = { s: 'P', site: x.attSite !== 'all' ? x.attSite : (w.site || '') }; }); return { draft: dr }; }) });
  };
  saveAtt = async () => {
    const s = this.state; const n = Object.keys(s.draft).length; if (!n || s.busy) return;
    const d = s.attDate; const entries = Object.entries(s.draft).map(([wid, v]) => ({ worker: wid, s: v.s, site: v.site || '' }));
    this.setState({ busy: true });
    try {
      const r = await api.saveAttendance(d, entries);
      this.setState((x) => { const day = { ...(x.att[d] || {}) }; r.attendance.forEach((a) => { day[a.worker] = { s: a.s, site: a.site || '', rate: a.rate }; }); return { att: { ...x.att, [d]: day }, draft: {}, busy: false }; });
      this.refreshActivity();
      this.toast(`Saved attendance for ${n} worker${n > 1 ? 's' : ''} · ${fdy(d)}`);
    } catch (e) {
      this.setState({ busy: false });
      this.failToast(e, () => this.saveAtt());
    }
  };

  // Edit one worker's attendance for one day, straight from a calendar.
  // Works for any past day the worker was on the books, not just today.
  openDayEdit(wid, d) { this.setState({ dayEdit: { wid, date: d } }); }
  closeDayEdit = () => { if (!this.state.dayBusy) this.setState({ dayEdit: null }); };
  setDayMark = async (st) => {
    const s = this.state, de = s.dayEdit; if (!de || s.dayBusy) return;
    const w = this.W(de.wid), d = de.date; if (!w) return;
    const saved = (s.att[d] || {})[de.wid];
    if (saved && saved.s === st) { this.closeDayEdit(); return; }
    if (!saved && st === null) { this.closeDayEdit(); return; }
    // Honour the "confirm before changing past attendance" setting.
    if (d < D.TODAY && saved && s.pastConfirm && !s.pastAck[d]) {
      const to = st === null ? 'Not marked' : ST[st].label;
      this.ask({ icon: 'ph-clock-counter-clockwise', title: 'Change past attendance?', body: `${w.name} on ${fdy(d)}: "${ST[saved.s].label}" → "${to}". Salary will update too. We won't ask again for this date.`, ok: 'Yes, change it', onOk: () => { this.setState((x) => ({ pastAck: { ...x.pastAck, [d]: true } }), () => this.setDayMark(st)); } });
      return;
    }
    this.setState({ dayBusy: true });
    const first = w.name.split(' ')[0];
    try {
      if (st === null) {
        await api.clearAttendance(d, de.wid);
        this.setState((x) => { const day = { ...(x.att[d] || {}) }; delete day[de.wid]; return { att: { ...x.att, [d]: day }, dayBusy: false, dayEdit: null }; });
        this.toast(`${first} · mark cleared · ${fdy(d)}`);
      } else {
        const site = (saved && saved.site) || w.site || '';
        const r = await api.saveAttendance(d, [{ worker: de.wid, s: st, site }]);
        this.setState((x) => { const day = { ...(x.att[d] || {}) }; r.attendance.forEach((a) => { day[a.worker] = { s: a.s, site: a.site || '', rate: a.rate }; }); return { att: { ...x.att, [d]: day }, dayBusy: false, dayEdit: null }; });
        this.toast(`${first} · ${ST[st].label} · ${fdy(d)}`);
      }
      this.refreshActivity();
    } catch (e) {
      this.setState({ dayBusy: false });
      this.failToast(e, () => this.setDayMark(st));
    }
  };

  // ---------- workers ----------
  openForm(w) { this.go('form', { ferr: {}, form: w ? { id: w.id, name: w.name, mobile: w.mobile, cat: w.cat, wage: String(rateOn(w, D.TODAY)), joined: w.joined, site: w.site || '', notes: w.notes || '', active: w.active, eff: D.TODAY, origWage: rateOn(w, D.TODAY) } : { id: null, name: '', mobile: '', cat: 'majdoor', wage: '600', joined: D.TODAY, site: this.state.activeSite !== 'all' ? this.state.activeSite : ((this.state.sites.find((x) => x.status === 'active') || {}).id || ''), notes: '', active: true, eff: D.TODAY } }); }
  setF(k, v) { this.setState((s) => ({ form: { ...s.form, [k]: v }, ferr: { ...s.ferr, [k]: null } })); }
  saveWorker = () => {
    const s = this.state, f = s.form, e = {}; const wage = parseInt(f.wage, 10);
    if (f.name.trim().length < 2) e.name = 'Please enter a name (at least 2 letters)';
    if (!/^[6-9]\d{9}$/.test(f.mobile)) e.mobile = 'Enter a valid 10-digit mobile number (starts with 6–9)';
    else if (s.workers.some((w) => w.id !== f.id && w.mobile === f.mobile)) e.mobile = 'This number already belongs to another worker';
    if (!(wage >= 100 && wage <= 5000)) e.wage = 'Daily wage must be between ₹100 and ₹5,000';
    if (Object.keys(e).length) { this.setState({ ferr: e }); this.toast('Please fix the highlighted fields', 'err'); return; }
    const body = { name: f.name.trim(), mobile: f.mobile, cat: f.cat, wage, joined: f.joined, site: f.site, notes: f.notes, active: f.active, eff: f.eff };
    const fail = (err) => { this.setState({ busy: false, ferr: err.fields || {} }); this.failToast(err); };
    if (!f.id) {
      if (s.busy) return; this.setState({ busy: true });
      api.addWorker(body).then(({ worker: w }) => {
        this.setState((x) => ({ busy: false, workers: [...x.workers, w], newIds: { ...x.newIds, [w.id]: true }, screen: 'workers', stack: [], wq: '', wcat: 'all' }));
        this.refreshActivity(); this.toast(`${w.name} added · ${inr(wage)}/day`); this.top();
      }, fail);
      return;
    }
    const doSave = () => {
      this.setState({ busy: true });
      api.updateWorker(f.id, body).then((r) => {
        this.setState((x) => {
          let att = x.att;
          if (r.attendance) { att = {}; Object.keys(x.att).forEach((d) => { const day = { ...x.att[d] }; delete day[f.id]; att[d] = day; }); r.attendance.forEach((a) => { (att[a.date] || (att[a.date] = {}))[a.worker] = { s: a.s, site: a.site || '', rate: a.rate }; }); }
          const st = [...x.stack]; const p = st.pop() || 'workers';
          return { busy: false, workers: x.workers.map((w) => (w.id === f.id ? r.worker : w)), att, screen: p, stack: st };
        });
        this.refreshActivity(); this.toast('Worker details updated'); this.top();
      }, fail);
    };
    if (wage !== f.origWage) { this.ask({ icon: 'ph-currency-inr', title: 'Change daily wage?', body: `${f.name}: ${inr(f.origWage)} → ${inr(wage)} per day, from ${fdy(f.eff)}. Attendance before that date keeps the old rate.`, ok: 'Save new wage', onOk: doSave }); } else doSave();
  };

  // ---------- money ----------
  openTx(type, wid) { this.go('tx', { txErr: {}, txf: { type, wid: wid || '', amount: '', date: D.TODAY, method: 'Cash', note: '' } }); }
  setT(k, v) { this.setState((s) => ({ txf: { ...s.txf, [k]: v }, txErr: { ...s.txErr, [k]: null } })); }
  submitTx = () => {
    const s = this.state, t = s.txf, e = {}; const a = parseInt(t.amount, 10); const w = t.wid && this.W(t.wid);
    if (!w) e.wid = 'Please choose a worker'; if (!(a > 0)) e.amount = 'Enter an amount'; else if (a > 200000) e.amount = 'Amount cannot be more than ₹2,00,000';
    if (!t.date || t.date > D.TODAY) e.date = 'Choose today or an earlier date'; else if (w && t.date < w.joined) e.date = `This worker joined on ${fd(w.joined)} — pick a later date`;
    if (Object.keys(e).length) { this.setState({ txErr: e }); return; }
    const bal = balance(s.att, s.tx, w.id); const nb = t.type === 'extra' ? bal + a : bal - a; const tl = t.type === 'payment' ? 'Payment' : t.type === 'advance' ? 'Advance' : 'Extra earning';
    this.ask({
      icon: t.type === 'extra' ? 'ph-plus-circle' : 'ph-hand-coins', title: `Confirm ${tl.toLowerCase()}`, body: t.type === 'extra' ? `Add ${inr(a)} to ${w.name}'s account.` : `Paying ${inr(a)} to ${w.name} by ${t.method}.`,
      lines: [{ k: 'Date', v: fdy(t.date) }, { k: 'Current balance', v: inr(bal) }, { k: tl, v: (t.type === 'extra' ? '+ ' : '− ') + inr(a) }, { k: 'New balance', v: inr(nb) }], ok: 'Confirm & Save',
      onOk: async () => {
        this.setState({ busy: true });
        try {
          const r = await api.addTx({ wid: w.id, date: t.date, type: t.type, amount: a, method: t.type === 'extra' ? '' : t.method, note: t.note.trim() });
          const curStart = monthKey(D.TODAY) + '-01';
          this.setState((x) => ({ busy: false, tx: x.tx.concat([r.transaction]), screen: 'ledger', wid: w.id, period: t.date < curStart ? 'all' : x.period === 'prev' ? 'cur' : x.period }));
          this.refreshActivity(); this.toast(`${tl} of ${inr(a)} saved · new balance ${inr(nb)}`); this.top();
        } catch (err) { this.setState({ busy: false, txErr: err.fields || {} }); this.failToast(err); }
      }
    });
  };

  // ---------- settings ----------
  saveSettings(patch) {
    this.setState(patch);
    const settings = {}; ['sundayOff', 'pastConfirm', 'lang', 'theme'].forEach((k) => { if (k in patch) settings[k] = patch[k]; });
    api.updateMe({ settings }).then((r) => this.setState({ user: r.user }), (e) => this.failToast(e));
  }
  openPinForm() { this.setState({ pinForm: { currentPin: '', newPin: '', confirmPin: '' }, pinErr: {} }); }
  setP(k, v) { this.setState((s) => ({ pinForm: { ...s.pinForm, [k]: v }, pinErr: { ...s.pinErr, [k]: null, form: null } })); }
  savePin = async () => {
    const f = this.state.pinForm; if (!f || this.state.busy) return;
    const e = {};
    if (f.currentPin.length !== PIN_LEN) e.currentPin = 'Enter your current PIN';
    if (f.newPin.length !== PIN_LEN) e.newPin = `Your new PIN must be ${PIN_LEN} digits`;
    else if (f.newPin === f.currentPin) e.newPin = 'Your new PIN must be different from the old one';
    if (f.confirmPin !== f.newPin) e.confirmPin = "Both PINs don't match";
    if (Object.keys(e).length) { this.setState({ pinErr: e }); return; }
    this.setState({ busy: true });
    try {
      await api.changePin(f);
      this.setState({ busy: false, pinForm: null, pinErr: {} });
      this.toast('PIN changed');
    } catch (err) {
      this.setState({ busy: false, pinErr: err.fields && Object.keys(err.fields).length ? err.fields : { form: err.message }, pinForm: { ...this.state.pinForm, currentPin: err.fields && err.fields.currentPin ? '' : this.state.pinForm.currentPin } });
    }
  };

  csv(name, rows) { shareCsv(name, rows).then(() => this.toast(name + '.csv ready'), () => this.toast("Couldn't create the file", 'err')); }

  report(k) {
    const s = this.state; const [a, b] = this.perRange(); const R = (v, r) => ({ v: String(v), al: r ? 'right' : 'left' }); const out = { cols: [], rows: [], total: null, usesPeriod: true, usesDate: false };
    if (k === 'daily') { out.usesPeriod = false; out.usesDate = true; const day = s.att[s.rDate] || {}; let tot = 0; out.cols = [R('Worker'), R('Site'), R('Status'), R('Rate', 1), R('Earned', 1)];
      s.workers.filter((w) => w.joined <= s.rDate && (!w.left || s.rDate <= w.left)).forEach((w) => { const r = day[w.id]; const amt = r ? pay(r.s, r.rate) : 0; tot += amt; out.rows.push([R(w.name), R(r ? this.siteName(r.site) : '—'), R(r ? ST[r.s].label : 'Not marked'), R(inr(r ? r.rate : rateOn(w, s.rDate)), 1), R(inr(amt), 1)]); }); out.total = { k: `Total cost · ${fdy(s.rDate)}`, v: inr(tot) }; out.title = 'Daily attendance'; }
    if (k === 'monthly') { out.cols = [R('Worker'), R('Present', 1), R('Half', 1), R('Absent', 1), R('Off', 1), R('Paid days', 1)]; s.workers.forEach((w) => { const st = stats(s.att, w.id, a, b); if (st.full + st.half + st.abs + st.off === 0) return; out.rows.push([R(w.name), R(st.full, 1), R(st.half, 1), R(st.abs, 1), R(st.off, 1), R(st.full + st.half / 2, 1)]); }); out.title = 'Monthly attendance'; }
    if (k === 'salary') { let T = 0; out.cols = [R('Worker'), R('Paid days', 1), R('Earned', 1), R('Extra', 1), R('Advance', 1), R('Paid', 1)]; s.workers.forEach((w) => { const st = stats(s.att, w.id, a, b); const ex = txSum(s.tx, w.id, 'extra', a, b), ad = txSum(s.tx, w.id, 'advance', a, b), pd = txSum(s.tx, w.id, 'payment', a, b); if (!st.earned && !ad && !pd) return; T += st.earned + ex; out.rows.push([R(w.name), R(st.full + st.half / 2, 1), R(inr(st.earned), 1), R(inr(ex), 1), R(inr(ad), 1), R(inr(pd), 1)]); }); out.total = { k: 'Total earned (incl. extra)', v: inr(T) }; out.title = 'Salary by worker'; }
    if (k === 'outstanding') { out.usesPeriod = false; let T = 0; out.cols = [R('Worker'), R('Type'), R('Last paid'), R('To pay', 1)]; s.workers.map((w) => ({ w, b: balance(s.att, s.tx, w.id) })).filter((x) => x.b > 0).sort((x, y) => y.b - x.b).forEach(({ w, b: bb }) => { T += bb; const lp = s.tx.filter((t) => t.wid === w.id && t.type === 'payment').sort((x, y) => (x.date < y.date ? 1 : -1))[0]; out.rows.push([R(w.name), R(CAT[w.cat]), R(lp ? fd(lp.date) : '—'), R(inr(bb), 1)]); }); out.total = { k: 'Total to pay (as of today)', v: inr(T) }; out.title = 'Outstanding payments'; }
    if (k === 'advance') { let T = 0; out.cols = [R('Worker'), R('Advance given', 1), R('Balance today', 1), R('Status')]; s.workers.forEach((w) => { const ad = txSum(s.tx, w.id, 'advance', a, b); if (!ad) return; const bb = balance(s.att, s.tx, w.id); const due = bb < 0 ? -bb : 0; T += due; out.rows.push([R(w.name), R(inr(ad), 1), R(inr(bb), 1), R(due ? `${inr(due)} to recover` : 'Recovered from wages')]); }); out.total = { k: 'Still to recover', v: inr(T) }; out.title = 'Advance balance'; }
    if (k === 'site') { let T = 0; out.cols = [R('Site'), R('Workers', 1), R('Man-days', 1), R('Labour cost', 1)]; s.sites.forEach((si) => { const ws = new Set(); let md = 0, c = 0; for (let d = a; d <= b && d <= D.TODAY; d = addDays(d, 1)) { const day = s.att[d] || {}; Object.entries(day).forEach(([wid, r]) => { if (r.site !== si.id) return; if (r.s === 'P' || r.s === 'H') { ws.add(wid); md += r.s === 'P' ? 1 : 0.5; c += pay(r.s, r.rate); } }); } T += c; out.rows.push([R(si.name), R(ws.size, 1), R(md, 1), R(inr(c), 1)]); }); out.total = { k: 'Total labour cost', v: inr(T) }; out.title = 'Labour cost by site'; }
    out.empty = !out.rows.length; return out;
  }

  hist() {
    const s = this.state, v = s.hView, d = s.hDate; const TODAY = D.TODAY, START = D.START; let a, b;
    if (v === 'day') { a = b = d; } else if (v === 'week') { a = addDays(d, -((dow(d) + 6) % 7)); b = addDays(a, 6); } else { a = d.slice(0, 7) + '-01'; b = monthEnd(d.slice(0, 7)); }
    const elig = (w, x) => w.joined <= x && !(w.left && x > w.left) && x <= TODAY; const one = s.hWorker !== 'all';
    const base = s.workers.filter((w) => (!one || w.id === s.hWorker) && w.joined <= b && (!w.left || w.left >= a));
    let F = 0, Hh = 0, Ab = 0, C = 0; base.forEach((w) => { const st = stats(s.att, w.id, a, b); F += st.full; Hh += st.half; Ab += st.abs; C += st.earned; });
    const step = (dir) => { let n; if (v === 'day') n = addDays(d, dir); else if (v === 'week') n = addDays(d, 7 * dir); else { const [y, m] = d.split('-').map(Number); n = d2s(new Date(Date.UTC(y, m - 1 + dir, 1))); } if (n > TODAY) n = TODAY; if (n < START) n = START; this.setState({ hDate: n }); };
    const canPrev = a > START, canNext = b < TODAY;
    const cellFor = (w, x) => { if (!elig(w, x)) return { lbl: '', bg: 'transparent', fg: 'var(--color-neutral-500)', border: 'none', op: 0.25, aria: fd(x) }; const r = (s.att[x] || {})[w.id]; if (!r) return { lbl: '', bg: 'transparent', fg: 'var(--color-neutral-500)', border: '1.5px dashed var(--color-neutral-600)', op: 1, aria: fd(x) + ': not marked' }; const m = ST[r.s]; return { lbl: m.short, bg: m.bg, fg: m.fg, border: 'none', op: 1, aria: fd(x) + ': ' + m.label }; };
    const short = (w) => (this.wv(w).dup ? w.name.split(' ').slice(0, 2).join(' ') : w.name.split(' ')[0]);
    let label, sub; if (v === 'day') { label = d === TODAY ? 'Today' : DAY[dow(d)]; sub = fdy(d); } else if (v === 'week') { label = fd(a) + ' – ' + fd(b); sub = 'Monday to Sunday' + (b > TODAY ? ' · so far' : ''); } else { const [y, m] = d.split('-').map(Number); label = MONF[m - 1] + ' ' + y; sub = b > TODAY ? 'Month so far' : 'Full month'; }
    const out = {
      views: [['day', 'Day'], ['week', 'Week'], ['month', 'Month']].map(([k, l]) => ({ label: l, ...seg(v === k), on: () => this.setState({ hView: k }) })),
      wchips: [{ id: 'all', name: 'All workers' }].concat(s.workers.map((w) => ({ id: w.id, name: short(w) + (w.active ? '' : ' (left)') }))).map((x) => ({ label: x.name, ...pill(s.hWorker === x.id), on: () => this.setState({ hWorker: x.id }) })),
      label, sub, prev: () => { if (canPrev) step(-1); }, next: () => { if (canNext) step(1); }, prevOp: canPrev ? 1 : 0.3, nextOp: canNext ? 1 : 0.3,
      stats: [{ n: F, label: 'Full days' }, { n: Hh, label: 'Half days' }, { n: Ab, label: 'Absent' }, { n: inr(C), label: one ? 'Earned' : 'Labour cost' }],
      isDay: v === 'day', isWeek: v === 'week', isMonth: v === 'month'
    };
    out.dayRows = base.filter((w) => elig(w, d)).map((w) => { const r = (s.att[d] || {})[w.id]; const m = r ? ST[r.s] : ST.N; return { w: this.wv(w), label: m.label, icon: 'ph-' + m.ic, bg: r ? m.bg : 'transparent', fg: r ? m.fg : 'var(--color-neutral-400)', border: r ? 'none' : '1px dashed var(--color-neutral-600)', meta: r ? this.siteName(r.site) + ' · ' + inr(r.rate) + '/day' : 'Not marked', amt: r ? inr(pay(r.s, r.rate)) : '—', open: () => this.go('profile', { wid: w.id, profTab: 'att', profMonth: d.slice(0, 7) }) }; });
    out.dayEmpty = !out.dayRows.length; out.editDay = () => this.go('att', { attDate: d, attSite: 'all', draft: {} }); out.dayEditLabel = d === TODAY ? 'Mark or edit today' : 'Edit attendance for ' + fd(d);
    const wd = [0, 1, 2, 3, 4, 5, 6].map((i) => addDays(a, i));
    out.weekHead = wd.map((x) => ({ d: DSH[dow(x)], n: s2d(x).getUTCDate(), fg: x === TODAY ? 'var(--color-accent)' : 'var(--color-neutral-400)', on: () => { if (x <= TODAY) this.setState({ hView: 'day', hDate: x }); } }));
    out.weekRows = base.map((w) => { const st = stats(s.att, w.id, a, b); return { w: this.wv(w), short: short(w), paid: String(st.full + st.half / 2), cells: wd.map((x) => ({ ...cellFor(w, x), on: () => { if (x <= TODAY) this.setState({ hView: 'day', hDate: x }); } })) }; });
    const cal = []; const lead = (dow(a) + 6) % 7; for (let i = 0; i < lead; i++) cal.push({ n: '', lbl: '', bg: 'transparent', fg: 'inherit', border: 'none', op: 0, aria: '', on: null });
    for (let x = a; x <= b; x = addDays(x, 1)) {
      const n = s2d(x).getUTCDate(); const fut = x > TODAY; const on = fut ? null : ((xx) => () => this.setState({ hView: 'day', hDate: xx }))(x); const today = x === TODAY ? '2px solid var(--color-accent)' : null;
      if (one) { const w = base[0]; const c = w ? cellFor(w, x) : { lbl: '', bg: 'transparent', fg: 'var(--color-neutral-500)', border: 'none', op: 0.25, aria: fd(x) }; cal.push({ ...c, n, border: today || c.border, on }); }
      else {
        const ws = s.workers.filter((w) => elig(w, x)); const day = s.att[x] || {}; let pres = 0, off = 0, mk = 0; ws.forEach((w) => { const r = day[w.id]; if (!r) return; mk++; if (r.s === 'P') pres++; else if (r.s === 'H') pres += 0.5; else if (r.s === 'O') off++; });
        const ratio = ws.length ? pres / ws.length : 0; const allOff = mk > 0 && off === mk;
        const bg = fut || !mk ? 'transparent' : allOff ? 'var(--color-neutral-800)' : ratio >= 0.85 ? 'var(--color-accent-700)' : ratio >= 0.5 ? 'var(--color-accent-800)' : 'var(--color-accent-900)';
        cal.push({ n, lbl: fut ? '' : !mk ? (ws.length ? '—' : '') : allOff ? 'Off' : pres + '/' + ws.length, bg, fg: fut ? 'var(--color-neutral-500)' : ratio >= 0.85 && !allOff ? 'var(--color-accent-100)' : 'var(--color-text)', border: today || (!fut && !mk && ws.length ? '1.5px dashed var(--color-neutral-600)' : 'none'), op: fut ? 0.35 : 1, aria: fd(x) + (mk ? ': ' + pres + ' of ' + ws.length + ' present' : ': not marked'), on });
      }
    }
    out.cal = cal;
    out.monthLegend = one ? ['P', 'H', 'A', 'O'].map((k) => ({ label: ST[k].label, bg: ST[k].bg, border: 'none' })) : [{ label: '85%+ came', bg: 'var(--color-accent-700)', border: 'none' }, { label: '50–85%', bg: 'var(--color-accent-800)', border: 'none' }, { label: 'Under 50%', bg: 'var(--color-accent-900)', border: 'none' }, { label: 'Not marked', bg: 'transparent', border: '1.5px dashed var(--color-neutral-600)' }];
    return out;
  }

  logoutAsk() { this.ask({ icon: 'ph-sign-out', title: 'Log out?', body: 'All your data stays safe in your account. You will need a code on your mobile to log in again.', ok: 'Log Out', onOk: async () => { await session.clear(); this.setState({ user: null, screen: 'home', stack: [], draft: {}, sites: [], workers: [], att: {}, tx: [], activity: [], auth: { ...AUTH0 } }); this.top(); } }); }
  setA(k, v) { this.setState((s) => ({ auth: { ...s.auth, [k]: v, err: '' } })); }
  authVals() {
    const s = this.state, a = s.auth, isS = a.mode === 'signup', isPin = a.step === 'pin';

    const goPin = () => this.setState((z) => ({ auth: { ...z.auth, step: 'pin', pin: '', confirmPin: '', err: '', fieldErr: {} } }));

    const submit = async () => {
      const x = this.state.auth;
      if (this.state.busy) return;

      // Step 1 — name (sign up) and mobile number
      if (x.step === 'phone') {
        if (x.mode === 'signup' && x.name.trim().length < 2) { this.setA('err', 'Please enter your name'); return; }
        if (!/^[6-9]\d{9}$/.test(x.mobile)) { this.setA('err', 'Enter a valid 10-digit mobile number'); return; }
        this.setState({ busy: true });
        try {
          // Check the number so people land on the right screen instead of hitting an error later.
          const chk = await api.checkMobile(x.mobile);
          if (x.mode === 'login' && !chk.registered) { this.setState({ busy: false, auth: { ...this.state.auth, err: 'No account with this number. Tap Sign up to create one.' } }); return; }
          if (x.mode === 'signup' && chk.registered) { this.setState({ busy: false, auth: { ...this.state.auth, err: 'This number is already registered. Please log in.' } }); return; }
          this.setState({ busy: false }, goPin);
        } catch (e) { this.setState({ busy: false, auth: { ...this.state.auth, err: e.message } }); }
        return;
      }

      // Step 2 — the PIN
      if (x.pin.length !== PIN_LEN) { this.setA('err', `Enter your ${PIN_LEN}-digit PIN`); return; }
      if (isS && x.confirmPin !== x.pin) { this.setA('err', "Both PINs don't match"); return; }
      this.setState({ busy: true });
      try {
        const r = isS
          ? await api.signup({ mobile: x.mobile, name: x.name, biz: x.biz, pin: x.pin, confirmPin: x.confirmPin })
          : await api.login({ mobile: x.mobile, pin: x.pin });
        await session.save(r.token);
        this.setState({ busy: false, screen: 'home', stack: [], auth: { ...AUTH0 } });
        await this.load(); this.top();
        this.toast((isS ? 'Welcome to Kaamtally, ' : 'Welcome back, ') + r.user.name.split(' ')[0]);
      } catch (e) {
        this.setState({ busy: false, auth: { ...this.state.auth, err: e.message, fieldErr: e.fields || {}, pin: '', confirmPin: '' } });
      }
    };

    const title = isPin ? (isS ? 'Create your PIN' : 'Enter your PIN') : isS ? 'Create account' : 'Welcome back';
    const sub = isPin
      ? (isS ? `Pick a ${PIN_LEN}-digit PIN. You'll use it every time you open the app, so choose something you won't forget.` : `Enter the ${PIN_LEN}-digit PIN for ${'+91 ' + mobFmt(a.mobile)}.`)
      : isS ? 'Track attendance, wages and payments for your team — no register needed.' : 'Log in with your mobile number to see your team and hisab.';

    return {
      f: a, isSignup: isS, isPhone: !isPin, isPin, err: a.err, mobileFmt: '+91 ' + mobFmt(a.mobile), busy: s.busy, pinLength: PIN_LEN,
      title, sub,
      modes: [['login', 'Log in'], ['signup', 'Sign up']].map(([k, l]) => ({ label: l, ...seg(a.mode === k), on: () => this.setState((z) => ({ auth: { ...z.auth, mode: k, err: '', fieldErr: {} } })) })),
      h: {
        name: (v) => this.setA('name', v), biz: (v) => this.setA('biz', v),
        mobile: (v) => this.setA('mobile', v.replace(/\D/g, '').slice(-10)),
        pin: (v) => this.setA('pin', v), confirmPin: (v) => this.setA('confirmPin', v)
      },
      cta: isPin ? (isS ? 'Create Account' : 'Log In') : 'Continue', submit,
      hint: isPin
        ? (isS ? 'Keep your PIN private. Anyone with it can see your hisab.' : 'Forgot your PIN? Ask whoever set up the app to reset it for you.')
        : isS ? 'You choose a PIN on the next screen — no OTP, no SMS.' : 'New here? Choose Sign up above.',
      demoLabel: `Use demo account · ${mobFmt(DEMO_MOBILE)}`,
      showDemo: !isPin && !isS, demo: () => this.setState((z) => ({ auth: { ...z.auth, mobile: DEMO_MOBILE, err: '' } })),
      changeNumber: () => this.setState((z) => ({ auth: { ...z.auth, step: 'phone', pin: '', confirmPin: '', err: '', fieldErr: {} } }))
    };
  }

  renderVals() {
    const s = this.state; const TODAY = D.TODAY, START = D.START; const wide = s.vw >= 900;
    const sc = s.screen; const td = s.att[TODAY] || {}; const { cur: curM, prev: prevM } = this.months();
    const navItems = [{ k: 'home', label: 'Home', icon: 'house' }, { k: 'att', label: 'Attendance', icon: 'calendar-check' }, { k: 'workers', label: 'Workers', icon: 'users-three' }, { k: 'hisab', label: 'Salary', icon: 'wallet' }, { k: 'more', label: 'More', icon: 'dots-three-circle' }];
    const tabOf = { history: 'att', home: 'home', att: 'att', workers: 'workers', form: 'workers', profile: 'workers', hisab: 'hisab', ledger: 'hisab', tx: 'hisab', more: 'more', sites: 'more', reports: 'more', report: 'more', settings: 'more' };
    const curTab = wide && ['history', 'sites', 'reports', 'report', 'settings'].includes(sc) ? (sc === 'report' ? 'reports' : sc) : tabOf[sc];
    const bottomNav = navItems.map((n) => { const on = tabOf[sc] === n.k; return { k: n.k, label: n.label, icon: 'ph-fill ph-' + n.icon, on: on, fg: on ? 'var(--color-accent)' : 'var(--color-neutral-400)', pill: on ? 'var(--color-accent-900)' : 'transparent', dot: on ? 'var(--color-accent)' : 'transparent', press: () => this.tab(n.k, n.k === 'att' ? { attDate: TODAY } : null) }; });
    const sideNav = navItems.filter((n) => n.k !== 'more').concat([{ k: 'history', label: 'History', icon: 'clock-counter-clockwise' }, { k: 'sites', label: 'Sites', icon: 'buildings' }, { k: 'reports', label: 'Reports', icon: 'chart-bar' }, { k: 'settings', label: 'Settings', icon: 'gear' }]).map((n) => { const on = curTab === n.k; return { label: n.label, icon: 'ph-fill ph-' + n.icon, bg: on ? 'var(--color-accent-900)' : 'transparent', fg: on ? 'var(--color-accent-200)' : 'var(--color-neutral-300)', on: () => this.tab(n.k) }; });
    const legend = ['P', 'H', 'A', 'O'].map((k) => ({ label: ST[k].label, icon: 'ph-' + ST[k].ic, dot: ST[k].dot }));

    const hw = s.workers.filter((w) => w.active && (s.activeSite === 'all' || w.site === s.activeSite));
    let P = 0, H = 0, A = 0, cost = 0; hw.forEach((w) => { const r = td[w.id]; if (!r) return; if (r.s === 'P') P++; else if (r.s === 'H') H++; else if (r.s === 'A') A++; cost += pay(r.s, r.rate); });
    const unm = hw.filter((w) => !td[w.id]); const markedN = hw.length - unm.length;
    const allW = s.workers.filter((w) => s.activeSite === 'all' || w.site === s.activeSite); let out = 0, outN = 0; allW.forEach((w) => { const b = balance(s.att, s.tx, w.id); if (b > 0) { out += b; outN++; } });
    const goAtt = () => this.tab('att', { attDate: TODAY, attSite: s.activeSite });
    const week = []; let wt = 0; for (let i = 6; i >= 0; i--) { const d = addDays(TODAY, -i); const day = s.att[d] || {}; let c = 0; Object.values(day).forEach((r) => { if (s.activeSite !== 'all' && r.site !== s.activeSite) return; c += pay(r.s, r.rate); }); wt += c; week.push({ d: i === 0 ? 'Today' : DSH[dow(d)], c }); }
    const wmax = Math.max(...week.map((x) => x.c), 1);
    const um = unm.map((w) => w.name.split(' ')[0]);
    const home = {
      cards: [
        { label: 'Workers', icon: 'ph-users-three', value: hw.length, sub: `${hw.filter((w) => w.cat === 'karigar').length} masons · ${hw.filter((w) => w.cat === 'majdoor').length} labourers`, span: 1, on: () => this.tab('workers') },
        { label: "Today's cost", icon: 'ph-currency-inr', value: inr(cost), sub: 'For marked workers', span: 1, on: goAtt },
        { label: 'Salary to pay', icon: 'ph-wallet', value: inr(out), sub: `Owed to ${outN} workers`, span: 2, on: () => this.tab('hisab') }],
      markedText: `${markedN} of ${hw.length} marked`, leftText: unm.length ? `${unm.length} still to mark` : 'Everyone is marked', pctText: hw.length ? Math.round(markedN / hw.length * 100) + '%' : '0%', pct: hw.length ? markedN / hw.length : 0,
      counts: [{ label: 'Present', n: P, icon: 'ph-check-circle', dot: ST.P.dot }, { label: 'Half Day', n: H, icon: 'ph-circle-half', dot: ST.H.dot }, { label: 'Absent', n: A, icon: 'ph-x-circle', dot: ST.A.dot }],
      hasUnmarked: unm.length > 0, unmarked: unm.slice(0, 5).map((w) => this.wv(w)), unmarkedNames: um.slice(0, 3).join(', ') + (um.length > 3 ? ` +${um.length - 3} more` : ''), ctaLabel: unm.length ? 'Mark Attendance' : 'View Attendance',
      week: week.map((x) => ({ d: x.d, v: x.c ? (x.c >= 1000 ? (x.c / 1000).toFixed(1) + 'k' : x.c) : '', h: Math.round(x.c / wmax * 80), bg: x.d === 'Today' ? 'var(--color-accent)' : 'var(--color-accent-800)', fg: x.d === 'Today' ? 'var(--color-accent)' : 'var(--color-neutral-400)' })), weekTotal: inr(wt)
    };
    const activeSites = s.sites.filter((x) => x.status === 'active');
    const homeSiteChips = [{ id: 'all', name: 'All sites' }].concat(activeSites).map((x) => ({ label: x.name, ...pill(s.activeSite === x.id), on: () => this.setState({ activeSite: x.id }) }));
    const quick = [{ label: 'Add Worker', icon: 'ph-user-plus', on: () => this.openForm() }, { label: 'Attendance', icon: 'ph-calendar-check', on: goAtt }, { label: 'Pay', icon: 'ph-hand-coins', on: () => this.openTx('payment') }, { label: 'Advance', icon: 'ph-arrow-circle-up-right', on: () => this.openTx('advance') }, { label: 'Salary', icon: 'ph-wallet', on: () => this.tab('hisab') }];

    const ad = s.attDate, aday = s.att[ad] || {}; const rowsW = this.attRows(); let aP = 0, aH = 0, aA = 0, aO = 0, aC = 0, aM = 0;
    const rows = rowsW.map((w) => {
      const v = this.wv(w); const saved = aday[w.id]; const dr = s.draft[w.id]; const cur = dr ? dr.s : (saved && saved.s); const rate = rateOn(w, ad);
      if (cur) { aM++; if (cur === 'P') aP++; else if (cur === 'H') aH++; else if (cur === 'A') aA++; else aO++; aC += pay(cur, saved && !dr ? saved.rate : rate); }
      const curSite = dr ? dr.site : saved ? saved.site : w.site;
      const note = saved && s.attSite !== 'all' && saved.site !== s.attSite && !dr ? `Marked at ${this.siteName(saved.site)} on this day` : (w.joined === ad ? 'Joined today' : '');
      return { w: v, meta: [v.cat, inr(rate) + '/day', s.attSite === 'all' ? (curSite ? this.siteName(curSite) : 'No site') : ''].filter(Boolean).join(' · '), changed: !!dr, note, shadow: dr ? '0 0 0 1.5px var(--color-accent-600)' : null,
        btns: ['P', 'H', 'A', 'O'].map((k) => { const m = ST[k], sel = cur === k; return { k, label: m.label, sel, ic: (sel ? 'ph-fill ph-' : 'ph ph-') + m.ic, bg: sel ? m.bg : 'transparent', fg: sel ? m.fg : 'var(--color-neutral-400)', sh: sel ? '0 2px 8px rgba(0,0,0,.3)' : 'none', on: () => this.mark(w.id, k) }; }) };
    });
    const draftN = Object.keys(s.draft).length;
    const days = []; for (let i = 6; i >= 0; i--) { const d = addDays(TODAY, -i); const on = d === ad; const day = s.att[d] || {}; const tot = s.workers.filter((w) => w.active && w.joined <= d).length; const mk = s.workers.filter((w) => w.active && day[w.id]).length; days.push({ dow: i === 0 ? 'Today' : DSH[dow(d)], n: s2d(d).getUTCDate(), bg: on ? 'var(--color-accent-800)' : 'var(--color-surface)', fg: on ? 'var(--color-accent-100)' : 'var(--color-text)', dot: mk >= tot && tot ? 'var(--color-accent-400)' : mk > 0 ? 'var(--color-neutral-500)' : 'transparent', on: () => this.setAttDate(d) }); }
    const siteOpts = [{ id: 'all', name: 'All sites' }].concat(activeSites);
    const att = {
      days, siteChips: siteOpts.map((x) => ({ label: x.name, ...seg(s.attSite === x.id), on: () => this.setState({ attSite: x.id }) })),
      isPast: ad < TODAY, isSunday: dow(ad) === 0 && s.sundayOff, dateLabel: (ad === TODAY ? 'Today, ' : DAY[dow(ad)] + ', ') + fdy(ad) + (s.attSite === 'all' ? ' · All sites' : ' · ' + this.siteName(s.attSite)),
      markedN: aM, totalN: rows.length, leftText: rows.length - aM ? `${rows.length - aM} left` : 'All done', pct: rows.length ? aM / rows.length : 0, canMarkAll: rows.length - aM > 0, markAll: this.markAll,
      counts: [{ label: 'Present', n: aP, icon: 'ph-check-circle', dot: ST.P.dot }, { label: 'Half', n: aH, icon: 'ph-circle-half', dot: ST.H.dot }, { label: 'Absent', n: aA, icon: 'ph-x-circle', dot: ST.A.dot }, { label: 'Off', n: aO, icon: 'ph-moon', dot: ST.O.dot }], cost: inr(aC), rows, empty: !rows.length,
      showSave: sc === 'att' && draftN > 0, draftN, save: this.saveAtt, discard: () => this.setState({ draft: {} }), busy: s.busy
    };

    const q = s.wq.trim().toLowerCase();
    const wl = s.workers.filter((w) => { if (s.wcat === 'inactive') return !w.active; if (!w.active) return false; if (s.wcat !== 'all' && w.cat !== s.wcat) return false; return true; }).filter((w) => !q || w.name.toLowerCase().includes(q) || w.mobile.includes(q.replace(/\s/g, '')))
      .sort((x, y) => (s.newIds[y.id] ? 1 : 0) - (s.newIds[x.id] ? 1 : 0) || x.name.localeCompare(y.name));
    const wd = {
      chips: [['all', 'All'], ['karigar', 'Masons'], ['majdoor', 'Labourers'], ['inactive', 'Left']].map(([k, l]) => ({ label: l, ...seg(s.wcat === k), on: () => this.setState({ wcat: k }) })),
      list: wl.map((w) => { const v = this.wv(w); const r = td[w.id]; return { ...v, isNew: !!s.newIds[w.id], op: w.active ? 1 : 0.65, st: w.active ? (r ? { ...ST[r.s], icon: 'ph-' + ST[r.s].ic } : { ...ST.N, icon: 'ph-circle-dashed' }) : { label: 'Left ' + (w.left ? fd(w.left) : ''), icon: 'ph-sign-out', dot: 'var(--color-neutral-500)' } }; }),
      empty: !wl.length && !!q, none: !wl.length && !q
    };

    const f = s.form || { name: '', mobile: '', cat: 'majdoor', wage: '', joined: TODAY, site: '', notes: '', active: true, eff: TODAY }; const fw = parseInt(f.wage, 10) || 0;
    const fh = {}; ['name', 'notes', 'joined', 'site', 'eff'].forEach((k) => { fh[k] = (v) => this.setF(k, v); }); fh.mobile = (v) => this.setF('mobile', v.replace(/\D/g, '').slice(-10)); fh.wage = (v) => this.setF('wage', v.replace(/\D/g, '').slice(0, 5));
    const dupW = f.name.trim().length > 2 && s.workers.find((w) => w.id !== f.id && w.name.toLowerCase() === f.name.trim().toLowerCase());
    const effAffected = f.id && fw !== f.origWage ? Object.keys(s.att).filter((d) => d >= f.eff && s.att[d][f.id]).length : 0;
    const fv = {
      isEdit: !!f.id, saveLabel: f.id ? 'Save Changes' : 'Save Worker',
      cats: [['karigar', 'Mason', 'Karigar · tile fitter'], ['majdoor', 'Labourer', 'Majdoor · helper']].map(([k, l, h]) => { const on = f.cat === k; return { label: l, hi: h, ic: on ? 'ph-fill ph-check-circle' : 'ph ph-circle', bg: on ? 'var(--color-accent-900)' : 'var(--color-surface)', fg: on ? 'var(--color-accent-100)' : 'var(--color-neutral-300)', sh: on ? '0 0 0 1.5px var(--color-accent)' : null, on: () => this.setF('cat', k) }; }),
      wageChips: (f.cat === 'karigar' ? [850, 900, 950, 1000] : [550, 600, 650, 700]).map((n) => ({ label: inr(n), on: () => this.setF('wage', String(n)) })),
      halfText: fw ? `Half day = ${inr(fw / 2)} · 26 full days = ${inr(fw * 26)}` : 'Enter the full-day wage',
      wageChanged: !!f.id && fw > 0 && fw !== f.origWage, wageMsg: f.id ? `${inr(f.origWage || 0)} → ${inr(fw)}. Attendance before the chosen date keeps the old rate.${effAffected ? ` ${effAffected} day${effAffected > 1 ? 's' : ''} will be recalculated at the new rate.` : ''}` : '',
      midMonth: !f.id && s2d(f.joined).getUTCDate() > 1,
      dupWarn: dupW ? `A worker named "${dupW.name}" already exists (${mobFmt(dupW.mobile)}). If they're different people, the mobile number will tell them apart.` : '',
      siteOpts: [{ id: '', name: 'None' }].concat(activeSites).map((o) => ({ id: o.id, name: o.name })),
      act: { ...sw(f.active), label: f.active ? 'Shows in daily attendance' : 'Left the business', toggle: () => { if (f.active) { const b = f.id ? balance(s.att, s.tx, f.id) : 0; this.ask({ icon: 'ph-user-minus', title: 'Mark as inactive?', body: `${f.name} will no longer appear in attendance. All past attendance and payments are kept safely.${b > 0 ? ` Note: ${inr(b)} is still to be paid.` : b < 0 ? ` Note: ${inr(-b)} advance is still to be recovered.` : ' Their account is fully settled.'}`, ok: 'Mark Inactive', onOk: () => this.setF('active', false) }); } else this.setF('active', true); } },
      busy: s.busy
    };

    const pw = s.wid && this.W(s.wid); let pf = { w: {}, actions: [], tabs: [], details: [], monthChips: [], mcounts: [], cal: [], formula: [], sum: [], recent: [] };
    if (pw) {
      const v = this.wv(pw); const pm = s.profMonth; const first = pm + '-01'; const last = monthEnd(pm); const dim = Number(last.slice(8));
      const cal = []; const lead = (dow(first) + 6) % 7; for (let i = 0; i < lead; i++) cal.push({ n: '', lbl: '', bg: 'transparent', fg: 'inherit', border: 'none', op: 0, aria: '', on: null });
      for (let i = 1; i <= dim; i++) { const d = pm + '-' + String(i).padStart(2, '0'); const r = (s.att[d] || {})[pw.id]; const outR = d > TODAY || d < pw.joined || (pw.left && d > pw.left) || d < START; const m2 = r ? ST[r.s] : ST.N;
        cal.push({ n: i, lbl: r ? m2.short : '', bg: r ? m2.bg : 'transparent', fg: r ? m2.fg : 'var(--color-neutral-500)', border: d === TODAY ? '2px solid var(--color-accent)' : (r || outR ? 'none' : '1px dashed var(--color-neutral-700)'), op: outR ? 0.3 : 1, aria: `${fd(d)}: ${r ? m2.label : 'not marked'}`, on: outR ? null : () => this.openDayEdit(pw.id, d) }); }
      const st = stats(s.att, pw.id, first, last); const formula = Object.entries(st.groups).flatMap(([rate, g]) => { const r = +rate; const o = []; if (g.f) o.push({ k: `${g.f} full days × ${inr(r)}`, v: inr(g.f * r) }); if (g.h) o.push({ k: `${g.h} half days × ${inr(r / 2)}`, v: inr(g.h * r / 2) }); return o; });
      const bal = balance(s.att, s.tx, pw.id); const all = stats(s.att, pw.id, '0000-01-01', TODAY); const ex = txSum(s.tx, pw.id, 'extra', '0000-01-01', TODAY), av = txSum(s.tx, pw.id, 'advance', '0000-01-01', TODAY), pd = txSum(s.tx, pw.id, 'payment', '0000-01-01', TODAY);
      const ptx = s.tx.filter((t) => t.wid === pw.id).sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
      const whs = pw.wh.map((h) => `${inr(h.rate)} from ${fd(h.from)}`).join(' → ');
      pf = {
        w: v,
        actions: [{ label: 'Call', icon: 'ph-phone', on: () => { Linking.openURL('tel:+91' + pw.mobile).catch(() => this.toast("Couldn't open the phone app", 'err')); } }, { label: 'Attendance', icon: 'ph-calendar-check', on: () => this.setState({ profTab: 'att' }) }, { label: 'Pay', icon: 'ph-hand-coins', on: () => this.openTx('payment', pw.id) }, { label: 'Edit', icon: 'ph-pencil-simple', on: () => this.openForm(pw) }],
        tabs: [['overview', 'Overview'], ['att', 'Attendance'], ['hisab', 'Salary']].map(([k, l]) => ({ label: l, ...seg(s.profTab === k), on: () => this.setState({ profTab: k }) })),
        tOverview: s.profTab === 'overview', tAtt: s.profTab === 'att', tHisab: s.profTab === 'hisab',
        details: [{ icon: 'ph-identification-card', k: 'Type of work', v: v.cat }, { icon: 'ph-currency-inr', k: 'Daily wage', v: v.wage, sub: pw.wh.length > 1 ? 'History: ' + whs : '' }, { icon: 'ph-calendar-plus', k: 'Joined', v: fdy(pw.joined) }, { icon: 'ph-phone', k: 'Mobile', v: '+91 ' + v.mobileFmt }, { icon: 'ph-map-pin', k: 'Default site', v: v.site }, { icon: 'ph-toggle-right', k: 'Status', v: pw.active ? 'Active' : 'Inactive', sub: pw.left ? `Left on ${fdy(pw.left)} · records kept` : '' }, { icon: 'ph-note', k: 'Notes', v: pw.notes || '—' }],
        monthChips: [[prevM, monthName(prevM, true)], [curM, monthName(curM, true)]].map(([k, l]) => ({ label: l, ...seg(pm === k), on: () => this.setState({ profMonth: k }) })),
        mcounts: [{ n: st.full, label: 'Full' }, { n: st.half, label: 'Half' }, { n: st.abs, label: 'Absent' }, { n: st.off, label: 'Off' }], cal,
        monthLabel: pm === curM ? `${monthName(pm, true)} (so far)` : monthName(pm, true), formula: formula.length ? formula : [{ k: 'No paid days', v: inr(0) }], monthEarned: inr(st.earned),
        bal: inr(bal), balLabel: bal >= 0 ? 'To pay (as of today)' : 'Advance still owed by worker', balNote: bal > 0 ? `You owe ${pw.name.split(' ')[0]} ${inr(bal)}` : bal < 0 ? `${inr(-bal)} will be recovered from upcoming wages` : 'All settled — nothing due',
        sum: [{ k: `Earned (${all.full} full + ${all.half} half days)`, v: inr(all.earned), wt: 400 }, { k: '+ Extra earnings', v: inr(ex), wt: 400 }, { k: '− Advances given', v: inr(av), wt: 400 }, { k: '− Payments made', v: inr(pd), wt: 400 }, { k: '= Balance', v: inr(bal), wt: 600 }],
        recent: ptx.map((t) => ({ icon: t.type === 'payment' ? 'ph-hand-coins' : t.type === 'advance' ? 'ph-arrow-circle-up-right' : 'ph-plus-circle', title: t.type === 'payment' ? 'Payment' : t.type === 'advance' ? 'Advance' : 'Extra earning', sub: [fd(t.date), t.method, t.note].filter(Boolean).join(' · '), amt: (t.type === 'extra' ? '+' : '−') + inr(t.amount) })), noTx: !ptx.length,
        pay: () => this.openTx('payment', pw.id), adv: () => this.openTx('advance', pw.id), ledger: () => this.go('ledger', { wid: pw.id })
      };
    }

    const [pa, pb] = this.perRange(); const pl = `${fd(pa)} – ${fdy(pb)}`;
    const periodChips = [['cur', monthName(curM)], ['prev', monthName(prevM)], ['all', 'All'], ['custom', 'Custom']].map(([k, l]) => ({ label: l, ...seg(s.period === k), on: () => this.setState({ period: k }) }));
    let E = 0, X = 0, AV = 0, PD = 0, OP = 0, CL = 0;
    const hrows = s.workers.map((w) => { const st = stats(s.att, w.id, pa, pb); const ex = txSum(s.tx, w.id, 'extra', pa, pb), av = txSum(s.tx, w.id, 'advance', pa, pb), pd = txSum(s.tx, w.id, 'payment', pa, pb); const op = balance(s.att, s.tx, w.id, addDays(pa, -1)); const cl = op + st.earned + ex - av - pd; E += st.earned; X += ex; AV += av; PD += pd; OP += op; CL += cl;
      return { w, cl, st, ex, av, pd, act: st.earned || ex || av || pd || op }; }).filter((r) => r.act || r.w.active).sort((a, b) => b.cl - a.cl).map((r) => ({ w: this.wv(r.w), bal: inr(r.cl), lbl: r.cl > 0 ? 'To pay' : r.cl < 0 ? 'Advance due' : 'Settled', lfg: r.cl > 0 ? 'var(--color-accent-300)' : 'var(--color-neutral-400)', sub: `Earned ${inr(r.st.earned + r.ex)} · Given ${inr(r.av + r.pd)}${r.w.active ? '' : ' · Inactive'}`, open: () => this.go('ledger', { wid: r.w.id }) }));
    const hs = { close: inr(CL), closeLabel: `Total to pay · as of ${fdy(pb)}`, lines: [{ k: `Opening balance (${fd(addDays(pa, -1))})`, v: inr(OP) }, { k: '+ Wages earned', v: inr(E) }, { k: '+ Extra earnings', v: inr(X) }, { k: '− Advances given', v: inr(AV) }, { k: '− Payments made', v: inr(PD) }], rows: hrows };

    let lg = { stats: [], rows: [] };
    if (pw) {
      const L = this.ledger(pw.id, pa, pb); const st = stats(s.att, pw.id, pa, pb); const TY = { wage: ['ph-briefcase', 'var(--color-accent-400)'], payment: ['ph-hand-coins', 'var(--color-neutral-300)'], advance: ['ph-arrow-circle-up-right', 'var(--color-neutral-300)'], extra: ['ph-plus-circle', 'var(--color-accent-400)'] };
      lg = { stats: [{ n: st.full, label: 'Full days' }, { n: st.half, label: 'Half days' }, { n: inr(st.earned), label: 'Earned' }], open: inr(L.open), openDate: fd(pa), close: inr(L.close), closeLabel: L.close >= 0 ? `To pay · ${fd(pb)}` : `Advance due · ${fd(pb)}`, empty: !L.rows.length,
        rows: L.rows.map((r) => ({ d: fd(r.date), icon: TY[r.type][0], ifg: TY[r.type][1], desc: r.desc, sub: r.sub, amt: (r.amt >= 0 ? '+' : '') + inr(r.amt), afg: r.amt >= 0 ? 'var(--color-accent-300)' : 'var(--color-text)', bal: 'Bal ' + inr(r.bal) })),
        pay: () => this.openTx('payment', pw.id), adv: () => this.openTx('advance', pw.id), extra: () => this.openTx('extra', pw.id), att: () => this.go('profile', { wid: pw.id, profTab: 'att' }) };
    }

    const t = s.txf || { type: 'payment', wid: '', amount: '', date: TODAY, method: 'Cash', note: '' }; const tw = t.wid && this.W(t.wid); const tb = tw ? balance(s.att, s.tx, tw.id) : 0; const ta = parseInt(t.amount, 10) || 0;
    const th = { wid: (v) => this.setT('wid', v), amount: (v) => this.setT('amount', v.replace(/\D/g, '').slice(0, 6)), date: (v) => this.setT('date', v), note: (v) => this.setT('note', v) };
    const tl = t.type === 'payment' ? 'Payment' : t.type === 'advance' ? 'Advance' : 'Extra Earning';
    const tv = {
      types: [['payment', 'Payment'], ['advance', 'Advance'], ['extra', 'Extra']].map(([k, l]) => ({ label: l, ...seg(t.type === k), on: () => this.setT('type', k) })),
      wOpts: s.workers.filter((w) => w.active || w.id === t.wid).map((w) => ({ id: w.id, name: `${w.name} ··${w.mobile.slice(-4)}` })),
      bal: tw ? inr(tb) : '—', balLbl: tw ? (tb > 0 ? 'to pay' : tb < 0 ? 'advance due' : 'settled') : '',
      amtWords: ta ? (t.type === 'payment' && tw && ta === tb ? 'This clears the full balance' : 'Amount in rupees') : 'Enter amount',
      chips: (t.type === 'payment' && tb > 0 ? [{ label: `Full ${inr(tb)}`, on: () => this.setT('amount', String(tb)) }] : []).concat([500, 1000, 2000, 5000].map((n) => ({ label: inr(n), on: () => this.setT('amount', String(n)) }))),
      warn: t.type === 'payment' && tw && ta > tb ? (tb > 0 ? `This is ${inr(ta - tb)} more than the balance (${inr(tb)}). The extra will count as an advance.` : 'Nothing is due right now — this full amount will count as an advance.') : (t.type === 'advance' && tw && tb - ta < 0 ? `After this advance the worker will owe ${inr(ta - tb)}. It's recovered from future wages automatically — never deducted twice.` : ''),
      showMethod: t.type !== 'extra', methods: [['Cash', 'ph-money'], ['UPI', 'ph-device-mobile'], ['Bank Transfer', 'ph-bank'], ['Other', 'ph-dots-three-circle']].map(([k, ic]) => { const on = t.method === k; return { label: k === 'Bank Transfer' ? 'Bank' : k, icon: ic, bg: on ? 'var(--color-accent-900)' : 'var(--color-surface)', fg: on ? 'var(--color-accent-100)' : 'var(--color-neutral-300)', sh: on ? '0 0 0 1.5px var(--color-accent)' : null, on: () => this.setT('method', k) }; }),
      notePh: t.type === 'extra' ? 'e.g. Sunday overtime' : t.method === 'UPI' || t.method === 'Bank Transfer' ? 'UTR / reference' : 'Optional',
      hasPreview: !!tw && ta > 0, newBal: inr(t.type === 'extra' ? tb + ta : tb - ta), cta: `Save ${tl}`, busy: s.busy
    };

    const sv = { list: s.sites.map((si) => {
      const ws = s.workers.filter((w) => w.active && w.site === si.id); let tp = 0; Object.values(td).forEach((r) => { if (r.site === si.id && (r.s === 'P' || r.s === 'H')) tp++; }); let c = 0; for (let d = curM + '-01'; d <= TODAY; d = addDays(d, 1)) { Object.values(s.att[d] || {}).forEach((r) => { if (r.site === si.id) c += pay(r.s, r.rate); }); }
      const act = si.status === 'active';
      return { id: si.id, name: si.name, meta: [si.area, si.client].filter(Boolean).join(' · '), status: act ? 'Active' : 'Completed', tagBg: act ? 'var(--color-accent-800)' : 'var(--color-neutral-800)', tagFg: act ? 'var(--color-accent-100)' : 'var(--color-neutral-200)', op: act ? 1 : 0.7, active: act,
        stats: [{ n: ws.length, label: 'Workers' }, { n: tp, label: 'Present today' }, { n: inr(c), label: `${monthName(curM, true)} cost` }], names: ws.length ? ws.map((w) => w.name.split(' ').slice(0, 2).join(' ')).join(', ') : '',
        att: () => this.tab('att', { attSite: si.id, attDate: TODAY }), toggleLabel: act ? 'Mark Completed' : 'Make Active',
        toggle: () => this.ask({ icon: 'ph-buildings', title: act ? 'Mark site completed?' : 'Make site active?', body: act ? `${si.name} will be marked completed. ${ws.length ? ws.length + ' workers will lose it as their default site. ' : ''}Past attendance and costs are kept.` : `${si.name} will appear in attendance again.`, ok: act ? 'Mark Completed' : 'Make Active',
          onOk: async () => { try { await api.updateSite(si.id, { status: act ? 'completed' : 'active' }); this.setState((x) => ({ sites: x.sites.map((z) => (z.id === si.id ? { ...z, status: act ? 'completed' : 'active' } : z)), workers: act ? x.workers.map((w) => (w.site === si.id ? { ...w, site: '' } : w)) : x.workers, activeSite: x.activeSite === si.id ? 'all' : x.activeSite, attSite: x.attSite === si.id ? 'all' : x.attSite })); } catch (e) { this.failToast(e); } } }) };
    }) };
    const sf = s.siteForm || {}; const sh = {}; ['name', 'client', 'address', 'start'].forEach((k) => { sh[k] = (v) => this.setState((x) => ({ siteForm: { ...x.siteForm, [k]: v }, siteErr: '' })); });

    const rp = this.report(s.report);
    rp.csv = () => this.csv(`Kaamtally-${s.report}-${rp.usesDate ? s.rDate : pa + '_' + pb}`, [rp.cols.map((c) => c.v)].concat(rp.rows.map((r) => r.map((c) => c.v))));
    rp.share = () => sharePdf(rp.title, rp.usesDate ? fdy(s.rDate) : rp.usesPeriod ? pl : 'As of ' + fdy(TODAY), rp.cols, rp.rows, rp.total).catch(() => this.toast("Couldn't create the PDF", 'err'));
    const rv = { list: REPORTS.map((r) => ({ ...r, on: () => this.go('report', { report: r.k }) })) };
    const ic = (bg, fg) => ({ bg, fg });
    const U = s.user || { name: '', biz: '', mobile: '', city: '' };
    const lastB = U.lastBackup ? new Date(U.lastBackup) : null;
    const lbDs = lastB ? lastB.getFullYear() + '-' + String(lastB.getMonth() + 1).padStart(2, '0') + '-' + String(lastB.getDate()).padStart(2, '0') : '';
    const lbStr = lastB ? fdy(lbDs) + ', ' + timeAgo(U.lastBackup, lbDs) : '';
    const moreList = [{ items: [{ icon: 'ph-buildings', label: 'Sites', val: `${activeSites.length} active`, ...ic('var(--color-accent-800)', 'var(--color-accent-100)'), on: () => this.go('sites') }, { icon: 'ph-chart-bar', label: 'Reports', val: '', ...ic('var(--color-accent-800)', 'var(--color-accent-100)'), on: () => this.go('reports') }] },
      { items: [{ icon: 'ph-sliders', label: 'Wage rules', val: 'Half = 0.5', ...ic('var(--color-neutral-700)', 'var(--color-neutral-100)'), on: () => this.go('settings') }, { icon: 'ph-calendar-check', label: 'Attendance settings', val: '', ...ic('var(--color-neutral-700)', 'var(--color-neutral-100)'), on: () => this.go('settings') }, { icon: 'ph-storefront', label: 'Business profile', val: '', ...ic('var(--color-neutral-700)', 'var(--color-neutral-100)'), on: () => this.go('settings') }, { icon: 'ph-cloud-arrow-up', label: 'Backup & export', val: lastB ? fd(lbDs) : '', ...ic('var(--color-neutral-700)', 'var(--color-neutral-100)'), on: () => this.go('settings') }, { icon: 'ph-translate', label: 'Language', val: s.lang, ...ic('var(--color-neutral-700)', 'var(--color-neutral-100)'), on: () => this.go('settings') }] },
      { items: [{ icon: 'ph-sign-out', label: 'Log out', val: '', ...ic('var(--color-neutral-800)', 'var(--color-accent-300)'), on: () => this.logoutAsk() }] }];
    const me = { name: U.name, first: U.name.split(' ')[0] || '', biz: U.biz || (U.name ? U.name.split(' ')[0] + "'s Tiles Work" : ''), ini: ini(U.biz || U.name || 'K'), line: [U.name, U.mobile ? '+91 ' + mobFmt(U.mobile) : '', U.city].filter(Boolean).join(' · '), mobile: U.mobile, city: U.city };
    const setv = {
      themes: [['light', 'Light'], ['dark', 'Dark'], ['auto', 'Auto']].map(([k, l]) => ({ label: l, ...seg(s.theme === k), on: () => this.saveSettings({ theme: k }) })), rules: [{ k: 'Present (full day)', v: '1 day wage' }, { k: 'Half day', v: '0.5 day wage' }, { k: 'Absent / Off', v: '₹0' }, { k: 'Advance', v: 'Deducted once, same day' }],
      toggles: [{ label: 'Sunday weekly off', sub: 'Show a reminder on Sundays', ...sw(s.sundayOff), toggle: () => this.saveSettings({ sundayOff: !s.sundayOff }) }, { label: 'Confirm past-date changes', sub: 'Prevents accidental edits', ...sw(s.pastConfirm), toggle: () => this.saveSettings({ pastConfirm: !s.pastConfirm }) }],
      langs: ['English', 'हिंदी'].map((l) => ({ label: l, ...seg(s.lang === l), on: () => { this.saveSettings({ lang: l }); if (l !== 'English') this.toast('Hindi saved — full translation comes in the next version'); } })),
      biz: [{ k: 'Business', v: me.biz }, { k: 'Owner', v: me.name }, { k: 'Mobile', v: '+91 ' + mobFmt(me.mobile) }, { k: 'City', v: me.city || '—' }],
      backupText: lastB ? `Last backup: ${lbStr} · Exported` : 'No backup yet — export your full hisab as a file.'
    };

    const backLabels = { history: 'History', home: 'Home', att: 'Attendance', workers: 'Workers', profile: 'Profile', hisab: 'Salary', ledger: 'Ledger', more: 'More', sites: 'Sites', reports: 'Reports', settings: 'Settings', form: 'Back', tx: 'Back', report: 'Back' };
    const prev = s.stack[s.stack.length - 1];
    const titleMap = { ...TITLES, form: f.id ? 'Edit Worker' : 'New Worker', tx: tl, report: rp.title || 'Report', profile: pw ? pw.name : 'Worker', ledger: pw ? pw.name : 'Ledger' };
    const subMap = { history: 'Attendance by day, week or month', att: (ad === TODAY ? 'Today · ' : DAY[dow(ad)] + ' · ') + fdy(ad), hisab: pl, ledger: pw ? `${CAT[pw.cat]} · ${pl}` : '', profile: '', report: rp.usesDate ? '' : rp.usesPeriod ? pl : 'As of today', workers: `${s.workers.filter((w) => w.active).length} active`, tx: '' };
    const headAction = sc === 'att' ? { label: 'History', icon: 'ph-clock-counter-clockwise', on: () => this.go('history', { hDate: s.attDate }) } : sc === 'workers' ? { label: 'Add', icon: 'ph-plus', on: () => this.openForm() } : sc === 'hisab' ? { label: 'Pay', icon: 'ph-hand-coins', on: () => this.openTx('payment') } : null;
    // Day editor: one worker, one date, opened from a calendar.
    let dayEdit = null;
    if (s.dayEdit) {
      const dw = this.W(s.dayEdit.wid), dd = s.dayEdit.date;
      if (dw) {
        const cur = (s.att[dd] || {})[s.dayEdit.wid];
        const rate = cur ? cur.rate : rateOn(dw, dd);
        dayEdit = {
          name: dw.name, when: `${DAY[dow(dd)]}, ${fdy(dd)}`, isToday: dd === TODAY, busy: s.dayBusy,
          rateNote: `Day rate ${inr(rate)}`,
          options: ['P', 'H', 'A', 'O'].map((k) => ({
            k, label: ST[k].label, icon: 'ph-' + ST[k].ic, dot: ST[k].dot, sel: !!cur && cur.s === k,
            amt: pay(k, rate) ? inr(pay(k, rate)) : 'No wage', on: () => this.setDayMark(k)
          })),
          canClear: !!cur, clear: () => this.setDayMark(null), close: this.closeDayEdit
        };
      }
    }
    const tt = s.toast;
    return {
      TODAY, START,
      isAuth: !s.user, au: this.authVals(), me, isHistory: sc === 'history', hv: sc === 'history' ? this.hist() : null, screenKey: sc + '-' + (s.wid || ''),
      theme: s.theme, themeIcon: this.mode() === 'dark' ? 'ph-sun' : 'ph-moon', toggleTheme: () => this.saveSettings({ theme: this.mode() === 'dark' ? 'light' : 'dark' }), wide, narrow: !wide, colMax: wide ? 820 : 480, sideNav, bottomNav, legend,
      isHome: sc === 'home', isAtt: sc === 'att', isWorkers: sc === 'workers', isForm: sc === 'form', isProfile: sc === 'profile', isHisab: sc === 'hisab', isLedger: sc === 'ledger', isTx: sc === 'tx', isSites: sc === 'sites', isReports: sc === 'reports', isReport: sc === 'report', isMore: sc === 'more', isSettings: sc === 'settings',
      showPeriod: sc === 'hisab' || sc === 'ledger' || (sc === 'report' && rp.usesPeriod),
      title: titleMap[sc], bigTitle: sc === 'home' ? 'Namaste, ' + me.first + ' 👋' : titleMap[sc], subtitle: subMap[sc] || '', scrolled: s.scrolled, isHomeScreen: sc === 'home',
      canBack: s.stack.length > 0, backLabel: backLabels[prev] || 'Back', back: this.back, headAction,
      todayLong: `${DAY[dow(TODAY)]}, ${fdy(TODAY)}`, onBell: () => this.toast(unm.length ? `${unm.length} workers still need today's attendance` : 'No new notifications'),
      home, homeSiteChips, quick, activity: s.activity.map((a) => ({ t: timeAgo(a.at, TODAY), text: a.text, icon: a.icon })), goAttToday: goAtt,
      att, attDate: s.attDate, onAttDate: (d) => this.setAttDate(d),
      wq: s.wq, onWq: (v) => this.setState({ wq: v }), wd, openAddWorker: () => this.openForm(),
      form: f, ferr: s.ferr, fh, fv, saveWorker: this.saveWorker, pf,
      dayEdit,
      periodChips, isCustom: s.period === 'custom', cFrom: s.cFrom, cTo: s.cTo, onCFrom: (v) => this.setState({ cFrom: v || START }), onCTo: (v) => this.setState({ cTo: v || TODAY }), hs, lg,
      tx: t, txErr: s.txErr, th, tv, submitTx: this.submitTx,
      pinForm: s.pinForm, pinErr: s.pinErr, pinLength: PIN_LEN,
      openPinForm: () => this.openPinForm(), closePinForm: () => this.setState({ pinForm: null, pinErr: {} }),
      ph: { currentPin: (v) => this.setP('currentPin', v), newPin: (v) => this.setP('newPin', v), confirmPin: (v) => this.setP('confirmPin', v) },
      savePin: this.savePin,
      sv, openSiteForm: () => this.setState({ siteForm: { name: '', client: '', address: '', start: TODAY }, siteErr: '' }), siteForm: s.siteForm ? sf : null, sh, siteErr: s.siteErr, closeSiteForm: () => this.setState({ siteForm: null }),
      saveSite: async () => { if ((sf.name || '').trim().length < 2) { this.setState({ siteErr: 'Please enter a site name' }); return; } try { const r = await api.addSite({ name: sf.name.trim(), client: sf.client, address: sf.address, area: sf.address, start: sf.start }); this.setState((x) => ({ sites: [...x.sites, r.site], siteForm: null })); this.toast(`${r.site.name} added`); } catch (e) { this.setState({ siteErr: e.message }); } },
      rv, rp, rDate: s.rDate, onRDate: (v) => this.setState({ rDate: v || TODAY }), moreList, setv,
      backupAll: async () => { try { await shareCsv('Kaamtally-ledger-' + TODAY, [['Date', 'Worker', 'Type', 'Amount', 'Method', 'Note']].concat(s.tx.map((x) => [x.date, (this.W(x.wid) || {}).name || '', x.type, x.amount, x.method, x.note]))); const r = await api.updateMe({ backupNow: true }); this.setState({ user: r.user }); this.toast('Backup exported'); } catch (e) { this.toast(e.message || "Couldn't export", 'err'); } },
      logout: () => this.logoutAsk(),
      dialog: s.dialog, closeDialog: () => this.setState({ dialog: null }), okDialog: () => { const d = s.dialog; this.setState({ dialog: null }); if (d && d.onOk) d.onOk(); },
      toast: tt ? {
        id: tt.id, text: tt.text, action: tt.action || null, kind: tt.kind,
        icon: tt.kind === 'err' ? 'ph-warning-circle' : tt.kind === 'offline' ? 'ph-warning' : 'ph-check-circle',
        fg: tt.kind === 'ok' ? 'var(--color-ok)' : 'var(--color-danger)'
      } : null
    };
  }

  render() {
    const s = this.state;
    return <ThemeProvider mode={this.mode()}><Shell v={s.booting || s.loadErr ? null : this.renderVals()} booting={s.booting} loadErr={s.loadErr} loadOffline={s.loadOffline} retry={() => this.load()} logout={async () => { await session.clear(); this.setState({ loadErr: '', user: null }); }} scrollRef={this.scrollRef} onScroll={this.onScroll} toast={s.toast} /></ThemeProvider>;
  }
}
