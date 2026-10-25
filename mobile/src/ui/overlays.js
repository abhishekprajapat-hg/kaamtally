import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, Modal, Platform, Pressable, ScrollView, StyleSheet, View, useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from './theme-context';
import { T, Press, Divider } from './kit';
import Icon from './Icon';
import { fdy, d2s } from '../lib/date';
import { fade } from '../theme';

// Bottom sheet used by every confirmation dialog (kh-up .45s; scrim fades in).
export function Sheet({ visible, onClose, children, wide, bg, pad = 20 }) {
  const { c, mode } = useTheme();
  const ins = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const y = useRef(new Animated.Value(height)).current;
  const o = useRef(new Animated.Value(0)).current;
  const [shown, setShown] = useState(visible);
  useEffect(() => {
    if (visible) {
      setShown(true);
      y.setValue(wide ? 40 : height); o.setValue(0);
      Animated.parallel([
        Animated.timing(o, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(y, { toValue: 0, duration: 450, easing: Easing.bezier(0.2, 0.9, 0.25, 1), useNativeDriver: true })
      ]).start();
    } else if (shown) {
      Animated.parallel([
        Animated.timing(o, { toValue: 0, duration: 200, useNativeDriver: true }),
        Animated.timing(y, { toValue: wide ? 40 : height * 0.6, duration: 220, useNativeDriver: true })
      ]).start(() => setShown(false));
    }
  }, [visible]);
  if (!shown) return null;
  const radius = wide ? { borderRadius: 20 } : { borderTopLeftRadius: 22, borderTopRightRadius: 22 };
  return (
    <Modal transparent visible statusBarTranslucent navigationBarTranslucent animationType="none" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: wide ? 'center' : 'flex-end', alignItems: 'center', padding: wide ? 16 : 0 }}>
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: o }]}>
          <BlurView intensity={8} tint={mode} style={StyleSheet.absoluteFill} />
          <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: c('var(--scrim)') }]} onPress={onClose} accessibilityLabel="Close" />
        </Animated.View>
        <Animated.View style={[{ width: '100%', maxWidth: 460, transform: [{ translateY: y }], boxShadow: c('var(--shadow-lg)') }, radius]}>
          <View style={[{ overflow: 'hidden' }, radius]}>
            {bg ? <View style={[StyleSheet.absoluteFill, { backgroundColor: c(bg) }]} /> : <BlurView intensity={60} tint={mode === 'dark' ? 'systemThickMaterialDark' : 'systemThickMaterialLight'} style={StyleSheet.absoluteFill} />}
            {!bg ? <View style={[StyleSheet.absoluteFill, { backgroundColor: c('var(--color-surface)') }]} /> : null}
            <View style={{ paddingTop: 10, paddingHorizontal: pad, paddingBottom: 24 + (wide ? 0 : ins.bottom), gap: 14 }}>
              <View style={{ width: 40, height: 5, borderRadius: 3, backgroundColor: c('var(--color-neutral-700)'), alignSelf: 'center' }} />
              {children}
            </View>
            <View pointerEvents="none" style={[StyleSheet.absoluteFill, radius, { boxShadow: `inset 0 1px 0 ${c('var(--glass-hi)')}, inset 0 0 0 1px ${c('var(--glass-edge)')}` }]} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// Confirmation dialog content (icon, title, body, optional summary lines, OK/Cancel)
export function DialogBody({ dialog: d0, onOk, onCancel }) {
  const { c } = useTheme();
  const last = useRef(d0);
  if (d0) last.current = d0;
  const dialog = d0 || last.current; // keep content while the sheet animates out
  if (!dialog) return null;
  return (
    <>
      <View style={{ alignItems: 'center', gap: 8, paddingTop: 4 }}>
        <View style={{ width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', backgroundColor: c('var(--color-accent-900)') }}>
          <Icon name={dialog.icon} fill size={26} color="var(--color-accent-300)" />
        </View>
        <T w={500} style={{ fontSize: 20, textAlign: 'center' }}>{dialog.title}</T>
        <T style={{ fontSize: 16, lineHeight: 23, color: 'var(--color-neutral-300)', textAlign: 'center' }}>{dialog.body}</T>
      </View>
      {dialog.lines ? (
        <View style={{ borderRadius: 14, backgroundColor: c('var(--color-bg)'), paddingVertical: 2, paddingHorizontal: 14 }}>
          {dialog.lines.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c('var(--color-neutral-800)') }}>
              <T style={{ flex: 1, fontSize: 16, color: 'var(--color-neutral-400)' }}>{f.k}</T>
              <T w={500} style={{ fontSize: 16 }}>{f.v}</T>
            </View>
          ))}
        </View>
      ) : null}
      <View style={{ gap: 8 }}>
        <Press onPress={onOk} style={{ minHeight: 54, borderRadius: 14, borderWidth: 1, borderColor: c('var(--color-accent)'), backgroundColor: c('var(--color-accent-800)'), alignItems: 'center', justifyContent: 'center' }}>
          <T w={500} style={{ fontSize: 17, color: 'var(--color-accent-100)' }}>{dialog.ok}</T>
        </Press>
        <Press onPress={onCancel} style={{ minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
          <T style={{ fontSize: 17, color: 'var(--color-accent-300)' }}>{dialog.cancel}</T>
        </Press>
      </View>
    </>
  );
}

// Toast that drops from the top (kh-drop .55s)
export function Toast({ toast }) {
  const { c, mode } = useTheme();
  const ins = useSafeAreaInsets();
  const y = useRef(new Animated.Value(-160)).current;
  const [cur, setCur] = useState(toast);
  useEffect(() => {
    if (toast) {
      setCur(toast);
      y.setValue(-160);
      Animated.spring(y, { toValue: 0, useNativeDriver: true, speed: 14, bounciness: 8 }).start();
    } else if (cur) {
      Animated.timing(y, { toValue: -160, duration: 220, useNativeDriver: true }).start(() => setCur(null));
    }
  }, [toast && toast.id]);
  if (!cur) return null;
  return (
    <Animated.View pointerEvents="box-none" style={{ position: 'absolute', top: ins.top + 14, left: 0, right: 0, alignItems: 'center', zIndex: 60, transform: [{ translateY: y }] }}>
      <View accessibilityRole="alert" style={{ width: '94%', maxWidth: 440, borderRadius: 18, overflow: 'hidden', boxShadow: c('var(--shadow-lg)') }}>
        <BlurView intensity={40} tint={mode} style={StyleSheet.absoluteFill} />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: fade(c('var(--color-surface)'), 92) }}>
          <Icon name={cur.icon} fill size={24} color={cur.fg} />
          <T style={{ flex: 1, fontSize: 15 }}>{cur.text}</T>
          {cur.action ? (
            <Press onPress={cur.action.on} style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: 10, backgroundColor: c('var(--color-accent-800)'), justifyContent: 'center' }}>
              <T style={{ fontSize: 15, color: 'var(--color-accent-100)' }}>{cur.action.label}</T>
            </Press>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
}

// Date field — the design's grey date chip. Opens the native picker.
export function DateField({ value, onChange, min, max, style, textStyle, label }) {
  const { c, mode } = useTheme();
  const [open, setOpen] = useState(false);
  const chip = [{ backgroundColor: c('var(--color-neutral-800)'), borderRadius: 8, paddingVertical: 6, paddingHorizontal: 10 }, style];
  if (Platform.OS === 'web') {
    return React.createElement('input', {
      type: 'date', value: value || '', min, max, 'aria-label': label,
      onChange: (e) => e.target.value && onChange(e.target.value),
      style: { border: 'none', background: c(StyleSheet.flatten(style)?.backgroundColor || 'var(--color-neutral-800)'), borderRadius: StyleSheet.flatten(style)?.borderRadius ?? 8, padding: '6px 10px', color: c('var(--color-text)'), fontFamily: 'Inter_400Regular', fontSize: 15, colorScheme: mode, minHeight: StyleSheet.flatten(style)?.minHeight }
    });
  }
  const pick = (e, d) => {
    if (Platform.OS === 'android') setOpen(false);
    if (e.type === 'set' && d) { const s = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); onChange(s); }
  };
  const toLocal = (s) => { const [y, m, dd] = s.split('-').map(Number); return new Date(y, m - 1, dd); };
  return (
    <>
      <Press onPress={() => setOpen(true)} style={chip} accessibilityLabel={label}>
        <T style={[{ fontSize: 15 }, textStyle]}>{value ? fdy(value) : 'Choose'}</T>
      </Press>
      {open && Platform.OS === 'android' ? (
        <DateTimePicker value={toLocal(value || d2s(new Date()))} mode="date" minimumDate={min ? toLocal(min) : undefined} maximumDate={max ? toLocal(max) : undefined} onChange={pick} />
      ) : null}
      {Platform.OS === 'ios' ? (
        <Sheet visible={open} onClose={() => setOpen(false)}>
          <DateTimePicker value={toLocal(value || d2s(new Date()))} mode="date" display="inline" themeVariant={mode} accentColor={c('var(--color-accent)')}
            minimumDate={min ? toLocal(min) : undefined} maximumDate={max ? toLocal(max) : undefined} onChange={(e, d) => { pick(e, d); }} />
          <Press onPress={() => setOpen(false)} style={{ minHeight: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c('var(--color-accent-800)') }}>
            <T w={500} style={{ color: 'var(--color-accent-100)' }}>Done</T>
          </Press>
        </Sheet>
      ) : null}
    </>
  );
}

// Select field — right-aligned value like the design's <select>; opens a list sheet.
export function SelectField({ value, options, onChange, placeholder = 'Choose…', title, style, wide }) {
  const { c } = useTheme();
  const [open, setOpen] = useState(false);
  const cur = options.find((o) => o.id === value);
  return (
    <>
      <Press onPress={() => setOpen(true)} scale={0.98} style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }, style]} accessibilityLabel={title}>
        <T numberOfLines={1} style={{ fontSize: 16, color: 'var(--color-neutral-300)', textAlign: 'right', flexShrink: 1 }}>{cur ? cur.name : placeholder}</T>
        <Icon name="caret-down" size={14} color="var(--color-neutral-400)" />
      </Press>
      <Sheet visible={open} onClose={() => setOpen(false)} wide={wide}>
        <T w={500} style={{ fontSize: 17, textAlign: 'center' }}>{title}</T>
        <ScrollView style={{ maxHeight: 420 }}>
          <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: c('var(--color-neutral-900)') }}>
            {options.map((o, i) => (
              <Press key={o.id || 'none'} scale={0.98} onPress={() => { onChange(o.id); setOpen(false); }} style={{ flexDirection: 'row', alignItems: 'center', minHeight: 52, paddingHorizontal: 16, borderBottomWidth: i < options.length - 1 ? 1 : 0, borderBottomColor: c('var(--color-neutral-800)') }}>
                <T style={{ flex: 1, fontSize: 16 }}>{o.name}</T>
                {o.id === value ? <Icon name="check" size={18} color="var(--color-accent)" /> : null}
              </Press>
            ))}
          </View>
        </ScrollView>
      </Sheet>
    </>
  );
}
