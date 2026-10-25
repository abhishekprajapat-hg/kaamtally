import { Platform } from 'react-native';
import * as Sharing from 'expo-sharing';
import * as Print from 'expo-print';
import { File, Paths } from 'expo-file-system';

// Save a CSV and open the share sheet (WhatsApp, Drive, Files…). On web it downloads.
export async function shareCsv(name, rows) {
  const csv = '﻿' + rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  if (Platform.OS === 'web') {
    const b = new Blob([csv], { type: 'text/csv' }); const a = document.createElement('a');
    a.href = URL.createObjectURL(b); a.download = name + '.csv'; document.body.appendChild(a); a.click(); a.remove(); return;
  }
  const f = new File(Paths.cache, name + '.csv');
  if (f.exists) f.delete();
  f.create();
  await f.write(csv);
  await Sharing.shareAsync(f.uri, { mimeType: 'text/csv', dialogTitle: name, UTI: 'public.comma-separated-values-text' });
}

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
// Render a report table to PDF and share it.
export async function sharePdf(title, sub, cols, rows, total) {
  const html = `<html><head><meta name="viewport" content="width=device-width"><style>
  body{font-family:-apple-system,Roboto,Helvetica,sans-serif;color:#16171d;padding:24px}
  h1{font-size:22px;margin:0 0 4px;font-weight:600}.sub{color:#6b6e7b;margin-bottom:18px}
  table{width:100%;border-collapse:collapse;font-size:12px}th{text-align:left;color:#6b6e7b;font-weight:500;text-transform:uppercase;letter-spacing:.06em;font-size:10px;border-bottom:1px solid #ddd;padding:6px}
  td{padding:7px 6px;border-bottom:1px solid #eee}.r{text-align:right}.tot{display:flex;justify-content:space-between;font-weight:600;font-size:15px;margin-top:14px}
  .brand{color:#6656c9;font-weight:600;margin-bottom:12px}</style></head><body>
  <div class="brand">Kaamtally</div><h1>${esc(title)}</h1><div class="sub">${esc(sub)}</div>
  <table><thead><tr>${cols.map((c) => `<th class="${c.al === 'right' ? 'r' : ''}">${esc(c.v)}</th>`).join('')}</tr></thead>
  <tbody>${rows.map((r) => `<tr>${r.map((c) => `<td class="${c.al === 'right' ? 'r' : ''}">${esc(c.v)}</td>`).join('')}</tr>`).join('')}</tbody></table>
  ${total ? `<div class="tot"><span>${esc(total.k)}</span><span>${esc(total.v)}</span></div>` : ''}</body></html>`;
  if (Platform.OS === 'web') { await Print.printAsync({ html }); return; }
  const { uri } = await Print.printToFileAsync({ html });
  await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: title, UTI: 'com.adobe.pdf' });
}
