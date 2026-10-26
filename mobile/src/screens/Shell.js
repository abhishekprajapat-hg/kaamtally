import React, { useRef } from 'react';
import { View, ScrollView, StyleSheet, Animated, Platform, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import Svg, { Circle } from 'react-native-svg';
import { Frost, FrostTarget } from '../ui/frost';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../ui/theme-context';
import { T, Press, FadeIn, Pop, Btn, Input } from '../ui/kit';
import Icon from '../ui/Icon';
import Logo, { LogoLockup } from '../ui/Logo';
import { Sheet, DialogBody, Toast, DateField } from '../ui/overlays';
import { useKeyboardAwareScroll, useKeyboard } from '../ui/keyboard';
import { useConnection } from '../lib/net';
import StatusScreen from '../ui/StatusScreen';
import OfflineBar from '../ui/OfflineBar';
import PinInput from '../ui/PinInput';
import { fade } from '../theme';
import Auth from './Auth';
import Home from './Home';
import { Attendance } from './Attendance';
import History from './History';
import { Workers, WorkerForm, Profile } from './Workers';
import { PeriodPicker, Salary, Ledger, TxForm } from './Money';
import { Sites, Reports, Report, More, Settings } from './Other';


function Splash({ text, offline, retry, logout }) {
  const { c } = useTheme();
  if (!text) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 18, padding: 24 }}>
        <View style={{ boxShadow: c('var(--shadow-md)'), borderRadius: 16 }}><Logo size={68} /></View>
        <ActivityIndicator color={c('var(--color-accent)')} />
      </View>
    );
  }
  // Couldn't load the hisab at all — the one case that really has to take over the screen.
  return offline ? (
    <StatusScreen
      icon="warning-circle" tone="danger"
      title="No internet"
      body="Kaamtally couldn't load your team and hisab. Check your mobile data or Wi-Fi, then try again."
      hint="Nothing is lost — your hisab is safe on the server."
      action={{ label: 'Try again', icon: 'arrow-right', on: retry }}
      secondary={{ label: 'Log out', on: logout }}
    />
  ) : (
    <StatusScreen
      icon="warning" tone="danger"
      title="Can't reach the server"
      body={text}
      action={{ label: 'Try again', icon: 'arrow-right', on: retry }}
      secondary={{ label: 'Log out', on: logout }}
    />
  );
}

function Header({ v, top, blurTarget, net }) {
  const { c, mode } = useTheme();
  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 5, alignItems: 'center' }} pointerEvents="box-none">
      <View style={{ width: '100%', overflow: 'hidden', boxShadow: v.scrolled ? `0 1px 0 ${c('var(--color-neutral-800)')}` : undefined }}>
        <Frost intensity={30} blurTarget={blurTarget} overlay={fade(c('var(--color-bg)'), 82)} />
        <View style={{ paddingTop: top, alignSelf: 'center', width: '100%', maxWidth: v.wide ? undefined : v.colMax }}>
          <OfflineBar offline={net.offline} slow={net.slow} />
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
          <Frost intensity={50} blurTarget={blurTarget} />
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 }}>
            {/* No highlight behind the icon — the colour and the dot show which tab
                is open. The dot is SVG because Android drops a plain View's
                rounded corners inside this blurred bar. */}
            {v.bottomNav.map((n) => (
              <Press key={n.k} onPress={n.press} accessibilityLabel={n.label} accessibilityState={{ selected: n.on }} style={{ flex: 1, height: 52, alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                <View style={{ width: 50, height: 34, alignItems: 'center', justifyContent: 'center' }}>
                  <Pop active={n.on}><Icon name={n.icon} size={26} color={n.fg} /></Pop>
                </View>
                <View style={{ width: 4, height: 4 }}>
                  {n.on ? <Svg width={4} height={4}><Circle cx={2} cy={2} r={2} fill={c(n.dot)} /></Svg> : null}
                </View>
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
          <Frost intensity={50} blurTarget={blurTarget} />
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

function DayMarkSheet({ v }) {
  const { c } = useTheme();
  const d = v.dayEdit;
  if (!d) return null;
  return (
    <Sheet visible={!!v.dayEdit} onClose={d.close} wide={v.wide} bg="var(--color-bg)" pad={16}>
      <View style={{ gap: 2, paddingHorizontal: 4 }}>
        <T w={500} style={{ fontSize: 19 }}>{d.name}</T>
        <T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{d.when}{d.isToday ? ' · today' : ''} · {d.rateNote}</T>
      </View>
      <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: c('var(--color-surface)'), boxShadow: `inset 0 1px 0 ${c('var(--glass-hi)')}, inset 0 0 0 1px ${c('var(--glass-edge)')}` }}>
        {d.options.map((o, i) => (
          <Press key={o.k} onPress={o.on} disabled={d.busy} accessibilityState={{ selected: o.sel }}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 58, paddingHorizontal: 16,
              backgroundColor: o.sel ? c('var(--color-accent-900)') : 'transparent',
              borderBottomWidth: i < d.options.length - 1 ? 1 : 0, borderBottomColor: c('var(--color-neutral-800)') }}>
            <Icon name={o.icon} fill size={22} color={o.sel ? 'var(--color-accent)' : o.dot} />
            <T w={o.sel ? 500 : 400} style={{ flex: 1, fontSize: 16 }}>{o.label}</T>
            <T style={{ fontSize: 14, color: o.sel ? 'var(--color-accent-200)' : 'var(--color-neutral-400)' }}>{o.amt}</T>
            {o.sel ? <Icon name="check" size={18} color="var(--color-accent)" /> : null}
          </Press>
        ))}
      </View>
      {d.canClear ? (
        <Press onPress={d.clear} disabled={d.busy} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
          <T style={{ fontSize: 15, color: 'var(--color-accent-300)' }}>Clear this day's mark</T>
        </Press>
      ) : null}
      <Press onPress={d.close} disabled={d.busy} style={{ minHeight: 48, alignItems: 'center', justifyContent: 'center' }}>
        <T style={{ fontSize: 16, color: 'var(--color-neutral-300)' }}>{d.busy ? 'Saving…' : 'Cancel'}</T>
      </Press>
    </Sheet>
  );
}

export default function Shell({ v, booting, loadErr, loadOffline, retry, logout, scrollRef, onScroll }) {
  const { c, mode } = useTheme();
  const ins = useSafeAreaInsets();
  const net = useConnection();
  const target = useRef(null);
  const kb = useKeyboard();
  const keyboardOpen = kb.open;
  // A sheet on top handles its own scrolling, so the screen stands down.
  const sheetOpen = !!(v && (v.pinForm || v.siteForm));
  const aware = useKeyboardAwareScroll(scrollRef, { enabled: !sheetOpen });
  const handleScroll = (e) => { aware.onScroll(e); if (onScroll) onScroll(e); };
  const status = <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />;
  if (!v) {
    return <View style={{ flex: 1, backgroundColor: c('var(--color-bg)') }}>{status}<Splash text={!booting && loadErr} offline={loadOffline || net.offline} retry={retry} logout={logout} /></View>;
  }
  if (v.isAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: c('var(--color-bg)') }}>
        {status}
        <View style={{ paddingTop: ins.top }}><OfflineBar offline={net.offline} slow={net.slow} /></View>
        <Auth au={v.au} topInset={net.offline || net.slow ? 0 : ins.top} />
        <Toast toast={v.toast} />
      </View>
    );
  }
  // With the keyboard up the floating nav is hidden, so it stops taking space.
  const navH = keyboardOpen ? 8 : v.narrow ? 64 + 16 + ins.bottom : 16 + ins.bottom;
  const saveH = v.att.showSave ? 76 : 0;
  // Room so the content can scroll clear of the keyboard. On an edge-to-edge
  // Android window nothing resizes, so this is needed on both platforms;
  // the hook reports 0 when the OS already made the room.
  const kbPad = kb.inset;
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
          <FrostTarget targetRef={target} style={StyleSheet.absoluteFill}>
            <ScrollView ref={scrollRef} onScroll={handleScroll} scrollEventThrottle={16} keyboardShouldPersistTaps="handled"
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingTop: ins.top + 52, paddingBottom: navH + saveH + 32 + kbPad, alignItems: 'center' }}>
              <View style={{ width: '100%', maxWidth: v.colMax }}>{content}</View>
            </ScrollView>
          </FrostTarget>
          <Header v={v} top={ins.top} blurTarget={target} net={net} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, alignItems: 'center' }} pointerEvents="box-none">
            <View style={{ width: '100%', maxWidth: v.colMax }} pointerEvents="box-none">
              {v.att.showSave && !keyboardOpen ? <SaveBar att={v.att} blurTarget={target} /> : null}
              {v.narrow && !keyboardOpen ? <BottomNav v={v} bottom={ins.bottom} blurTarget={target} /> : <View style={{ height: keyboardOpen ? 0 : ins.bottom }} />}
            </View>
          </View>
        </View>
      </View>
      <Sheet visible={!!v.dialog} onClose={v.closeDialog} wide={v.wide}>
        <DialogBody dialog={v.dialog} onOk={v.okDialog} onCancel={v.closeDialog} />
      </Sheet>
      <SiteFormSheet v={v} />
      <ChangePinSheet v={v} />
      <DayMarkSheet v={v} />
      <Toast toast={v.toast} />
    </View>
  );
}
