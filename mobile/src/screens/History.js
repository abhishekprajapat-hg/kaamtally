import React from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '../ui/theme-context';
import { T, Press, Glass, Seg, Avatar, Btn } from '../ui/kit';
import Icon from '../ui/Icon';
import { Stats, Calendar, Legend, ListRow, cellBorder } from './common';

function Circle({ on, children, op }) {
  return (
    <Press onPress={on} style={{ width: 44, height: 44, opacity: op }}>
      <Glass radius={22} style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
        <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>{children}</View>
      </Glass>
    </Press>
  );
}

export default function History({ v }) {
  const { c } = useTheme();
  const h = v.hv;
  const colW = 30;
  return (
    <>
      <Seg items={h.views} fontSize={15} style={{ marginTop: -8 }} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: -6, marginHorizontal: -16 }} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 2, gap: 8 }}>
        {h.wchips.map((ch, i) => (
          <Press key={i} onPress={ch.on} style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: c(ch.bg) }}>
            <T style={{ fontSize: 14, color: ch.fg }}>{ch.label}</T>
          </Press>
        ))}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Circle on={h.prev} op={h.prevOp}><Icon name="caret-left" size={20} color="var(--color-accent)" /></Circle>
        <View style={{ flex: 1, alignItems: 'center', minWidth: 0 }}>
          <T w={500} style={{ fontSize: 19 }}>{h.label}</T>
          <T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{h.sub}</T>
        </View>
        <Circle on={h.next} op={h.nextOp}><Icon name="caret-right" size={20} color="var(--color-accent)" /></Circle>
      </View>
      <Stats items={h.stats} ellipsis />

      {h.isDay ? (
        <>
          <Glass>
            {h.dayRows.map((r, i) => (
              <ListRow key={r.w.id} onPress={r.open} last={i === h.dayRows.length - 1} padV={11} lead={<Avatar size={42} ini={r.w.ini} bg={r.w.avBg} fg={r.w.avFg} fontSize={14} />}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <T numberOfLines={1} w={500} style={{ fontSize: 16 }}>{r.w.name}<T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}> {r.w.dup}</T></T>
                  <T numberOfLines={1} style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{r.meta}</T>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12, backgroundColor: c(r.bg) }, cellBorder(r.border, c)]}>
                    <Icon name={r.icon} fill size={13} color={r.fg} /><T w={500} style={{ fontSize: 13, color: r.fg }}>{r.label}</T>
                  </View>
                  <T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{r.amt}</T>
                </View>
              </ListRow>
            ))}
            {h.dayEmpty ? <T style={{ padding: 16, fontSize: 15, color: 'var(--color-neutral-400)' }}>No workers on this day.</T> : null}
          </Glass>
          <Btn icon="pencil-simple" label={h.dayEditLabel} onPress={h.editDay} height={52} fontSize={16} />
        </>
      ) : null}

      {h.isWeek ? (
        <Glass style={{ paddingVertical: 12, paddingHorizontal: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: c('var(--color-neutral-800)') }}>
            <T style={{ flex: 1, minWidth: 64, fontSize: 12, color: 'var(--color-neutral-400)', paddingLeft: 4 }}>Worker</T>
            {h.weekHead.map((x, i) => (
              <Press key={i} onPress={x.on} style={{ width: colW, alignItems: 'center', gap: 1, paddingVertical: 2 }}>
                <T style={{ fontSize: 11, color: x.fg }}>{x.d}</T><T w={500} style={{ fontSize: 14, color: x.fg }}>{x.n}</T>
              </Press>
            ))}
            <T style={{ width: 34, fontSize: 11, color: 'var(--color-neutral-400)', textAlign: 'right' }}>Days</T>
          </View>
          {h.weekRows.map((r) => (
            <View key={r.w.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 3, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: c('var(--color-neutral-800)') }}>
              <View style={{ flex: 1, minWidth: 64, flexDirection: 'row', alignItems: 'center', gap: 8, paddingLeft: 4 }}>
                <Avatar size={28} ini={r.w.ini} bg={r.w.avBg} fg={r.w.avFg} fontSize={11} />
                <T numberOfLines={1} style={{ flex: 1, fontSize: 14 }}>{r.short}</T>
              </View>
              {r.cells.map((x, i) => (
                <View key={i} style={{ width: colW, alignItems: 'center' }}>
                  <Press onPress={x.on} accessibilityLabel={x.aria} style={[{ width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c(x.bg), opacity: x.op }, cellBorder(x.border, c)]}>
                    <T w={600} style={{ fontSize: 13, color: x.fg }}>{x.lbl}</T>
                  </Press>
                </View>
              ))}
              <T w={500} style={{ width: 34, fontSize: 14, textAlign: 'right' }}>{r.paid}</T>
            </View>
          ))}
          <View style={{ paddingTop: 10, paddingHorizontal: 4 }}><Legend items={v.legend} extra="· Days = paid days" /></View>
        </Glass>
      ) : null}

      {h.isMonth ? (
        <Glass style={{ padding: 14 }}>
          <Calendar heads={['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']} cells={h.cal} />
          <View style={{ flexDirection: 'row', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            {h.monthLegend.map((k) => (
              <View key={k.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <View style={[{ width: 12, height: 12, borderRadius: 4, backgroundColor: c(k.bg) }, cellBorder(k.border, c)]} />
                <T style={{ fontSize: 12, color: 'var(--color-neutral-400)' }}>{k.label}</T>
              </View>
            ))}
            <T style={{ fontSize: 12, color: 'var(--color-neutral-400)' }}>· Tap a day for details</T>
          </View>
        </Glass>
      ) : null}
    </>
  );
}
