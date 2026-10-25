import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Rect, Defs, LinearGradient, Stop, G } from 'react-native-svg';
import { T } from './kit';

// The Kaamtally mark — three tally strokes and a check — from the
// "Kaamtally Logo" design file. Fixed colours so the brand looks the same
// in light and dark mode, and matches the app icon in assets/.
export const BRAND = {
  tileFrom: '#2b2741',
  tileTo: '#121018',
  tally: '#5d5294',
  check: '#b5abfc'
};
const TALLY_D = 'M12 14v36M21 14v36M30 14v26';
const CHECK_D = 'M30 40l9 9 17-33';

// Just the mark, on whatever sits behind it.
export function LogoMark({ size = 28, tally = BRAND.tally, check = BRAND.check }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" accessibilityLabel="Kaamtally">
      <Path d={TALLY_D} stroke={tally} strokeWidth={5.5} strokeLinecap="round" fill="none" />
      <Path d={CHECK_D} fill="none" stroke={check} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// The full logo: the dark gradient tile with the mark, as designed.
export default function Logo({ size = 40, radius }) {
  const r = radius == null ? size * (116 / 512) : radius;
  const m = size * (320 / 512);
  const pad = (size - m) / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} accessibilityLabel="Kaamtally">
      <Defs>
        {/* CSS linear-gradient(150deg, …) mapped onto the square */}
        <LinearGradient id="khTile" x1="0.1585" y1="-0.0916" x2="0.8415" y2="1.0916">
          <Stop offset="0" stopColor={BRAND.tileFrom} />
          <Stop offset="1" stopColor={BRAND.tileTo} />
        </LinearGradient>
      </Defs>
      <Rect x="0" y="0" width={size} height={size} rx={r} ry={r} fill="url(#khTile)" />
      {/* the thin highlight along the top edge */}
      <Rect x={r * 0.5} y="0" width={size - r} height={Math.max(1, size / 256)} rx={size / 512} fill="#ffffff" opacity={0.14} />
      <G transform={`translate(${pad} ${pad}) scale(${m / 64})`}>
        <Path d={TALLY_D} stroke={BRAND.tally} strokeWidth={5.5} strokeLinecap="round" fill="none" />
        <Path d={CHECK_D} fill="none" stroke={BRAND.check} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" />
      </G>
    </Svg>
  );
}

// Logo + wordmark, used in the app header and the sidebar.
export function LogoLockup({ size = 30, fontSize = 18, gap = 9 }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap }}>
      <Logo size={size} />
      <T w={600} style={{ fontSize, letterSpacing: -0.3 }}>Kaamtally</T>
    </View>
  );
}
