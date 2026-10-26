import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing } from 'react-native';
import { useTheme } from './theme-context';
import { T } from './kit';
import Icon from './Icon';

// A slim strip under the header. It never blocks anything: on site you still
// want to see your workers and mark attendance while the signal comes and goes.
export default function OfflineBar({ offline, slow }) {
  const { c } = useTheme();
  const show = offline || slow;
  const a = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(a, { toValue: show ? 1 : 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: false }).start();
  }, [show]);
  const fg = offline ? 'var(--color-danger)' : 'var(--color-accent)';
  const bg = offline ? 'var(--color-danger-bg)' : 'var(--color-accent-900)';
  return (
    <Animated.View style={{ height: a.interpolate({ inputRange: [0, 1], outputRange: [0, 34] }), opacity: a, overflow: 'hidden' }}>
      <View accessibilityRole="alert" style={{ height: 34, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 14, backgroundColor: c(bg) }}>
        <Icon name={offline ? 'warning-circle' : 'clock-counter-clockwise'} fill size={15} color={fg} />
        <T numberOfLines={1} style={{ fontSize: 13.5, color: fg }}>
          {offline ? "No internet — changes won't save" : 'Slow internet — hang on'}
        </T>
      </View>
    </Animated.View>
  );
}
