import React from 'react';
import { View, ScrollView } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useTheme } from '../ui/theme-context';
import { T, Press, Glass, Grid, Btn, Avatar, IconTile } from '../ui/kit';
import Icon from '../ui/Icon';
import { fade } from '../theme';

// Hero card: linear-gradient(160deg, accent-700 @45%, surface 75%) with accent-800 ring
export function Hero({ children, style, gap = 16 }) {
  const { c } = useTheme();
  return (
    <View style={[{ borderRadius: 20, boxShadow: `0 0 0 1px ${c('var(--color-accent-800)')}` }, style]}>
      <View style={{ borderRadius: 20, padding: 20, gap, backgroundColor: c('var(--color-surface)') }}>
        {children}
      </View>
    </View>
  );
}

function Ring({ pct, text }) {
  const { c } = useTheme();
  const r = 34.5, C = 2 * Math.PI * r;
  return (
    <View style={{ width: 76, height: 76, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={76} height={76} style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={38} cy={38} r={r} stroke={c('var(--color-neutral-800)')} strokeWidth={7} fill="none" />
        {pct > 0 ? <Circle cx={38} cy={38} r={r} stroke={c('var(--color-accent)')} strokeWidth={7} fill="none" strokeDasharray={`${C * pct} ${C}`} /> : null}
      </Svg>
      <Glass radius={31} style={{ width: 62, height: 62, alignItems: 'center', justifyContent: 'center' }} shadow={null}>
        <View style={{ width: 62, height: 62, alignItems: 'center', justifyContent: 'center' }}><T w={500} style={{ fontSize: 18 }}>{text}</T></View>
      </Glass>
    </View>
  );
}

export default function Home({ v }) {
  const { c } = useTheme();
  const h = v.home;
  return (
    <>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: -8, marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
        {v.homeSiteChips.map((ch) => (
          <Press key={ch.label} onPress={ch.on} style={{ minHeight: 38, paddingHorizontal: 16, borderRadius: 19, flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c(ch.bg) }}>
            <Icon name="map-pin" size={15} color={ch.fg} /><T style={{ fontSize: 15, color: ch.fg }}>{ch.label}</T>
          </Press>
        ))}
      </ScrollView>

      <Hero>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
          <Ring pct={h.pct} text={h.pctText} />
          <View style={{ flex: 1, minWidth: 0 }}>
            <T style={{ fontSize: 14, color: 'var(--color-accent-300)' }}>Today's attendance</T>
            <T w={500} style={{ fontSize: 24, letterSpacing: -0.48 }}>{h.markedText}</T>
            <T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{h.leftText}</T>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          {h.counts.map((k) => (
            <View key={k.label} style={{ flex: 1, gap: 2, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, backgroundColor: fade(c('var(--color-bg)'), 60) }}>
              <T w={500} style={{ fontSize: 22 }}>{k.n}</T>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><Icon name={k.icon} fill size={13} color={k.dot} /><T numberOfLines={1} style={{ fontSize: 13, color: 'var(--color-neutral-300)' }}>{k.label}</T></View>
            </View>
          ))}
        </View>
        {h.hasUnmarked ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <View style={{ flexDirection: 'row' }}>
              {h.unmarked.map((u) => <View key={u.id} style={{ marginRight: -8 }}><Avatar size={32} ini={u.ini} bg={u.avBg} fg={u.avFg} fontSize={11} ring="var(--color-surface)" /></View>)}
            </View>
            <T style={{ flex: 1, fontSize: 14, color: 'var(--color-neutral-300)', marginLeft: 12 }}>{h.unmarkedNames}</T>
          </View>
        ) : null}
        <Btn icon="ph-fill ph-calendar-check" iconSize={21} label={h.ctaLabel} onPress={v.goAttToday} />
      </Hero>

      <View style={{ flexDirection: 'row', gap: 4 }}>
        {v.quick.map((q) => (
          <Press key={q.label} onPress={q.on} activeOpacity={0.6} style={{ flex: 1, alignItems: 'center', gap: 7, paddingVertical: 4 }}>
            <Glass radius={16} shadow="var(--shadow-sm)" style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}>
              <View style={{ width: 58, height: 58, alignItems: 'center', justifyContent: 'center' }}><Icon name={q.icon} fill size={27} color="var(--color-accent)" /></View>
            </Glass>
            <T style={{ fontSize: 12, lineHeight: 14, textAlign: 'center' }}>{q.label}</T>
          </Press>
        ))}
      </View>

      <Grid cols={2} gap={10}>
        {h.cards.map((cd) => (
          <Press key={cd.label} span={cd.span} onPress={cd.on} activeOpacity={0.7} scale={0.97}>
            <Glass style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Icon name={cd.icon} fill size={17} color="var(--color-accent)" />
                <T style={{ flex: 1, fontSize: 14, color: 'var(--color-neutral-400)' }}>{cd.label}</T>
                <Icon name="caret-right" size={14} color="var(--color-neutral-600)" />
              </View>
              <T w={500} style={{ fontSize: 27, letterSpacing: -0.54 }}>{cd.value}</T>
              <T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{cd.sub}</T>
            </Glass>
          </Press>
        ))}
      </Grid>

      <View style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', paddingHorizontal: 4 }}>
          <T w={500} style={{ flex: 1, fontSize: 20 }}>Last 7 days</T>
          <T style={{ fontSize: 15, color: 'var(--color-neutral-300)' }}>{h.weekTotal}</T>
        </View>
        <Glass style={{ paddingTop: 16, paddingHorizontal: 14, paddingBottom: 12 }}>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', height: 120 }}>
            {h.week.map((b, i) => (
              <View key={i} style={{ flex: 1, alignItems: 'center', gap: 5, height: '100%', justifyContent: 'flex-end' }}>
                <T style={{ fontSize: 11, color: 'var(--color-neutral-400)' }}>{String(b.v)}</T>
                <View style={{ width: '100%', maxWidth: 28, borderRadius: 7, height: Math.max(4, b.h), backgroundColor: c(b.bg) }} />
                <T style={{ fontSize: 12, color: b.fg }}>{b.d}</T>
              </View>
            ))}
          </View>
        </Glass>
      </View>

      <View style={{ gap: 8 }}>
        <T w={500} style={{ fontSize: 20, paddingHorizontal: 4 }}>Recent activity</T>
        <Glass>
          {v.activity.length ? v.activity.map((a, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 54 }}>
              <IconTile icon={a.icon} />
              <View style={{ flex: 1, paddingVertical: 14, borderBottomWidth: i < v.activity.length - 1 ? 1 : 0, borderBottomColor: c('var(--color-neutral-800)') }}><T style={{ fontSize: 15 }}>{a.text}</T></View>
              <T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{a.t}</T>
            </View>
          )) : <T style={{ padding: 16, fontSize: 15, color: 'var(--color-neutral-400)' }}>No activity yet. Add your first worker to get started.</T>}
        </Glass>
      </View>
    </>
  );
}
