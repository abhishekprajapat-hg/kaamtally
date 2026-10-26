import React from 'react';
import { View, useWindowDimensions } from 'react-native';
import { useTheme } from '../ui/theme-context';
import { T, Press, Glass, Seg, Avatar, Btn, Input, Caption, Switch, ErrorLine, Grid, IconTile } from '../ui/kit';
import Icon from '../ui/Icon';
import { DateField, SelectField } from '../ui/overlays';
import { Hero } from './Home';
import { Stats, Calendar, Legend, ListRow, KV } from './common';

export function Workers({ v }) {
  const { c } = useTheme();
  const wd = v.wd;
  return (
    <>
      <View style={{ marginTop: -8, justifyContent: 'center' }}>
        <View style={{ position: 'absolute', left: 12, zIndex: 1 }}><Icon name="magnifying-glass" size={18} color="var(--color-neutral-400)" /></View>
        <Input placeholder="Search name or mobile" value={v.wq} onChangeText={v.onWq} returnKeyType="search" clearButtonMode="while-editing"
          style={{ minHeight: 44, paddingLeft: 38, paddingRight: 10, borderRadius: 12, backgroundColor: c('var(--color-surface)') }} />
      </View>
      <Seg items={wd.chips} />
      <Glass>
        {wd.list.map((w, i) => (
          <View key={w.id} style={{ opacity: w.op }}>
            <ListRow onPress={w.open} gap={14} last={i === wd.list.length - 1} lead={<Avatar size={46} ini={w.ini} bg={w.avBg} fg={w.avFg} fontSize={16} />}>
              <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <T w={500} style={{ fontSize: 17 }}>{w.name}</T>
                  {w.isNew ? <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, backgroundColor: c('var(--color-accent-800)') }}><T style={{ fontSize: 11, color: 'var(--color-accent-100)' }}>New</T></View> : null}
                </View>
                <T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{w.cat} · {w.wage} · {w.mobileFmt}</T>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name="map-pin" size={13} color="var(--color-neutral-500)" /><T style={{ fontSize: 13, color: 'var(--color-neutral-500)' }}>{w.site}</T></View>
              </View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}><Icon name={w.st.icon} fill size={15} color={w.st.dot} /><T style={{ fontSize: 13, color: 'var(--color-neutral-300)' }}>{w.st.label}</T></View>
              <Icon name="caret-right" size={16} color="var(--color-neutral-600)" />
            </ListRow>
          </View>
        ))}
        {wd.empty ? (
          <View style={{ paddingVertical: 36, paddingHorizontal: 16, alignItems: 'center', gap: 10 }}>
            <Icon name="magnifying-glass" size={40} color="var(--color-neutral-600)" />
            <T w={500} style={{ fontSize: 17, textAlign: 'center' }}>No worker found for "{v.wq}"</T>
            <Btn icon="user-plus" label="Add new worker" onPress={v.openAddWorker} height={46} radius={12} fontSize={14} bg="transparent" />
          </View>
        ) : null}
        {wd.none ? (
          <View style={{ paddingVertical: 36, paddingHorizontal: 16, alignItems: 'center', gap: 8 }}>
            <Icon name="users-three" size={44} color="var(--color-neutral-600)" />
            <T w={500} style={{ fontSize: 17 }}>No workers here yet</T>
            <T style={{ fontSize: 15, color: 'var(--color-neutral-400)', textAlign: 'center' }}>Add your team once — then mark attendance in a few taps every day.</T>
          </View>
        ) : null}
      </Glass>
      <Btn icon="user-plus" iconSize={20} label="Add Worker" onPress={v.openAddWorker} />
    </>
  );
}

function FRow({ label, children, last, labelW = 84, alignTop }) {
  const { c } = useTheme();
  return (
    <View style={{ flexDirection: 'row', alignItems: alignTop ? 'flex-start' : 'center', gap: 12, paddingHorizontal: 16, minHeight: 56, paddingVertical: alignTop ? 14 : 0, borderBottomWidth: last ? 0 : 1, borderBottomColor: c('var(--color-neutral-800)') }}>
      <T style={[{ fontSize: 16 }, labelW ? { width: labelW } : { flex: 1 }]}>{label}</T>
      {children}
    </View>
  );
}

export function WorkerForm({ v }) {
  const { c } = useTheme();
  const f = v.form, fh = v.fh, fv = v.fv, fe = v.ferr || {};
  return (
    <>
      <View style={{ gap: 6 }}>
        <Caption>Details</Caption>
        <Glass>
          <FRow label="Full name"><Input placeholder="e.g. Ramesh Kumar Yadav" value={f.name} onChangeText={fh.name} autoCapitalize="words" style={{ flex: 1, minWidth: 0 }} /></FRow>
          <FRow label="Mobile" last>
            <T style={{ color: 'var(--color-neutral-400)' }}>+91</T>
            <Input placeholder="10 digits" keyboardType="number-pad" inputMode="numeric" maxLength={10} value={f.mobile} onChangeText={fh.mobile} style={{ flex: 1, minWidth: 0, letterSpacing: 0.5 }} />
          </FRow>
        </Glass>
        <ErrorLine text={fe.name} />
        <ErrorLine text={fe.mobile} />
        {fv.dupWarn ? <ErrorLine text={fv.dupWarn} color="var(--color-neutral-300)" /> : null}
      </View>

      <View style={{ gap: 6 }}>
        <Caption>Type of work</Caption>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          {fv.cats.map((ct) => (
            <Press key={ct.label} onPress={ct.on} style={{ flex: 1, minHeight: 76, borderRadius: 16, justifyContent: 'center', gap: 2, paddingVertical: 12, paddingHorizontal: 14, backgroundColor: c(ct.bg), boxShadow: ct.sh ? `0 0 0 1.5px ${c('var(--color-accent)')}` : `inset 0 1px 0 ${c('var(--glass-hi)')}, inset 0 0 0 1px ${c('var(--glass-edge)')}` }}>
              <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}><Icon name={ct.ic} size={20} color={ct.fg} /><T w={500} style={{ fontSize: 17, color: ct.fg }}>{ct.label}</T></View>
              <T style={{ fontSize: 13, opacity: 0.8, color: ct.fg }}>{ct.hi}</T>
            </Press>
          ))}
        </View>
      </View>

      <View style={{ gap: 6 }}>
        <Caption>Daily wage (full day)</Caption>
        <Glass style={{ paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <T style={{ fontSize: 30, color: 'var(--color-neutral-400)' }}>₹</T>
            <Input keyboardType="number-pad" inputMode="numeric" value={f.wage} onChangeText={fh.wage} style={{ flex: 1, minWidth: 0, fontSize: 34, fontWeight: 500 }} accessibilityLabel="Daily wage" />
            <T style={{ fontSize: 15, color: 'var(--color-neutral-400)' }}>per day</T>
          </View>
          <View style={{ flexDirection: 'row', gap: 6, flexWrap: 'wrap' }}>
            {fv.wageChips.map((ch) => <Press key={ch.label} onPress={ch.on} style={{ minHeight: 36, paddingHorizontal: 14, borderRadius: 18, justifyContent: 'center', backgroundColor: c('var(--color-neutral-800)') }}><T style={{ fontSize: 15 }}>{ch.label}</T></Press>)}
          </View>
          <T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{fv.halfText}</T>
        </Glass>
        <ErrorLine text={fe.wage} />
      </View>

      {fv.wageChanged ? (
        <View style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: 16, backgroundColor: c('var(--color-accent-900)'), gap: 10 }}>
          <View style={{ flexDirection: 'row', gap: 8 }}><Icon name="info" fill size={18} color="var(--color-accent-200)" style={{ marginTop: 2 }} /><T style={{ flex: 1, fontSize: 15, color: 'var(--color-accent-200)' }}>{fv.wageMsg}</T></View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <T style={{ flex: 1, fontSize: 15 }}>New rate applies from</T>
            <DateField value={f.eff} onChange={fh.eff} min={f.joined} max={v.TODAY} label="New rate applies from" style={{ minHeight: 40, borderRadius: 10, backgroundColor: c('var(--color-surface)'), justifyContent: 'center' }} />
          </View>
        </View>
      ) : null}

      <View style={{ gap: 6 }}>
        <Caption>Work info</Caption>
        <Glass>
          <FRow label="Joining date" labelW={0}><DateField value={f.joined} onChange={fh.joined} max={v.TODAY} label="Joining date" /></FRow>
          <FRow label="Default site" labelW={0}><SelectField value={f.site} options={fv.siteOpts} onChange={fh.site} title="Default site" style={{ maxWidth: 220 }} wide={v.wide} /></FRow>
          <FRow label="Notes" last alignTop><Input placeholder="Optional — village, special skills" value={f.notes} onChangeText={fh.notes} multiline style={{ flex: 1, minWidth: 0, minHeight: 60, fontSize: 16, textAlignVertical: 'top' }} /></FRow>
        </Glass>
        {fv.midMonth ? <T style={{ fontSize: 14, color: 'var(--color-neutral-400)', paddingHorizontal: 16 }}>Joining mid-month — salary is counted from the joining date only.</T> : null}
      </View>

      {fv.isEdit ? (
        <View style={{ gap: 6 }}>
          <Glass style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 60 }}>
            <View style={{ flex: 1 }}><T style={{ fontSize: 16 }}>Active worker</T><T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{fv.act.label}</T></View>
            <Switch on={fv.act.on} bg={fv.act.bg} onToggle={fv.act.toggle} label="Active worker" />
          </Glass>
          <T style={{ fontSize: 13, color: 'var(--color-neutral-400)', paddingHorizontal: 16 }}>Turning off hides them from attendance. All past attendance and payments are kept.</T>
        </View>
      ) : null}
      <Btn icon="check" iconSize={20} label={fv.busy ? 'Saving…' : fv.saveLabel} onPress={v.saveWorker} height={56} />
    </>
  );
}

export function Profile({ v }) {
  const { c } = useTheme();
  const { width } = useWindowDimensions();
  const pf = v.pf;
  // Four buttons share the row, and "Attendance" is a long word that can't wrap.
  // Size the label to the space each button actually gets, so it never gets cut off.
  const perButton = (Math.min(width, 480) - 32 - 24) / 4 - 4;
  const actionFont = Math.max(11, Math.min(13, Math.floor(perButton / 5.4)));
  if (!pf.w.id) return null;
  return (
    <>
      <View style={{ alignItems: 'center', gap: 8, marginTop: -8 }}>
        <Avatar size={88} ini={pf.w.ini} bg={pf.w.avBg} fg={pf.w.avFg} fontSize={32} />
        <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center', flexWrap: 'wrap', justifyContent: 'center' }}>
          <T style={{ fontSize: 15, color: 'var(--color-neutral-300)' }}>{pf.w.cat} · {pf.w.wage}</T>
          {pf.w.inactive ? <View style={{ paddingVertical: 2, paddingHorizontal: 8, borderRadius: 8, backgroundColor: c('var(--color-neutral-800)') }}><T style={{ fontSize: 12, color: 'var(--color-neutral-200)' }}>Inactive</T></View> : null}
        </View>
      </View>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        {pf.actions.map((q) => (
          <Press key={q.label} onPress={q.on} activeOpacity={0.6} style={{ flex: 1 }}>
            <Glass radius={14} style={{ minHeight: 66, alignItems: 'center', justifyContent: 'center', gap: 4, paddingHorizontal: 2 }}>
              <Icon name={q.icon} fill size={22} color="var(--color-accent)" />
              <T style={{ fontSize: actionFont, color: 'var(--color-accent)', textAlign: 'center' }}>{q.label}</T>
            </Glass>
          </Press>
        ))}
      </View>
      <Seg items={pf.tabs} />

      {pf.tOverview ? (
        <Glass>
          {pf.details.map((d, i) => (
            <View key={d.k} style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, alignItems: 'center' }}>
              <Icon name={d.icon} fill size={19} color="var(--color-accent)" />
              <View style={{ flex: 1, minWidth: 0, paddingVertical: 12, borderBottomWidth: i < pf.details.length - 1 ? 1 : 0, borderBottomColor: c('var(--color-neutral-800)') }}>
                <T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{d.k}</T>
                <T style={{ fontSize: 16 }}>{d.v}</T>
                {d.sub ? <T style={{ fontSize: 13, color: 'var(--color-neutral-400)', marginTop: 2 }}>{d.sub}</T> : null}
              </View>
            </View>
          ))}
        </Glass>
      ) : null}

      {pf.tAtt ? (
        <>
          <Seg items={pf.monthChips} height={38} />
          <Stats items={pf.mcounts} nSize={24} lSize={13} />
          <Glass style={{ padding: 14 }}>
            <Calendar heads={['M', 'T', 'W', 'T', 'F', 'S', 'S']} cells={pf.cal} round minH={40} nSize={14} lSize={9} />
            <View style={{ marginTop: 12 }}><Legend items={v.legend} extra="· Tap any day to mark or change it" size={13} /></View>
          </Glass>
          <View style={{ gap: 6 }}>
            <Caption>{pf.monthLabel} earnings</Caption>
            <Glass style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
              {pf.formula.map((f, i) => <KV key={i} k={f.k} v={f.v} />)}
              <View style={{ flexDirection: 'row', paddingVertical: 12 }}><T w={500} style={{ flex: 1, fontSize: 19 }}>Total earned</T><T w={500} style={{ fontSize: 19 }}>{pf.monthEarned}</T></View>
            </Glass>
          </View>
        </>
      ) : null}

      {pf.tHisab ? (
        <>
          <Hero gap={4}>
            <T style={{ fontSize: 15, color: 'var(--color-accent-300)' }}>{pf.balLabel}</T>
            <T w={500} style={{ fontSize: 40, letterSpacing: -1.2 }}>{pf.bal}</T>
            <T style={{ fontSize: 15, color: 'var(--color-neutral-300)' }}>{pf.balNote}</T>
          </Hero>
          <Glass style={{ paddingVertical: 4, paddingHorizontal: 16 }}>
            {pf.sum.map((f, i) => <KV key={i} k={f.k} v={f.v} weight={f.wt} last={i === pf.sum.length - 1} />)}
          </Glass>
          <View style={{ gap: 6 }}>
            <Caption>Recent transactions</Caption>
            <Glass>
              {pf.recent.map((t, i) => (
                <ListRow key={i} last={i === pf.recent.length - 1} padV={11} padR={0} lead={<IconTile icon={t.icon} size={34} radius={10} iconSize={18} />}>
                  <View style={{ flex: 1, minWidth: 0 }}><T style={{ fontSize: 16 }}>{t.title}</T><T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{t.sub}</T></View>
                  <T w={500} style={{ fontSize: 16, marginRight: 16 }}>{t.amt}</T>
                </ListRow>
              ))}
              {pf.noTx ? <T style={{ fontSize: 15, color: 'var(--color-neutral-400)', padding: 16 }}>No payments or advances yet.</T> : null}
            </Glass>
          </View>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <Btn icon="hand-coins" label="Pay" onPress={pf.pay} height={52} fontSize={16} style={{ flex: 1 }} />
            <Btn kind="secondary" icon="arrow-circle-up-right" label="Give Advance" onPress={pf.adv} height={52} fontSize={16} style={{ flex: 1 }} />
          </View>
          <Btn kind="secondary" icon="receipt" label="View Full Ledger" onPress={pf.ledger} height={52} fontSize={16} />
        </>
      ) : null}
    </>
  );
}
