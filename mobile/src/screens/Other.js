import React from 'react';
import { View, ScrollView } from 'react-native';
import { useTheme } from '../ui/theme-context';
import { fade } from '../theme';
import { T, Press, Glass, Seg, Btn, Caption, Switch, IconTile } from '../ui/kit';
import Icon from '../ui/Icon';
import { DateField } from '../ui/overlays';
import { ListRow } from './common';

export function Sites({ v }) {
  const { c } = useTheme();
  return (
    <>
      {v.sv.list.map((s) => (
        <View key={s.id} style={{ opacity: s.op }}>
          <Glass radius={18} style={{ padding: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <IconTile icon="buildings" size={44} radius={12} iconSize={23} />
              <View style={{ flex: 1, minWidth: 0 }}><T w={500} style={{ fontSize: 18 }}>{s.name}</T><T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{s.meta}</T></View>
              <View style={{ paddingVertical: 3, paddingHorizontal: 9, borderRadius: 9, backgroundColor: c(s.tagBg) }}><T style={{ fontSize: 12, color: s.tagFg }}>{s.status}</T></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              {s.stats.map((k) => (
                <View key={k.label} style={{ flex: 1, padding: 10, borderRadius: 12, backgroundColor: c('var(--color-bg)') }}>
                  <T w={500} numberOfLines={1} style={{ fontSize: 18 }}>{String(k.n)}</T><T style={{ fontSize: 12, color: 'var(--color-neutral-400)' }}>{k.label}</T>
                </View>
              ))}
            </View>
            {s.names ? <T style={{ fontSize: 14, color: 'var(--color-neutral-300)' }}>{s.names}</T> : null}
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {s.active ? <Btn icon="calendar-check" label="Attendance" onPress={s.att} height={44} radius={12} fontSize={14} bg="transparent" /> : null}
              <Btn kind="secondary" label={s.toggleLabel} onPress={s.toggle} height={44} radius={12} fontSize={14} />
            </View>
          </Glass>
        </View>
      ))}
      {!v.sv.list.length ? <T style={{ fontSize: 15, color: 'var(--color-neutral-400)', paddingHorizontal: 4 }}>No sites yet. Add the places where your team works.</T> : null}
      <Btn icon="plus" label="Add Site" onPress={v.openSiteForm} />
    </>
  );
}

export function Reports({ v }) {
  return (
    <Glass>
      {v.rv.list.map((r, i) => (
        <ListRow key={r.k} onPress={r.on} gap={14} padV={13} last={i === v.rv.list.length - 1} lead={<IconTile icon={r.icon} size={36} radius={10} iconSize={19} />}>
          <View style={{ flex: 1 }}><T style={{ fontSize: 16 }}>{r.title}</T><T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{r.sub}</T></View>
          <Icon name="caret-right" size={16} color="var(--color-neutral-600)" />
        </ListRow>
      ))}
    </Glass>
  );
}

export function Report({ v }) {
  const { c } = useTheme();
  const rp = v.rp;
  const div = fade(c('var(--color-text)'), 8);
  return (
    <>
      {rp.usesDate ? (
        <Glass radius={14} style={{ marginTop: -8 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, minHeight: 52 }}>
            <T style={{ flex: 1 }}>Date</T><DateField value={v.rDate} onChange={v.onRDate} min={v.START} max={v.TODAY} label="Report date" />
          </View>
        </Glass>
      ) : null}
      <Glass style={{ padding: 10 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ minWidth: '100%' }}>
            <View style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: c('var(--color-divider)') }}>
              {rp.cols.map((col, i) => <T key={i} numberOfLines={1} style={{ width: i === 0 ? 150 : 96, padding: 5.6, fontSize: 11, letterSpacing: 0.88, textTransform: 'uppercase', color: 'var(--color-neutral-400)', textAlign: col.al }}>{col.v}</T>)}
            </View>
            {rp.rows.map((r, j) => (
              <View key={j} style={{ flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: div }}>
                {r.map((cell, i) => <T key={i} numberOfLines={1} style={{ width: i === 0 ? 150 : 96, padding: 5.6, fontSize: 14, textAlign: cell.al }}>{cell.v}</T>)}
              </View>
            ))}
          </View>
        </ScrollView>
        {rp.empty ? <T style={{ paddingVertical: 16, paddingHorizontal: 6, fontSize: 15, color: 'var(--color-neutral-400)' }}>Nothing to show for this period.</T> : null}
        {rp.total ? <View style={{ flexDirection: 'row', paddingTop: 12, paddingHorizontal: 8, paddingBottom: 4 }}><T w={500} style={{ flex: 1, fontSize: 17 }}>{rp.total.k}</T><T w={500} style={{ fontSize: 17 }}>{rp.total.v}</T></View> : null}
      </Glass>
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Btn icon="download-simple" label="Download CSV" onPress={rp.csv} height={52} fontSize={16} style={{ flex: 1 }} />
        <Btn kind="secondary" icon="share-network" label="Share PDF" onPress={rp.share} height={52} fontSize={16} style={{ flex: 1 }} />
      </View>
    </>
  );
}

export function More({ v }) {
  const { c } = useTheme();
  return (
    <>
      <View style={{ flexDirection: 'row', gap: 14, alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: c('var(--color-surface)') }}>
        <View style={{ width: 56, height: 56, borderRadius: 28, backgroundColor: c('var(--color-accent-800)'), alignItems: 'center', justifyContent: 'center' }}><T w={500} style={{ fontSize: 20, color: 'var(--color-accent-100)' }}>{v.me.ini}</T></View>
        <View style={{ flex: 1 }}><T w={500} style={{ fontSize: 18 }}>{v.me.biz}</T><T style={{ fontSize: 14, color: 'var(--color-neutral-400)' }}>{v.me.line}</T></View>
      </View>
      {v.moreList.map((g, gi) => (
        <Glass key={gi}>
          {g.items.map((it, i) => (
            <ListRow key={it.label} onPress={it.on} gap={14} padV={0} last={i === g.items.length - 1} lead={<IconTile icon={it.icon} bg={it.bg} fg={it.fg} iconSize={18} />}>
              <View style={{ flex: 1, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <T style={{ flex: 1, fontSize: 16 }}>{it.label}</T>
                {it.val ? <T style={{ fontSize: 15, color: 'var(--color-neutral-400)' }}>{it.val}</T> : null}
                <Icon name="caret-right" size={16} color="var(--color-neutral-600)" />
              </View>
            </ListRow>
          ))}
        </Glass>
      ))}
    </>
  );
}

function Rows({ items }) {
  const { c } = useTheme();
  return (
    <Glass style={{ paddingHorizontal: 16 }}>
      {items.map((f, i) => (
        <View key={f.k} style={{ flexDirection: 'row', minHeight: 50, alignItems: 'center', borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: c('var(--color-neutral-800)') }}>
          <T style={{ flex: 1, fontSize: 16 }}>{f.k}</T><T numberOfLines={1} style={{ fontSize: 16, color: 'var(--color-neutral-400)', maxWidth: '60%' }}>{f.v}</T>
        </View>
      ))}
    </Glass>
  );
}

export function Settings({ v }) {
  const { c } = useTheme();
  const st = v.setv;
  return (
    <>
      <View style={{ gap: 6 }}>
        <Caption>Wage calculation</Caption>
        <Rows items={st.rules} />
        <T style={{ fontSize: 13, color: 'var(--color-neutral-400)', paddingHorizontal: 16 }}>Each attendance entry saves that day's wage, so changing a wage never changes old salary.</T>
      </View>
      <View style={{ gap: 6 }}>
        <Caption>Attendance</Caption>
        <Glass style={{ paddingHorizontal: 16 }}>
          {st.toggles.map((t, i) => (
            <View key={t.label} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 60, borderBottomWidth: i < st.toggles.length - 1 ? 1 : 0, borderBottomColor: c('var(--color-neutral-800)') }}>
              <View style={{ flex: 1 }}><T style={{ fontSize: 16 }}>{t.label}</T><T style={{ fontSize: 13, color: 'var(--color-neutral-400)' }}>{t.sub}</T></View>
              <Switch on={t.on} bg={t.bg} onToggle={t.toggle} label={t.label} />
            </View>
          ))}
        </Glass>
      </View>
      <View style={{ gap: 6 }}>
        <Caption>Security</Caption>
        <Glass>
          <ListRow onPress={v.openPinForm} gap={14} padV={0} last lead={<IconTile icon="lock-key" bg="var(--color-accent-800)" fg="var(--color-accent-100)" iconSize={18} />}>
            <View style={{ flex: 1, minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <T style={{ flex: 1, fontSize: 16 }}>Change login PIN</T>
              <Icon name="caret-right" size={16} color="var(--color-neutral-600)" />
            </View>
          </ListRow>
        </Glass>
        <T style={{ fontSize: 13, color: 'var(--color-neutral-400)', paddingHorizontal: 16 }}>Your {v.pinLength}-digit PIN opens the app. Keep it private.</T>
      </View>
      <View style={{ gap: 6 }}><Caption>Appearance</Caption><Seg items={st.themes} fontSize={15} /></View>
      <View style={{ gap: 6 }}><Caption>Language</Caption><Seg items={st.langs} fontSize={15} /></View>
      <View style={{ gap: 6 }}><Caption>Business profile</Caption><Rows items={st.biz} /></View>
      <View style={{ gap: 6 }}>
        <Caption>Backup</Caption>
        <Glass style={{ padding: 16, gap: 12 }}>
          <T style={{ fontSize: 15, color: 'var(--color-neutral-300)' }}>{st.backupText}</T>
          <Btn icon="cloud-arrow-up" label="Back up & export now" onPress={v.backupAll} height={50} radius={12} fontSize={16} bg="transparent" />
        </Glass>
      </View>
      <Press onPress={v.logout}>
        <Glass radius={14} style={{ minHeight: 54, alignItems: 'center', justifyContent: 'center' }}><T style={{ fontSize: 17, color: 'var(--color-accent-300)' }}>Log out</T></Glass>
      </Press>
    </>
  );
}
