import React, { useRef } from 'react';
import { View, ScrollView, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/theme-context';
import { T, Press, Glass, Seg, Input, Btn, FadeIn } from '../ui/kit';
import Icon from '../ui/Icon';
import PinInput from '../ui/PinInput';
import { useKeyboardAwareScroll, useKeyboard } from '../ui/keyboard';
import Logo from '../ui/Logo';

function Row({ icon, children, last }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56, borderBottomWidth: last ? 0 : 1, borderBottomColor: c('var(--color-neutral-800)') }}>
      <Icon name={icon} size={20} color="var(--color-neutral-400)" />
      {children}
    </View>
  );
}

export default function Auth({ au, topInset }) {
  const { c } = useTheme();
  const ins = useSafeAreaInsets();
  const scroll = useRef(null);
  const kb = useKeyboard();
  const aware = useKeyboardAwareScroll(scroll);
  return (
    <View style={{ flex: 1 }}>
      <ScrollView ref={scroll} onScroll={aware.onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled"
        keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
        contentContainerStyle={{ alignItems: 'center', paddingTop: (kb.open ? 20 : 64) + (topInset == null ? ins.top : topInset), paddingBottom: 32 + ins.bottom + kb.inset, paddingHorizontal: 20 }}>
        <FadeIn keyId={au.isPin ? 'pin-' + au.isSignup : 'phone'} duration={450} style={{ width: '100%', maxWidth: 400, gap: 22 }}>
          <View style={{ gap: 14 }}>
            {au.isPin ? (
              <View style={{ width: 68, height: 68, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: c('var(--color-surface)'), boxShadow: c('var(--shadow-md)') }}>
                <Icon name="lock-key" fill size={36} color="var(--color-accent)" />
              </View>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ boxShadow: c('var(--shadow-md)'), borderRadius: 16 }}><Logo size={68} /></View>
                <T w={600} style={{ fontSize: 27, letterSpacing: -0.5 }}>Kaamtally</T>
              </View>
            )}
            <View>
              <T w={500} style={{ fontSize: 34, letterSpacing: -0.85 }}>{au.title}</T>
              <T style={{ fontSize: 16, color: 'var(--color-neutral-400)', marginTop: 4 }}>{au.sub}</T>
            </View>
          </View>

          {au.isPhone ? (
            <>
              <Seg items={au.modes} height={42} fontSize={15} />
              <Glass>
                {au.isSignup ? (
                  <>
                    <Row icon="user"><Input placeholder="Your name" value={au.f.name} onChangeText={au.h.name} autoComplete="name" textContentType="name" style={{ flex: 1, minWidth: 0 }} /></Row>
                    <Row icon="storefront"><Input placeholder="Business name (optional)" value={au.f.biz} onChangeText={au.h.biz} style={{ flex: 1, minWidth: 0 }} /></Row>
                  </>
                ) : null}
                <Row icon="phone" last>
                  <T style={{ color: 'var(--color-neutral-400)', fontSize: 17 }}>+91</T>
                  <Input placeholder="Mobile number" keyboardType="number-pad" inputMode="numeric" maxLength={10} autoComplete="tel" textContentType="telephoneNumber"
                    value={au.f.mobile} onChangeText={au.h.mobile} onSubmitEditing={au.submit} style={{ flex: 1, minWidth: 0, letterSpacing: 0.5 }} />
                </Row>
              </Glass>
            </>
          ) : null}

          {au.isPin ? (
            <Glass style={{ paddingVertical: 20, paddingHorizontal: 16, alignItems: 'center', gap: 16 }}>
              {au.isSignup ? <T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>Choose your PIN</T> : null}
              <PinInput value={au.f.pin} onChange={au.h.pin} length={au.pinLength} autoFocus label={au.isSignup ? 'Choose your PIN' : 'Your PIN'} error={au.err} onSubmit={au.isSignup ? undefined : au.submit} />
              {au.isSignup ? (
                <>
                  <T style={{ fontSize: 14, color: 'var(--color-neutral-400)', marginTop: 4 }}>Enter it again</T>
                  <PinInput value={au.f.confirmPin} onChange={au.h.confirmPin} length={au.pinLength} label="Enter your PIN again" onSubmit={au.submit} />
                </>
              ) : null}
              <Press onPress={au.changeNumber} style={{ minHeight: 40, justifyContent: 'center' }}>
                <T style={{ fontSize: 15, color: 'var(--color-accent)' }}>Change number</T>
              </Press>
            </Glass>
          ) : null}

          {au.err ? (
            <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 4 }}>
              <Icon name="warning-circle" fill size={18} color="var(--color-accent-300)" style={{ marginTop: 1 }} />
              <T style={{ flex: 1, fontSize: 15, color: 'var(--color-accent-300)' }}>{au.err}</T>
            </View>
          ) : null}

          <Btn label={au.busy ? 'Please wait…' : au.cta} icon="arrow-right" iconRight iconSize={19} onPress={au.submit} height={56} />
          <T style={{ fontSize: 14, color: 'var(--color-neutral-400)', textAlign: 'center' }}>{au.hint}</T>

          {au.showDemo ? (
            <Press onPress={au.demo} style={{ alignSelf: 'center' }}>
              <Glass radius={20} style={{ minHeight: 40, paddingHorizontal: 16, justifyContent: 'center' }}>
                <T style={{ fontSize: 14, color: 'var(--color-accent-300)' }}>{au.demoLabel}</T>
              </Glass>
            </Press>
          ) : null}
        </FadeIn>
      </ScrollView>
    </View>
  );
}
