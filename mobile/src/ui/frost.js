// Frosted panels (nav bar, header, sheets, toast).
//
// On Android the system blur samples the window background instead of the app's
// own content, so in dark mode every frosted panel came out light grey. Rather
// than fight it, Android paints the panel: the app background, then the same
// translucent surface colour on top. The result matches the design and costs
// nothing to render. iOS and web keep the real blur.
import React from 'react';
import { Platform, View, StyleSheet } from 'react-native';
import { BlurView, BlurTargetView } from 'expo-blur';
import { useTheme } from './theme-context';

const ANDROID = Platform.OS === 'android';

// Fills its parent. Put it behind the panel's content, like StyleSheet.absoluteFill.
export function Frost({ intensity = 50, tint, blurTarget, overlay = 'var(--color-surface)', base = 'var(--color-bg)' }) {
  const { c, mode } = useTheme();
  return (
    <>
      {ANDROID
        // `base: null` means "don't paint anything" — used for the dim behind a
        // sheet, where the screen must stay visible.
        ? (base ? <View style={[StyleSheet.absoluteFill, { backgroundColor: c(base) }]} /> : null)
        : <BlurView intensity={intensity} tint={tint || mode} blurTarget={blurTarget} style={StyleSheet.absoluteFill} />}
      {overlay ? <View style={[StyleSheet.absoluteFill, { backgroundColor: c(overlay) }]} /> : null}
    </>
  );
}

// Wraps the content the blur reads from. Only iOS needs it to be a real one.
export function FrostTarget({ children, style, targetRef }) {
  if (ANDROID) return <View style={style}>{children}</View>;
  return <BlurTargetView ref={targetRef} style={style}>{children}</BlurTargetView>;
}
