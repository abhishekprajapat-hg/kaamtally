import React, { useRef, useState, useEffect } from 'react';
import { Text, View, Pressable, Animated, StyleSheet, TextInput, Platform, Easing } from 'react-native';
import { useTheme } from './theme-context';
import { focusRegistry } from './keyboard';
import Icon from './Icon';

const FAM = { 400: 'Inter_400Regular', 500: 'Inter_500Medium', 600: 'Inter_600SemiBold', 700: 'Inter_700Bold' };
export const font = (w = 400) => ({ fontFamily: FAM[w] || FAM[400] });

// Text with Inter + the design's -0.01em tracking.
export function T({ style, children, w, ...rest }) {
  const { c } = useTheme();
  const st = StyleSheet.flatten(style) || {};
  const size = st.fontSize || 17;
  const weight = w || (st.fontWeight ? parseInt(st.fontWeight, 10) : 400);
  const { fontWeight, ...clean } = st;
  return (
    <Text {...rest} style={[{ color: c('var(--color-text)'), fontSize: size, letterSpacing: -0.01 * size }, font(weight), clean, clean.color ? { color: c(clean.color) } : null]}>
      {children}
    </Text>
  );
}

// Button with the design's springy press (transform: scale(.94)).
export function Press({ onPress, style, children, disabled, scale = 0.94, activeOpacity, accessibilityLabel, accessibilityRole = 'button', accessibilityState, hitSlop }) {
  const a = useRef(new Animated.Value(1)).current;
  const o = useRef(new Animated.Value(1)).current;
  const to = (v) => {
    Animated.spring(a, { toValue: v, useNativeDriver: true, speed: 40, bounciness: v === 1 ? 10 : 0 }).start();
    if (activeOpacity) Animated.timing(o, { toValue: v === 1 ? 1 : activeOpacity, duration: 120, useNativeDriver: true }).start();
  };
  const flat = StyleSheet.flatten(style) || {};
  const { flex, width, alignSelf, margin, marginTop, marginLeft, marginRight, marginBottom, marginHorizontal, marginVertical, flexBasis, flexGrow, flexShrink, ...inner } = flat;
  const outer = { flex, width, alignSelf, margin, marginTop, marginLeft, marginRight, marginBottom, marginHorizontal, marginVertical, flexBasis, flexGrow, flexShrink };
  Object.keys(outer).forEach((k) => outer[k] === undefined && delete outer[k]);
  if (inner.width === undefined && width !== undefined) inner.width = '100%';
  return (
    <Pressable onPress={disabled ? undefined : onPress} onPressIn={() => to(scale)} onPressOut={() => to(1)} disabled={disabled}
      accessibilityLabel={accessibilityLabel} accessibilityRole={accessibilityRole} accessibilityState={accessibilityState} hitSlop={hitSlop} style={outer}>
      <Animated.View style={[inner, { transform: [{ scale: a }], opacity: o }]}>{children}</Animated.View>
    </Pressable>
  );
}

// Card surface: translucent fill + inner highlight + soft drop.
export function Glass({ style, children, radius = 16, shadow }) {
  const { c } = useTheme();
  const st = StyleSheet.flatten(style) || {};
  const r = st.borderRadius != null ? st.borderRadius : radius;
  const drop = shadow === undefined ? c('var(--glass-drop)') : shadow ? c(shadow) : undefined;
  const { padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, paddingLeft, paddingRight, gap, flexDirection, alignItems, justifyContent, rowGap, columnGap, flexWrap, ...outer } = st;
  const inner = { padding, paddingHorizontal, paddingVertical, paddingTop, paddingBottom, paddingLeft, paddingRight, gap, flexDirection, alignItems, justifyContent, rowGap, columnGap, flexWrap };
  Object.keys(inner).forEach((k) => inner[k] === undefined && delete inner[k]);
  return (
    <View style={[{ borderRadius: r, boxShadow: drop }, outer, { backgroundColor: 'transparent' }]}>
      <View style={[{ borderRadius: r, overflow: 'hidden', backgroundColor: c(st.backgroundColor || 'var(--color-surface)'), flexGrow: 1 }]}>
        <View style={[{ flexGrow: 1 }, inner]}>{children}</View>
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: r, boxShadow: `inset 0 1px 0 ${c('var(--glass-hi)')}, inset 0 0 0 1px ${c('var(--glass-edge)')}` }]} />
      </View>
    </View>
  );
}

// CSS-grid-like layout: equal columns, children may set `span`.
export function Grid({ cols, gap = 8, style, children, rowGap }) {
  const [w, setW] = useState(0);
  const items = React.Children.toArray(children).filter(Boolean);
  const cw = w ? (w - gap * (cols - 1)) / cols : 0;
  return (
    <View style={[{ flexDirection: 'row', flexWrap: 'wrap', columnGap: gap, rowGap: rowGap == null ? gap : rowGap }, style]} onLayout={(e) => setW(e.nativeEvent.layout.width - (StyleSheet.flatten(style)?.padding || 0) * 2)}>
      {w ? items.map((ch, i) => {
        const span = Math.min(ch.props.span || 1, cols);
        return <View key={ch.key || i} style={{ width: cw * span + gap * (span - 1) }}>{ch}</View>;
      }) : null}
    </View>
  );
}

// Segmented control track (var(--seg-track)) with equal options.
export function Seg({ items, height = 40, fontSize = 14, style, radius = 12, inner = 9, pad = 3, gap = 2 }) {
  const { c } = useTheme();
  return (
    <View style={[{ flexDirection: 'row', padding: pad, gap, borderRadius: radius, backgroundColor: c('var(--seg-track)') }, style]}>
      {items.map((it, i) => (
        <Press key={i} onPress={it.on} style={{ flex: 1, minHeight: height, borderRadius: inner, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, backgroundColor: c(it.bg), boxShadow: it.sh && it.sh !== 'none' ? it.sh : undefined }} accessibilityState={{ selected: it.bg !== 'transparent' }}>
          <T numberOfLines={1} style={{ fontSize, color: it.fg }}>{it.label}</T>
        </Press>
      ))}
    </View>
  );
}

// iOS-style switch from the design.
export function Switch({ on, bg, onToggle, label }) {
  const { c } = useTheme();
  const x = useRef(new Animated.Value(on ? 22 : 2)).current;
  useEffect(() => { Animated.spring(x, { toValue: on ? 22 : 2, useNativeDriver: false, speed: 18, bounciness: 9 }).start(); }, [on]);
  return (
    <Pressable onPress={onToggle} accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label}
      style={{ width: 51, height: 31, borderRadius: 16, backgroundColor: c(bg) }}>
      <Animated.View style={{ position: 'absolute', top: 2, left: x, width: 27, height: 27, borderRadius: 14, backgroundColor: c('var(--knob)'), boxShadow: '0 2px 6px rgba(0,0,0,.3)' }} />
    </Pressable>
  );
}

// Avatar circle with initials.
export function Avatar({ size, ini, bg, fg, fontSize, ring }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center', backgroundColor: c(bg), boxShadow: ring ? `0 0 0 2px ${c(ring)}` : undefined }}>
      <T w={600} style={{ fontSize, color: fg }}>{ini}</T>
    </View>
  );
}

export function IconTile({ icon, size = 32, radius = 9, iconSize = 17, bg = 'var(--color-accent-900)', fg = 'var(--color-accent-300)' }) {
  const { c } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: radius, alignItems: 'center', justifyContent: 'center', backgroundColor: c(bg) }}>
      <Icon name={icon} fill size={iconSize} color={fg} />
    </View>
  );
}

// Section caption ("DETAILS", "TYPE OF WORK"…)
export function Caption({ children }) {
  return <T style={{ fontSize: 13, letterSpacing: 0.52, textTransform: 'uppercase', color: 'var(--color-neutral-400)', paddingHorizontal: 16 }}>{children}</T>;
}

export function Divider({ inset = 0 }) {
  const { c } = useTheme();
  return <View style={{ height: 1, backgroundColor: c('var(--color-neutral-800)'), marginLeft: inset }} />;
}

export function ErrorLine({ text, pad = 16, color = 'var(--color-accent-300)' }) {
  if (!text) return null;
  return (
    <View style={{ flexDirection: 'row', gap: 6, paddingHorizontal: pad, alignItems: 'flex-start' }}>
      <Icon name="warning-circle" fill size={16} color={color} style={{ marginTop: 2 }} />
      <T style={{ fontSize: 14, color, flex: 1 }}>{text}</T>
    </View>
  );
}

// Primary / secondary buttons (.btn .btn-primary/.btn-secondary)
export function Btn({ kind = 'primary', icon, iconSize = 18, label, onPress, style, fontSize = 17, height = 54, radius = 14, bg, fg, w = 500, iconRight }) {
  const { c } = useTheme();
  const primary = kind === 'primary';
  const color = fg || (primary ? 'var(--color-accent)' : 'var(--color-text)');
  return (
    <Press onPress={onPress} style={[{ minHeight: height, borderRadius: radius, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: primary ? c('var(--color-accent)') : c('var(--color-divider)'), backgroundColor: c(bg || (primary ? 'var(--color-accent-900)' : 'transparent')) }, style]}>
      {icon && !iconRight ? <Icon name={icon} size={iconSize} color={color} /> : null}
      <T w={w} numberOfLines={1} style={{ fontSize, color }}>{label}</T>
      {icon && iconRight ? <Icon name={icon} size={iconSize} color={color} /> : null}
    </Press>
  );
}

// Plain borderless text input styled like the design
export function Input({ style, onFocus, onBlur, ...rest }) {
  const { c, mode } = useTheme();
  const ref = useRef(null);
  const st = StyleSheet.flatten(style) || {};
  const weight = st.fontWeight ? parseInt(st.fontWeight, 10) : 400;
  const { fontWeight, ...clean } = st;
  return (
    <TextInput ref={ref} placeholderTextColor={c('var(--color-neutral-500)')} selectionColor={c('var(--color-accent)')} cursorColor={c('var(--color-accent)')}
      keyboardAppearance={mode} underlineColorAndroid="transparent"
      // Tell the screen which field is focused so it can lift it above the keyboard.
      onFocus={(e) => { focusRegistry.set(ref.current); if (onFocus) onFocus(e); }}
      onBlur={(e) => { focusRegistry.clear(ref.current); if (onBlur) onBlur(e); }}
      {...rest}
      style={[{ color: c('var(--color-text)'), fontSize: 17, padding: 0, letterSpacing: -0.01 * (clean.fontSize || 17) }, font(weight), Platform.OS === 'web' ? { outlineStyle: 'none' } : null, clean, clean.color ? { color: c(clean.color) } : null]} />
  );
}

// Enter-animation used when the screen changes (kh-in .38s)
export function FadeIn({ children, style, keyId, duration = 380, dy = 12 }) {
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => { a.setValue(0); Animated.timing(a, { toValue: 1, duration, easing: Easing.bezier(0.2, 0.8, 0.2, 1), useNativeDriver: true }).start(); }, [keyId]);
  return <Animated.View style={[style, { opacity: a, transform: [{ translateY: a.interpolate({ inputRange: [0, 1], outputRange: [dy, 0] }) }] }]}>{children}</Animated.View>;
}

// kh-pop for the selected icon
export function Pop({ active, children }) {
  const a = useRef(new Animated.Value(1)).current;
  const first = useRef(true);
  useEffect(() => {
    if (first.current) { first.current = false; return; }
    if (!active) return;
    a.setValue(0.5);
    Animated.sequence([
      Animated.timing(a, { toValue: 1.2, duration: 250, easing: Easing.bezier(0.34, 1.56, 0.64, 1), useNativeDriver: true }),
      Animated.timing(a, { toValue: 1, duration: 170, useNativeDriver: true })
    ]).start();
  }, [active]);
  return <Animated.View style={{ transform: [{ scale: a }] }}>{children}</Animated.View>;
}
