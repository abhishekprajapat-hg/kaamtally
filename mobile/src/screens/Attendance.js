import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../ui/theme-context';
import { T, Press, Glass, Seg, Avatar, Btn, Pop } from '../ui/kit';
import Icon from '../ui/Icon';
import { DateField } from '../ui/overlays';

function Banner({ icon, text, accent }) {
  const inner = (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16 }}>
      <Icon name={icon} fill size={22} color={accent ? 'var(--color-accent-200)' : 'var(--color-neutral-300)'} />
      <T style={{ flex: 1, fontSize: 15, color: accent ? 'var(--color-accent-200)' : 'var(--color-neutral-300)' }}>{text}</T>
    </View>
  );
  if (accent) return <AccentBox>{inner}</AccentBox>;
  return <Glass radius={14}>{inner}</Glass>;
}
function AccentBox({ children, style }) {
  const { c } = useTheme();
  return <View style={[{ borderRadius: 14, backgroundColor: c('var(--color-accent-900)') }, style]}>{children}</View>;
}

export function Attendance({ v }) {
  const { c } = useTheme();
  const a = v.att;
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 4, marginTop: -6 }}>
        {a.days.map((d, i) => (
          <Press key={i} onPress={d.on} style={{ flex: 1, minHeight: 64, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 2, backgroundColor: c(d.bg) }}>
            <T numberOfLines={1} style={{ fontSize: 12, opacity: 0.8, color: d.fg }}>{d.dow}</T>
            <T w={500} style={{ fontSize: 20, color: d.fg }}>{d.n}</T>
            <View style={{ width: 5, height: 5, borderRadius: 3, backgroundColor: c(d.dot) }} />
          </Press>
        ))}
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: -8 }}>
        <T style={{ flex: 1, fontSize: 15, color: 'var(--color-neutral-400)' }}>Pick another date</T>
        <DateField value={v.attDate} onChange={v.onAttDate} min={v.START} max={v.TODAY} label="Pick another date" style={{ minHeight: 40, borderRadius: 10, backgroundColor: c('var(--color-surface)'), justifyContent: 'center', paddingHorizontal: 12 }} />
      </View>
      <Seg items={a.siteChips} />
      {a.isPast ? <Banner accent icon="clock-counter-clockwise" text="You're editing a past date. Changes will ask for confirmation and update salary automatically." /> : null}
      {a.isSunday ? <Banner icon="moon" text="Sunday is the weekly off. Mark Present only if work happened." /> : null}

      <Glass style={{ padding: 16, gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <T w={500} style={{ fontSize: 22, letterSpacing: -0.44 }}>{a.markedN} of {a.totalN} marked</T>
            <T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{a.leftText} · Cost {a.cost}</T>
          </View>
          {a.canMarkAll ? <Btn icon="checks" label="All Present" onPress={a.markAll} height={44} fontSize={15} radius={12} bg="transparent" style={{ paddingHorizontal: 12 }} /> : null}
        </View>
        <View style={{ height: 6, borderRadius: 3, backgroundColor: c('var(--color-neutral-800)'), overflow: 'hidden' }}>
          <View style={{ height: '100%', borderRadius: 3, width: `${a.pct * 100}%`, backgroundColor: c('var(--color-accent)') }} />
        </View>
        <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
          {a.counts.map((k) => (
            <View key={k.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Icon name={k.icon} fill size={14} color={k.dot} /><T style={{ fontSize: 14, color: 'var(--color-neutral-300)' }}>{k.label} {k.n}</T></View>
          ))}
        </View>
      </Glass>

      <View style={{ gap: 10 }}>
        {a.rows.map((r) => (
          <Glass key={r.w.id} shadow={r.shadow ? `0 0 0 1.5px ${c('var(--color-accent-600)')}` : undefined} style={{ padding: 14, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Avatar size={44} ini={r.w.ini} bg={r.w.avBg} fg={r.w.avFg} fontSize={15} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <T numberOfLines={1} w={500} style={{ fontSize: 17 }}>{r.w.name}<T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}> {r.w.dup}</T></T>
                <T numberOfLines={1} style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{r.meta}</T>
              </View>
              {r.changed ? <View style={{ paddingVertical: 4, paddingHorizontal: 9, borderRadius: 10, backgroundColor: c('var(--color-accent-800)') }}><T style={{ fontSize: 12, color: 'var(--color-accent-100)' }}>Unsaved</T></View> : null}
            </View>
            {r.note ? <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><Icon name="info" fill size={15} color="var(--color-accent-300)" /><T style={{ fontSize: 14, color: 'var(--color-accent-300)' }}>{r.note}</T></View> : null}
            <View style={{ flexDirection: 'row', gap: 3, padding: 3, borderRadius: 13, backgroundColor: c('var(--seg-track)') }}>
              {r.btns.map((b) => (
                <Press key={b.k} onPress={b.on} accessibilityState={{ selected: b.sel }} accessibilityLabel={`${r.w.name}: ${b.label}`}
                  style={{ flex: 1, minHeight: 52, borderRadius: 10, backgroundColor: c(b.bg), boxShadow: b.sh !== 'none' ? b.sh : undefined, alignItems: 'center', justifyContent: 'center', gap: 2, padding: 2 }}>
                  <Pop active={b.sel}><Icon name={b.ic} size={19} color={b.fg} /></Pop>
                  <T w={500} numberOfLines={1} style={{ fontSize: 13, color: b.fg }}>{b.label}</T>
                </Press>
              ))}
            </View>
          </Glass>
        ))}
      </View>
      {a.empty ? (
        <View style={{ paddingVertical: 40, paddingHorizontal: 16, alignItems: 'center', gap: 8 }}>
          <Icon name="users-three" size={44} color="var(--color-neutral-600)" />
          <T w={500} style={{ fontSize: 18 }}>No workers at this site</T>
          <T style={{ fontSize: 15, color: 'var(--color-neutral-400)', textAlign: 'center' }}>Change a worker's default site, or choose All sites.</T>
        </View>
      ) : null}
    </>
  );
}
