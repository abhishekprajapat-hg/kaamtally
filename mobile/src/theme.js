// Design tokens from the Kaamtally design (Nocturne design system + the app's light/dark themes).
const BASE = {
  '--color-bg': '#161826', '--color-surface': '#232532', '--color-text': '#e9e9ed', '--color-accent': '#9184d9',
  '--color-divider': 'rgba(233,233,237,.16)',
  '--color-neutral-100': '#f3f5fe', '--color-neutral-200': '#e4e7f5', '--color-neutral-300': '#cfd3e5', '--color-neutral-400': '#b2b6ca', '--color-neutral-500': '#9397ab', '--color-neutral-600': '#75798c', '--color-neutral-700': '#595d6c', '--color-neutral-800': '#3f424d', '--color-neutral-900': '#292b31',
  '--color-accent-100': '#f5f4ff', '--color-accent-200': '#e7e5fe', '--color-accent-300': '#d2cefd', '--color-accent-400': '#b5abfc', '--color-accent-500': '#968ae0', '--color-accent-600': '#796cbf', '--color-accent-700': '#5d5294', '--color-accent-800': '#423a6a', '--color-accent-900': '#2b2741',
  '--shadow-sm': '0 0 0 1px #3f424d', '--shadow-md': '0 0 0 1px #595d6c, 0 6px 18px rgba(0,0,0,0.55)', '--shadow-lg': '0 0 0 1px #9397ab, 0 16px 40px rgba(0,0,0,0.65)'
};
const ACC_D = { '--color-accent': '#9184d9', '--color-accent-100': '#f5f4ff', '--color-accent-200': '#e7e5fe', '--color-accent-300': '#d2cefd', '--color-accent-400': '#b5abfc', '--color-accent-500': '#968ae0', '--color-accent-600': '#796cbf', '--color-accent-700': '#5d5294', '--color-accent-800': '#423a6a', '--color-accent-900': '#2b2741' };
export const THEMES = {
  dark: { ...BASE, '--color-bg': '#000000', '--color-surface': 'rgba(44,44,52,.38)', '--glass-sheen': 'rgba(255,255,255,.07)', '--glass-hi': 'rgba(255,255,255,.16)', '--glass-edge': 'rgba(255,255,255,.09)', '--glass-drop': '0 10px 30px rgba(0,0,0,.35)', '--orb-4': 'rgba(30,170,160,.38)', '--color-text': '#f2f2f7', '--color-divider': 'rgba(255,255,255,.1)', '--color-neutral-100': '#f2f2f7', '--color-neutral-200': '#e2e2e8', '--color-neutral-300': '#c7c7cf', '--color-neutral-400': '#9b9ba5', '--color-neutral-500': '#7c7c86', '--color-neutral-600': '#5c5c64', '--color-neutral-700': '#3e3e44', '--color-neutral-800': 'rgba(255,255,255,.09)', '--color-neutral-900': 'rgba(255,255,255,.05)', '--seg-track': 'rgba(118,118,128,.24)', '--seg-on': 'rgba(99,99,106,.92)', '--knob': '#ffffff', '--scrim': 'rgba(0,0,0,.55)', '--orb-1': 'rgba(130,105,255,.75)', '--orb-2': 'rgba(30,120,255,.55)', '--orb-3': 'rgba(200,80,230,.55)', '--shadow-sm': '0 1px 2px rgba(0,0,0,.5)', '--shadow-md': '0 6px 20px rgba(0,0,0,.5)', '--shadow-lg': '0 18px 50px rgba(0,0,0,.6)', ...ACC_D },
  light: { ...BASE, '--color-bg': '#f2f2f7', '--color-surface': 'rgba(255,255,255,.42)', '--glass-sheen': 'rgba(255,255,255,.55)', '--glass-hi': 'rgba(255,255,255,.95)', '--glass-edge': 'rgba(255,255,255,.55)', '--glass-drop': '0 10px 30px rgba(70,60,140,.12)', '--orb-4': 'rgba(90,220,200,.45)', '--color-text': '#16171d', '--color-divider': 'rgba(60,60,67,.14)', '--color-neutral-100': '#16171d', '--color-neutral-200': '#2a2c35', '--color-neutral-300': '#474a56', '--color-neutral-400': '#6b6e7b', '--color-neutral-500': '#8a8d99', '--color-neutral-600': '#aeb0ba', '--color-neutral-700': '#d4d5dc', '--color-neutral-800': 'rgba(60,60,67,.12)', '--color-neutral-900': 'rgba(60,60,67,.06)', '--color-accent': '#6656c9', '--color-accent-100': '#241c5c', '--color-accent-200': '#33297f', '--color-accent-300': '#4a3eaa', '--color-accent-400': '#5d50c2', '--color-accent-500': '#7466d6', '--color-accent-600': '#9a8fe6', '--color-accent-700': '#c9c2f6', '--color-accent-800': '#e0dbfb', '--color-accent-900': '#eeebfd', '--seg-track': 'rgba(118,118,128,.12)', '--seg-on': '#ffffff', '--knob': '#ffffff', '--scrim': 'rgba(0,0,0,.3)', '--orb-1': 'rgba(140,120,255,.65)', '--orb-2': 'rgba(70,170,255,.55)', '--orb-3': 'rgba(255,130,190,.5)', '--shadow-sm': '0 1px 3px rgba(20,20,40,.08)', '--shadow-md': '0 6px 20px rgba(20,20,40,.08)', '--shadow-lg': '0 18px 50px rgba(20,20,40,.16)' }
};

// --- colour helpers -------------------------------------------------------
export function parseColor(c) {
  if (!c) return [0, 0, 0, 0];
  c = c.trim();
  if (c === 'transparent') return [0, 0, 0, 0];
  if (c[0] === '#') {
    let h = c.slice(1); if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), h.length === 8 ? parseInt(h.slice(6, 8), 16) / 255 : 1];
  }
  const m = c.match(/rgba?\(([^)]+)\)/);
  if (m) { const p = m[1].split(',').map((x) => parseFloat(x)); return [p[0], p[1], p[2], p[3] == null ? 1 : p[3]]; }
  return [0, 0, 0, 1];
}
const rgba = ([r, g, b, a]) => `rgba(${Math.round(r)},${Math.round(g)},${Math.round(b)},${+a.toFixed(3)})`;
// color-mix(in srgb, X p%, transparent)
export const fade = (c, p) => { const x = parseColor(c); return rgba([x[0], x[1], x[2], x[3] * p / 100]); };
// color-mix(in srgb, A p%, B)
export const mix = (a, p, b) => {
  const x = parseColor(a), y = parseColor(b), t = p / 100;
  const al = x[3] * t + y[3] * (1 - t);
  if (!al) return 'transparent';
  const ch = (i) => (x[i] * x[3] * t + y[i] * y[3] * (1 - t)) / al;
  return rgba([ch(0), ch(1), ch(2), al]);
};

// Resolve 'var(--token)' references (the design logic speaks in tokens).
export function makeResolver(tokens) {
  const r = (v) => {
    if (typeof v !== 'string' || v.indexOf('var(') < 0) return v;
    return v.replace(/var\((--[a-z0-9-]+)\)/g, (_, k) => (tokens[k] != null ? r(tokens[k]) : 'transparent'));
  };
  return r;
}

// --- shared status + segmented styles from the design ---------------------
export const ST = {
  P: { short: 'P', label: 'Present', ic: 'check-circle', bg: 'var(--color-accent-700)', fg: 'var(--color-accent-100)', dot: 'var(--color-accent-400)' },
  H: { short: '½', label: 'Half Day', ic: 'circle-half', bg: 'var(--color-accent-900)', fg: 'var(--color-accent-200)', dot: 'var(--color-accent-600)' },
  A: { short: 'A', label: 'Absent', ic: 'x-circle', bg: 'var(--color-neutral-700)', fg: 'var(--color-neutral-100)', dot: 'var(--color-neutral-400)' },
  O: { short: 'O', label: 'Off', ic: 'moon', bg: 'var(--color-neutral-800)', fg: 'var(--color-neutral-300)', dot: 'var(--color-neutral-600)' },
  N: { short: '', label: 'Not marked', ic: 'circle-dashed', bg: 'transparent', fg: 'var(--color-neutral-400)', dot: 'var(--color-neutral-600)' }
};
export const seg = (on) => on ? { bg: 'var(--seg-on)', fg: 'var(--color-text)', sh: '0 2px 8px rgba(0,0,0,.35)' } : { bg: 'transparent', fg: 'var(--color-neutral-400)', sh: 'none' };
export const pill = (on) => on ? { bg: 'var(--color-accent-800)', fg: 'var(--color-accent-100)' } : { bg: 'var(--color-surface)', fg: 'var(--color-neutral-300)' };
export const sw = (on) => ({ on, bg: on ? 'var(--color-accent-500)' : 'var(--color-neutral-700)', x: on ? 22 : 2 });
