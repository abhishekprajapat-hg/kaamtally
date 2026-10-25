// The Kaamtally mark, copied from the design file "Kaamtally Logo.dc.html".
const TILE_FROM = '#2b2741', TILE_TO = '#121018';
const TALLY = '#5d5294', CHECK = '#b5abfc';
const MARK = `<svg viewBox="0 0 64 64" width="MARKPX" height="MARKPX" aria-label="Kaamtally">
  <path d="M12 14v36M21 14v36M30 14v26" stroke="${TALLY}" stroke-width="5.5" stroke-linecap="round" fill="none"></path>
  <path d="M30 40l9 9 17-33" fill="none" stroke="${CHECK}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"></path>
</svg>`;

// `radius: 0` gives the full-bleed square iOS masks itself.
const tile = ({ size = 1024, radiusPct = 116 / 512, markPct = 320 / 512, bare = false }) => {
  const radius = bare ? 0 : Math.round(size * radiusPct);
  const mark = MARK.replace(/MARKPX/g, Math.round(size * markPct));
  return `<div style="width:${size}px;height:${size}px;border-radius:${radius}px;
    background:linear-gradient(150deg,${TILE_FROM},${TILE_TO});
    box-shadow:inset 0 ${Math.max(2, Math.round(size / 256))}px 0 rgba(255,255,255,.14);
    display:grid;place-items:center">${mark}</div>`;
};
// Mark on its own, for the Android adaptive foreground.
const markOnly = ({ size = 1024, markPct = 0.56, mono = false }) => {
  let m = MARK.replace(/MARKPX/g, Math.round(size * markPct));
  if (mono) m = m.replace(new RegExp(TALLY, 'g'), '#ffffff').replace(new RegExp(CHECK, 'g'), '#ffffff');
  return `<div style="width:${size}px;height:${size}px;display:grid;place-items:center">${m}</div>`;
};
module.exports = { tile, markOnly, TILE_FROM, TILE_TO, TALLY, CHECK, MARK };
