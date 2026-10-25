import React, { useRef, useState, useEffect } from 'react';
import { View, Pressable, TextInput, Platform, Animated, StyleSheet } from 'react-native';
import { useTheme } from './theme-context';
import { T } from './kit';

// A PIN box row. Shows a filled dot per digit; the real input is invisible on top.
export default function PinInput({ value = '', onChange, length = 6, autoFocus, onSubmit, label, error, secure = true }) {
  const { c } = useTheme();
  const ref = useRef(null);
  const [focused, setFocused] = useState(false);
  const shake = useRef(new Animated.Value(0)).current;
  const lastErr = useRef(error);

  // Nudge the boxes when a wrong PIN comes back.
  useEffect(() => {
    if (error && error !== lastErr.current) {
      Animated.sequence([
        Animated.timing(shake, { toValue: 1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: -1, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0.6, duration: 60, useNativeDriver: true }),
        Animated.timing(shake, { toValue: 0, duration: 60, useNativeDriver: true })
      ]).start();
    }
    lastErr.current = error;
  }, [error]);

  const digits = String(value).slice(0, length).split('');
  const focus = () => ref.current && ref.current.focus();

  return (
    <Animated.View style={{ transform: [{ translateX: shake.interpolate({ inputRange: [-1, 1], outputRange: [-8, 8] }) }] }}>
      <Pressable onPress={focus} accessible={false} importantForAccessibility="no-hide-descendants" style={{ flexDirection: 'row', gap: 10, justifyContent: 'center' }}>
        {Array.from({ length }).map((_, i) => {
          const filled = i < digits.length;
          const active = focused && i === digits.length;
          return (
            <View key={i} style={{
              width: 44, height: 54, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
              backgroundColor: c('var(--color-neutral-900)'),
              borderWidth: 1.5,
              borderColor: error ? c('var(--color-accent-300)') : active ? c('var(--color-accent)') : filled ? c('var(--color-neutral-700)') : 'transparent'
            }}>
              {filled ? (
                secure
                  ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: c('var(--color-text)') }} />
                  : <T w={500} style={{ fontSize: 24 }}>{digits[i]}</T>
              ) : null}
            </View>
          );
        })}
      </Pressable>
      <TextInput
        ref={ref}
        value={value}
        onChangeText={(v) => onChange(v.replace(/\D/g, '').slice(0, length))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onSubmitEditing={onSubmit}
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={length}
        autoFocus={autoFocus}
        secureTextEntry={Platform.OS !== 'web' && secure}
        textContentType="password"
        accessibilityLabel={label}
        caretHidden
        style={[StyleSheet.absoluteFill, { opacity: 0, color: 'transparent' }, Platform.OS === 'web' ? { outlineStyle: 'none' } : null]}
      />
    </Animated.View>
  );
}
