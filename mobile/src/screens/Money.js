import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../ui/theme-context';
import { fade } from '../theme';
import { T, Press, Glass, Seg, Avatar, Btn, Input, Caption, ErrorLine, Grid } from '../ui/kit';
import Icon from '../ui/Icon';
import { DateField, SelectField } from '../ui/overlays';
import { Hero } from './Home';
import { Stats, ListRow, KV } from './common';

export function PeriodPicker({ v }) {
  const { c } = useTheme();
  return (
    <View style={{ gap: 10, marginTop: -8 }}>
      <Seg items={v.periodChips} />
      {v.isCustom ? (
        <Glass radius={14}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52, borderBottomWidth: 1, borderBottomColor: c('var(--color-neutral-800)') }}>
            <T style={{ flex: 1 }}>From</T><DateField value={v.cFrom} onChange={v.onCFrom} min={v.START} max={v.TODAY} label="From" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52 }}>
            <T style={{ flex: 1 }}>To</T><DateField value={v.cTo} onChange={v.onCTo} min={v.START} max={v.TODAY} label="To" />
          </View>
        </Glass>
      ) : null}
    </View>
  );
}

export function Salary({ v }) {
  const { c } = useTheme();
  const hs = v.hs;
  return (
    <>
      <Hero gap={2}>
        <T style={{ fontSize: 15, color: 'var(--color-accent-300)' }}>{hs.closeLabel}</T>
        <T w={500} style={{ fontSize: 40, letterSpacing: -1.2 }}>{hs.close}</T>
        <View style={{ marginTop: 12 }}>
          {hs.lines.map((f, i) => (
            <View key={i} style={{ flexDirection: 'row', paddingVertical: 8, borderTopWidth: 1, borderTopColor: fade(c('var(--color-text)'), 8) }}>
              <T style={{ flex: 1, fontSize: 15, color: 'var(--color-neutral-300)' }}>{f.k}</T><T style={{ fontSize: 15 }}>{f.v}</T>
            </View>
          ))}
        </View>
      </Hero>
      <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 4 }}>
        <Icon name="info" fill size={18} color="var(--color-accent)" />
        <T style={{ flex: 1, fontSize: 14, color: 'var(--color-neutral-400)' }}>An advance is subtracted from the balance on the day it's given — it is never deducted again. A minus balance means the worker still owes the advance.</T>
      </View>
      <View style={{ gap: 6 }}>
        <Caption>By worker</Caption>
        <Glass>
          {hs.rows.map((r, i) => (
            <ListRow key={r.w.id} onPress={r.open} last={i === hs.rows.length - 1} padR={12} gap={12} lead={<Avatar size={42} ini={r.w.ini} bg={r.w.avBg} fg={r.w.avFg} fontSize={14} />}>
              <View style={{ flex: 1, minWidth: 0 }}>
                <T numberOfLines={1} w={500} style={{ fontSize: 16 }}>{r.w.name}<T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}> {r.w.dup}</T></T>
                <T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{r.sub}</T>
              </View>
              <View style={{ alignItems: 'flex-end' }}><T w={500} style={{ fontSize: 17 }}>{r.bal}</T><T style={{ fontSize: 12, color: r.lfg }}>{r.lbl}</T></View>
              <Icon name="caret-right" size={16} color="var(--color-neutral-600)" />
            </ListRow>
          ))}
          {!hs.rows.length ? <T style={{ padding: 16, fontSize: 15, color: 'var(--color-neutral-400)' }}>No workers yet.</T> : null}
        </Glass>
      </View>
    </>
  );
}

export function Ledger({ v }) {
  const { c } = useTheme();
  const lg = v.lg;
  if (!lg.rows) return null;
  const line = { borderBottomWidth: 1, borderBottomColor: c('var(--color-neutral-800)') };
  return (
    <>
      <Stats items={lg.stats} nSize={21} lSize={13} />
      <Glass>
        <View style={[{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 16 }, line]}>
          <T style={{ width: 52, fontSize: 13, color: 'var(--color-neutral-400)' }}>{lg.openDate}</T>
          <T style={{ flex: 1, fontSize: 15 }}>Opening balance</T>
          <T w={500} style={{ fontSize: 16 }}>{lg.open}</T>
        </View>
        {lg.rows.map((r, i) => (
          <View key={i} style={[{ flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'flex-start' }, line]}>
            <T style={{ width: 52, fontSize: 13, color: 'var(--color-neutral-400)', paddingTop: 3 }}>{r.d}</T>
            <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
              <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}><Icon name={r.icon} fill size={15} color={r.ifg} /><T style={{ fontSize: 15 }}>{r.desc}</T></View>
              {r.sub ? <T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{r.sub}</T> : null}
            </View>
            <View style={{ alignItems: 'flex-end', gap: 2 }}>
              <T w={500} style={{ fontSize: 16, color: r.afg }}>{r.amt}</T>
              <T style={{ fontSize: 12, color: 'var(--color-neutral-400)' }}>{r.bal}</T>
            </View>
          </View>
        ))}
        {lg.empty ? <T style={{ padding: 16, fontSize: 15, color: 'var(--color-neutral-400)' }}>No entries in this period.</T> : null}
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 16, backgroundColor: c('var(--color-neutral-900)') }}>
          <T w={500} style={{ flex: 1, fontSize: 16 }}>{lg.closeLabel}</T><T w={500} style={{ fontSize: 20 }}>{lg.close}</T>
        </View>
      </Glass>
      <Grid cols={2} gap={10}>
        <Btn icon="hand-coins" label="Pay" onPress={lg.pay} height={52} fontSize={16} />
        <Btn kind="secondary" icon="arrow-circle-up-right" label="Give Advance" onPress={lg.adv} height={52} fontSize={16} />
        <Btn kind="secondary" icon="plus-circle" label="Extra Earning" onPress={lg.extra} height={52} fontSize={16} />
        <Btn kind="secondary" icon="calendar-blank" label="Attendance" onPress={lg.att} height={52} fontSize={16} />
      </Grid>
    </>
  );
}

export function TxForm({ v }) {
  const { c } = useTheme();
  const t = v.tx, tv = v.tv, th = v.th, te = v.txErr || {};
  return (
    <>
      <Seg items={tv.types} style={{ marginTop: -8 }} />
      <View style={{ gap: 6 }}>
        <Glass>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56, borderBottomWidth: 1, borderBottomColor: c('var(--color-neutral-800)') }}>
            <T style={{ fontSize: 16 }}>Worker</T>
            <SelectField value={t.wid} options={tv.wOpts} onChange={th.wid} title="Choose worker" style={{ flex: 1 }} wide={v.wide} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 52 }}>
            <T style={{ flex: 1, fontSize: 16, color: 'var(--color-neutral-400)' }}>Current balance</T>
            <T w={500} style={{ fontSize: 17 }}>{tv.bal}</T>
            <T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{tv.balLbl}</T>
          </View>
        </Glass>
        <ErrorLine text={te.wid} />
      </View>
      <View style={{ gap: 6 }}>
        <Glass style={{ paddingVertical: 18, paddingHorizontal: 16, alignItems: 'center', gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, width: '100%' }}>
            <T style={{ fontSize: 40, color: 'var(--color-neutral-400)' }}>₹</T>
            <Input accessibilityLabel="Amount" keyboardType="number-pad" inputMode="numeric" placeholder="0" value={t.amount} onChangeText={th.amount}
              style={{ flexShrink: 1, minWidth: 60, maxWidth: 240, fontSize: 48, fontWeight: 500, letterSpacing: -1.44, textAlign: 'center' }} />
          </View>
          <T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{tv.amtWords}</T>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap', justifyContent: 'center' }}>
            {tv.chips.map((ch) => <Press key={ch.label} onPress={ch.on} style={{ minHeight: 38, paddingHorizontal: 14, borderRadius: 19, justifyContent: 'center', backgroundColor: c('var(--color-neutral-800)') }}><T style={{ fontSize: 15 }}>{ch.label}</T></Press>)}
          </View>
        </Glass>
        <ErrorLine text={te.amount} />
        {tv.warn ? (
          <View style={{ flexDirection: 'row', gap: 8, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c('var(--color-accent-900)') }}>
            <Icon name="warning" fill size={17} color="var(--color-accent-200)" /><T style={{ flex: 1, fontSize: 14, color: 'var(--color-accent-200)' }}>{tv.warn}</T>
          </View>
        ) : null}
      </View>
      {tv.showMethod ? (
        <View style={{ gap: 6 }}>
          <Caption>Paid by</Caption>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {tv.methods.map((m) => (
              <Press key={m.label} onPress={m.on} style={{ flex: 1, minHeight: 66, borderRadius: 14, alignItems: 'center', justifyContent: 'center', gap: 4, backgroundColor: c(m.bg), boxShadow: m.sh ? `0 0 0 1.5px ${c('var(--color-accent)')}` : `inset 0 1px 0 ${c('var(--glass-hi)')}, inset 0 0 0 1px ${c('var(--glass-edge)')}` }}>
                <Icon name={m.icon} fill size={22} color={m.fg} /><T style={{ fontSize: 13, color: m.fg }}>{m.label}</T>
              </Press>
            ))}
          </View>
        </View>
      ) : null}
      <View style={{ gap: 6 }}>
        <Glass>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56, borderBottomWidth: 1, borderBottomColor: c('var(--color-neutral-800)') }}>
            <T style={{ flex: 1, fontSize: 16 }}>Date</T><DateField value={t.date} onChange={th.date} min={v.START} max={v.TODAY} label="Date" />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 56 }}>
            <T style={{ fontSize: 16 }}>Note</T>
            <Input placeholder={tv.notePh} value={t.note} onChangeText={th.note} style={{ flex: 1, minWidth: 0, fontSize: 16, textAlign: 'right' }} />
          </View>
        </Glass>
        <ErrorLine text={te.date} />
      </View>
      {tv.hasPreview ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 4 }}>
          <T style={{ flex: 1, fontSize: 16, color: 'var(--color-neutral-300)' }}>Balance after saving</T>
          <T w={600} style={{ fontSize: 18 }}>{tv.newBal}</T>
        </View>
      ) : null}
      <Btn icon="check" iconSize={20} label={tv.busy ? 'Saving…' : tv.cta} onPress={v.submitTx} height={56} />
    </>
  );
}
