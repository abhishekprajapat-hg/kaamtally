// Wipes EVERY account in the database, then recreates the demo account.
// This is destructive and cannot be undone — it is meant for a local dev database.
require('dotenv').config();
const mongoose = require('mongoose');
const { seedDemo } = require('./seed');

const URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kaam-hisab';
const LOCAL = /^mongodb:\/\/(127\.0\.0\.1|localhost|\[::1\])(:|\/)/.test(URI);

(async () => {
  if (!LOCAL && !process.argv.includes('--force')) {
    console.error(`Refusing to wipe a database that is not local:\n  ${URI}\nIf you really mean it, re-run with --force`);
    process.exit(1);
  }
  await mongoose.connect(URI);
  const cols = await mongoose.connection.db.collections();
  let removed = 0;
  for (const col of cols) { const { deletedCount } = await col.deleteMany({}); removed += deletedCount; }
  console.log(`Cleared ${removed} documents from ${cols.length} collections in "${mongoose.connection.name}"`);

  const r = await seedDemo();
  console.log(`Demo account ready: +91 ${r.pretty} · PIN ${r.pin} · ${r.workers} workers, ${r.attendance} attendance entries, ${r.transactions} transactions`);
  console.log('Every other account is gone — sign up again, or log in with the demo number above.');
  await mongoose.disconnect();
})().catch((e) => { console.error(e); process.exit(1); });
