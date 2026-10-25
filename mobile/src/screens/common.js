import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../ui/theme-context';
import { T, Press, Glass, Grid } from '../ui/kit';
import Icon from '../ui/Icon';

// Small stat tiles (n + label)
export function Stats({ items, cols, nSize = 19, lSize = 12, ellipsis }) {
  return (
    <Grid cols={cols || items.length} gap={8}>
      {items.map((k, i) => (
        <Glass key={i} radius={14} style={{ paddingVertical: 10, paddingHorizontal: 12, gap: 2 }}>
          <T w={500} numberOfLines={ellipsis ? 1 : undefined} style={{ fontSize: nSize }}>{String(k.n)}</T>
          <T style={{ fontSize: lSize, color: 'var(--color-neutral-400)' }}>{k.label}</T>
        </Glass>
      ))}
    </Grid>
  );
}

// Round calendar/history cell; border strings like "1.5px dashed var(--…)" are parsed.
export function cellBorder(border, c) {
  if (!border || border === 'none') return {};
  const m = border.match(/([\d.]+)px\s+(solid|dashed)\s+(.+)/);
  if (!m) return {};
  return { borderWidth: parseFloat(m[1]), borderStyle: m[2], borderColor: c(m[3]) };
}

export function Calendar({ heads, cells, round, minH = 42, nSize = 15, lSize = 10, gap = 5 }) {
  const { c } = useTheme();
  return (
    <>
      <View style={{ flexDirection: 'row', gap, marginBottom: 8 }}>
        {heads.map((h, i) => <T key={i} style={{ flex: 1, textAlign: 'center', fontSize: 12, color: 'var(--color-neutral-400)' }}>{h}</T>)}
      </View>
      <Grid cols={7} gap={gap}>
        {cells.map((x, i) => (
          <Press key={i} onPress={x.on || undefined} disabled={!x.on} accessibilityLabel={x.aria}
            style={[{ aspectRatio: 1, minHeight: minH, borderRadius: round ? 999 : 12, alignItems: 'center', justifyContent: 'center', gap: round ? 0 : 3, backgroundColor: c(x.bg), opacity: x.op }, cellBorder(x.border, c)]}>
            {x.n !== '' ? <T w={500} style={{ fontSize: nSize, lineHeight: nSize + 1, color: x.fg === 'inherit' ? undefined : x.fg }}>{String(x.n)}</T> : null}
            {x.lbl ? <T style={{ fontSize: lSize, lineHeight: lSize + 2, color: x.fg === 'inherit' ? undefined : x.fg }}>{x.lbl}</T> : null}
          </Press>
        ))}
      </Grid>
    </>
  );
}

export function Legend({ items, extra, size = 12 }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap' }}>
      {items.map((k) => <View key={k.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Icon name={k.icon} fill size={size} color={k.dot} /><T style={{ fontSize: size, color: 'var(--color-neutral-400)' }}>{k.label}</T></View>)}
      {extra ? <T style={{ fontSize: size, color: 'var(--color-neutral-400)' }}>{extra}</T> : null}
    </View>
  );
}

// List row inside a glass group: leading element + content with bottom hairline
export function ListRow({ onPress, lead, children, last, padL = 16, gap = 12, padV = 12, padR = 14 }) {
  const { c } = useTheme();
  const body = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap, paddingLeft: padL }}>
      {lead}
      <View style={{ flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: padV, paddingRight: padR, borderBottomWidth: last ? 0 : 1, borderBottomColor: c('var(--color-neutral-800)') }}>{children}</View>
    </View>
  );
  return onPress ? <Press onPress={onPress} scale={0.98} activeOpacity={0.7}>{body}</Press> : body;
}

export function KV({ k, v, last, size = 16, weight, kColor = 'var(--color-neutral-300)', padV = 11, border = 'var(--color-neutral-800)' }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', paddingVertical: padV, borderBottomWidth: last ? 0 : 1, borderBottomColor: c(border) }}>
      <T style={{ flex: 1, fontSize: size, color: kColor }}>{k}</T>
      <T w={weight} style={{ fontSize: size }}>{v}</T>
    </View>
  );
}
