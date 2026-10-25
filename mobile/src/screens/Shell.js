import React, { useRef } from 'react';
import { View, ScrollView, StyleSheet, Animated, Platform, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { BlurView, BlurTargetView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/theme-context';
import { T, Press, FadeIn, Pop, Btn, Input } from '../ui/kit';
import Icon from '../ui/Icon';
import Logo, { LogoLockup } from '../ui/Logo';
import { Sheet, DialogBody, Toast, DateField } from '../ui/overlays';
import PinInput from '../ui/PinInput';
import { fade } from '../theme';
import Auth from './Auth';
import Home from './Home';
import { Attendance } from './Attendance';
import History from './History';
import { Workers, WorkerForm, Profile } from './Workers';
import { PeriodPicker, Salary, Ledger, TxForm } from './Money';
import { Sites, Reports, Report, More, Settings } from './Other';

const BLUR = Platform.OS === 'android' ? { blurMethod: 'dimezisBlurViewSdk31Plus' } : {};

function Splash({ text, retry, logout }) {
  const { c } = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 }}>
      <View style={{ boxShadow: c('var(--shadow-md)'), borderRadius: 16 }}><Logo size={68} /></View>
      {text ? (
        <>
          <T style={{ fontSize: 16, color: 'var(--color-neutral-300)', textAlign: 'center', maxWidth: 320 }}>{text}</T>
          <Btn label="Try again" icon="arrow-right" iconRight onPress={retry} style={{ minWidth: 200 }} />
          <Press onPress={logout} style={{ minHeight: 40, justifyContent: 'center' }}><T style={{ fontSize: 15, color: 'var(--color-accent)' }}>Log out</T></Press>
        </>
      ) : <ActivityIndicator color={c('var(--color-accent)')} />}
    </View>
  );
}

function Header({ v, top, blurTarget }) {
  const { c, mode } = useTheme();
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, alignItems: 'center' }} pointerEvents="box-none">
      <View style={{ width: '100%', overflow: 'hidden', boxShadow: v.scrolled ? `0 1px 0 ${c('var(--color-neutral-800)')}` : undefined }}>
        <BlurView intensity={30} tint={mode} blurTarget={blurTarget} {...BLUR} style={StyleSheet.absoluteFill} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: fade(c('var(--color-bg)'), 82) }]} />
        <View style={{ paddingTop: top, alignSelf: 'center', width: '100%', maxWidth: v.wide ? undefined : v.colMax }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 52, paddingVertical: 6, paddingHorizontal: 10 }}>
            {v.canBack ? (
              <Press onPress={v.back} style={{ flexDirection: 'row', alignItems: 'center', gap: 2, minHeight: 44, paddingRight: 8 }} accessibilityLabel={'Back to ' + v.backLabel}>
                <Icon name="caret-left" size={24} color="var(--color-accent)" />
                <T numberOfLines={1} style={{ fontSize: 17, color: 'var(--color-accent)', maxWidth: 110 }}>{v.backLabel}</T>
              </Press>
            ) : v.wide ? null : <View style={{ paddingLeft: 6, paddingRight: 2 }}><LogoLockup size={28} fontSize={17} gap={8} /></View>}
            {/* The brand holds the left on top-level screens, so the small title is only
                needed on sub-screens, where the back button replaces the brand. */}
            <T numberOfLines={1} w={500} style={{ flex: 1, minWidth: 0, textAlign: 'center', fontSize: 17, opacity: v.scrolled && v.canBack ? 1 : 0 }}>{v.title}</T>
            {v.headAction ? (
              <Press onPress={v.headAction.on} accessibilityLabel={v.headAction.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, minHeight: 44, paddingHorizontal: 10 }}>
                <Icon name={v.headAction.icon} size={22} color="var(--color-accent)" />
                <T style={{ fontSize: 17, color: 'var(--color-accent)' }}>{v.headAction.label}</T>
              </Press>
            ) : null}
            <Press onPress={v.toggleTheme} accessibilityLabel="Switch light or dark" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name={v.themeIcon} size={23} color="var(--color-accent)" />
            </Press>
            {v.isHome ? (
              <Press onPress={v.onBell} accessibilityLabel="Notifications" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="bell" size={24} color="var(--color-accent)" />
                {v.home.hasUnmarked ? <View style={{ position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: c('var(--color-accent)'), boxShadow: `0 0 0 2px ${c('var(--color-bg)')}` }} /> : null}
              </Press>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

function BottomNav({ v, bottom, blurTarget }) {
  const { c, mode } = useTheme();
  return (
    <View style={{ paddingHorizontal: 18, paddingBottom: 16 + bottom }} pointerEvents="box-none">
      <View style={{ height: 64, borderRadius: 32, boxShadow: '0 12px 36px rgba(0,0,0,.28)' }}>
        <View style={{ flex: 1, borderRadius: 32, overflow: 'hidden' }}>
          <BlurView intensity={50} tint={mode} blurTarget={blurTarget} {...BLUR} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c('var(--color-surface)') }]} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
            {v.bottomNav.map((n) => (
              <Press key={n.k} onPress={n.press} accessibilityLabel={n.label} accessibilityState={{ selected: n.on }} style={{ flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                <View style={{ width: 50, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: c(n.pill) }}>
                  <Pop active={n.on}><Icon name={n.icon} size={26} color={n.fg} /></Pop>
                </View>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: c(n.dot) }} />
              </Press>
            ))}
          </View>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 32, boxShadow: `inset 0 1px 0 ${c('var(--glass-hi)')}, inset 0 0 0 1px ${c('var(--glass-edge)')}` }]} />
        </View>
      </View>
    </View>
  );
}

function SaveBar({ att, blurTarget }) {
  const { c, mode } = useTheme();
  return (
    <View style={{ paddingHorizontal: 12, paddingBottom: 10 }}>
      <View style={{ borderRadius: 18, boxShadow: c('var(--shadow-lg)') }}>
        <View style={{ borderRadius: 18, overflow: 'hidden' }}>
          <BlurView intensity={50} tint={mode} blurTarget={blurTarget} {...BLUR} style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: c('var(--color-surface)') }]} />
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 16, paddingRight: 10 }}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <T w={500} style={{ fontSize: 16 }}>{att.draftN} unsaved change{att.draftN > 1 ? 's' : ''}</T>
              <T numberOfLines={1} style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{att.dateLabel}</T>
            </View>
            <Press onPress={att.discard} style={{ minHeight: 46, paddingHorizontal: 12, justifyContent: 'center' }}><T style={{ fontSize: 16, color: 'var(--color-neutral-300)' }}>Cancel</T></Press>
            <Press onPress={att.save} disabled={att.busy} style={{ minHeight: 46, paddingHorizontal: 22, borderRadius: 12, borderWidth: 1, borderColor: c('var(--color-accent)'), backgroundColor: c('var(--color-accent-800)'), justifyContent: 'center', opacity: att.busy ? 0.6 : 1 }}>
              <T w={500} style={{ fontSize: 17, color: 'var(--color-accent-100)' }}>{att.busy ? 'Saving…' : 'Save'}</T>
            </Press>
          </View>
          <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: 18, boxShadow: `inset 0 1px 0 ${c('var(--glass-hi)')}, inset 0 0 0 1px ${c('var(--glass-edge)')}` }]} />
        </View>
      </View>
    </View>
  );
}

function SideNav({ v, top }) {
  const { c } = useTheme();
  return (
    <View style={{ width: 260, paddingTop: 24 + top, paddingHorizontal: 12, paddingBottom: 24, backgroundColor: c('var(--color-surface)'), boxShadow: c('var(--shadow-sm)'), gap: 2 }}>
      <View style={{ paddingHorizontal: 10, paddingBottom: 22 }}>
        <LogoLockup size={38} fontSize={20} gap={11} />
      </View>
      {v.sideNav.map((n) => (
        <Press key={n.label} onPress={n.on} scale={0.97} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 46, paddingHorizontal: 12, borderRadius: 10, backgroundColor: c(n.bg) }}>
          <Icon name={n.icon} size={21} color={n.fg} /><T style={{ fontSize: 16, color: n.fg }}>{n.label}</T>
        </Press>
      ))}
      <View style={{ flex: 1 }} />
      <T style={{ padding: 12, fontSize: 13, color: 'var(--color-neutral-400)' }}>{v.me.biz}</T>
    </View>
  );
}

function SiteFormSheet({ v }) {
  const { c } = useTheme();
  const sf = v.siteForm || {};
  const row = { minHeight: 52, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: c('var(--color-neutral-800)') };
  return (
    <Sheet visible={!!v.siteForm} onClose={v.closeSiteForm} wide={v.wide} bg="var(--color-bg)" pad={16}>
      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <Press onPress={v.closeSiteForm} style={{ minHeight: 44, justifyContent: 'center' }}><T style={{ color: 'var(--color-accent)' }}>Cancel</T></Press>
        <T w={500} style={{ flex: 1, textAlign: 'center' }}>New Site</T>
        <Press onPress={v.saveSite} style={{ minHeight: 44, justifyContent: 'center' }}><T w={500} style={{ color: 'var(--color-accent)' }}>Add</T></Press>
      </View>
      <View style={{ borderRadius: 14, overflow: 'hidden', backgroundColor: c('var(--color-surface)'), boxShadow: `inset 0 1px 0 ${c('var(--glass-hi)')}, inset 0 0 0 1px ${c('var(--glass-edge)')}` }}>
        <Input accessibilityLabel="Site name" placeholder="Site name (required)" value={sf.name} onChangeText={v.sh.name} style={row} />
        <Input accessibilityLabel="Client name" placeholder="Client name (optional)" value={sf.client} onChangeText={v.sh.client} style={row} />
        <Input accessibilityLabel="Address" placeholder="Address (optional)" value={sf.address} onChangeText={v.sh.address} style={row} />
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52 }}>
          <T style={{ flex: 1 }}>Start date</T>
          <DateField value={sf.start} onChange={v.sh.start} label="Start date" />
        </View>
      </View>
      {v.siteErr ? <T style={{ fontSize: 14, color: 'var(--color-accent-300)', paddingHorizontal: 8 }}>{v.siteErr}</T> : null}
    </Sheet>
  );
}

function ChangePinSheet({ v }) {
  const f = v.pinForm || {};
  const e = v.pinErr || {};
  const field = (label, key, autoFocus) => (
    <View style={{ gap: 8, alignItems: 'center' }}>
      <T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{label}</T>
      <PinInput value={f[key] || ''} onChange={v.ph[key]} length={v.pinLength} autoFocus={autoFocus} label={label} error={e[key]} />
      {e[key] ? <T style={{ fontSize: 13, color: 'var(--color-accent-300)', textAlign: 'center' }}>{e[key]}</T> : null}
    </View>
  );
  return (
    <Sheet visible={!!v.pinForm} onClose={v.closePinForm} wide={v.wide}>
      <View style={{ alignItems: 'center', gap: 6, paddingTop: 4 }}>
        <Icon name="lock-key" fill size={28} color="var(--color-accent)" />
        <T w={500} style={{ fontSize: 20 }}>Change login PIN</T>
      </View>
      {field('Current PIN', 'currentPin', true)}
      {field('New PIN', 'newPin')}
      {field('Enter new PIN again', 'confirmPin')}
      {e.form ? <T style={{ fontSize: 14, color: 'var(--color-accent-300)', textAlign: 'center' }}>{e.form}</T> : null}
      <Btn label="Save new PIN" icon="check" onPress={v.savePin} height={54} />
      <Press onPress={v.closePinForm} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
        <T style={{ fontSize: 16, color: 'var(--color-accent-300)' }}>Cancel</T>
      </Press>
    </Sheet>
  );
}

export default function Shell({ v, booting, loadErr, retry, logout, scrollRef, onScroll }) {
  const { c, mode } = useTheme();
  const ins = useSafeAreaInsets();
  const target = useRef(null);
  const status = <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
  if (!v) {
    return <View style={{ flex: 1, backgroundColor: c('var(--color-bg)') }}>{status}<Splash text={!booting && loadErr} retry={retry} logout={logout} /></View>;
  }
  if (v.isAuth) {
    return <View style={{ flex: 1, backgroundColor: c('var(--color-bg)') }}>{status}<Auth au={v.au} />
      <Toast toast={v.toast} /></View>;
  }
  const navH = v.narrow ? 64 + 16 + ins.bottom : 16 + ins.bottom;
  const saveH = v.att.showSave ? 76 : 0;
  const content = (
    <FadeIn keyId={v.screenKey} style={{ paddingHorizontal: 16, gap: 20 }}>
      <View style={{ gap: 2, paddingTop: 2 }}>
        {v.isHome ? <T style={{ fontSize: 15, color: 'var(--color-neutral-400)' }}>{v.todayLong}</T> : null}
        <T w={500} style={{ fontSize: 34, letterSpacing: -0.85, lineHeight: 39 }}>{v.bigTitle}</T>
        {v.subtitle ? <T style={{ fontSize: 15, color: 'var(--color-neutral-400)' }}>{v.subtitle}</T> : null}
      </View>
      {v.isHome ? <Home v={v} /> : null}
      {v.isAtt ? <Attendance v={v} /> : null}
      {v.isHistory ? <History v={v} /> : null}
      {v.isWorkers ? <Workers v={v} /> : null}
      {v.isForm ? <WorkerForm v={v} /> : null}
      {v.isProfile ? <Profile v={v} /> : null}
      {v.showPeriod ? <PeriodPicker v={v} /> : null}
      {v.isHisab ? <Salary v={v} /> : null}
      {v.isLedger ? <Ledger v={v} /> : null}
      {v.isTx ? <TxForm v={v} /> : null}
      {v.isSites ? <Sites v={v} /> : null}
      {v.isReports ? <Reports v={v} /> : null}
      {v.isReport ? <Report v={v} /> : null}
      {v.isMore ? <More v={v} /> : null}
      {v.isSettings ? <Settings v={v} /> : null}
    </FadeIn>
  );
  return (
    <View style={{ flex: 1, backgroundColor: c('var(--color-bg)') }}>
      {status}
      <View style={{ flex: 1, flexDirection: 'row' }}>
        {v.wide ? <SideNav v={v} top={ins.top} /> : null}
        <View style={{ flex: 1 }}>
          <BlurTargetView ref={target} style={StyleSheet.absoluteFill}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
              <ScrollView ref={scrollRef} onScroll={onScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingTop: ins.top + 52, paddingBottom: navH + saveH + 32, alignItems: 'center' }}>
                <View style={{ width: '100%', maxWidth: v.colMax }}>{content}</View>
              </ScrollView>
            </KeyboardAvoidingView>
          </BlurTargetView>
          <Header v={v} top={ins.top} blurTarget={target} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }} pointerEvents="box-none">
            <View style={{ width: '100%', maxWidth: v.colMax }} pointerEvents="box-none">
              {v.att.showSave ? <SaveBar att={v.att} blurTarget={target} /> : null}
              {v.narrow ? <BottomNav v={v} bottom={ins.bottom} blurTarget={target} /> : <View style={{ height: ins.bottom }} />}
            </View>
          </View>
        </View>
      </View>
      <Sheet visible={!!v.dialog} onClose={v.closeDialog} wide={v.wide}>
        <DialogBody dialog={v.dialog} onOk={v.okDialog} onCancel={v.closeDialog} />
      </Sheet>
      <SiteFormSheet v={v} />
      <ChangePinSheet v={v} />
      <Toast toast={v.toast} />
    </View>
  );
}
