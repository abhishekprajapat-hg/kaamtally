import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from './theme-context';
import { T, Press, Btn } from './kit';
import Icon from './Icon';

// A whole-screen state: used when the app genuinely cannot carry on —
// it could not load the hisab, the server is unreachable, or it crashed.
// Anything the person can still work around gets a banner instead (see OfflineBar).
export default function StatusScreen({ icon = 'warning-circle', tone = 'neutral', title, body, hint, action, secondary }) {
  const { c } = useTheme();
  const ins = useSafeAreaInsets();
  const fg = tone === 'danger' ? 'var(--color-danger)' : tone === 'ok' ? 'var(--color-ok)' : 'var(--color-accent)';
  const bg = tone === 'danger' ? 'var(--color-danger-bg)' : tone === 'ok' ? 'var(--color-ok-bg)' : 'var(--color-accent-900)';
  return (
    <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 28, paddingTop: ins.top + 24, paddingBottom: ins.bottom + 24 }}>
      <View style={{ width: '100%', maxWidth: 360, alignItems: 'center', gap: 10 }}>
        <View style={{ width: 84, height: 84, borderRadius: 42, alignItems: 'center', justifyContent: 'center', backgroundColor: c(bg), marginBottom: 6 }}>
          <Icon name={icon} fill size={40} color={fg} />
        </View>
        <T w={500} style={{ fontSize: 24, textAlign: 'center', letterSpacing: -0.4 }}>{title}</T>
        {body ? <T style={{ fontSize: 16, lineHeight: 23, color: 'var(--color-neutral-400)', textAlign: 'center' }}>{body}</T> : null}
        {hint ? (
          <View style={{ marginTop: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, backgroundColor: c('var(--color-neutral-900)') }}>
            <T style={{ fontSize: 14, color: 'var(--color-neutral-400)', textAlign: 'center' }}>{hint}</T>
          </View>
        ) : null}
        {action ? <Btn label={action.label} icon={action.icon} onPress={action.on} height={54} style={{ width: '100%', marginTop: 14 }} /> : null}
        {secondary ? (
          <Press onPress={secondary.on} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center', marginTop: 2 }}>
            <T style={{ fontSize: 16, color: 'var(--color-accent)' }}>{secondary.label}</T>
          </Press>
        ) : null}
      </View>
    </ScrollView>
  );
}
