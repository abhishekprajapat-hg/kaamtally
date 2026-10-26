// Integration tests. Needs a running MongoDB: MONGODB_TEST_URI (default mongodb://127.0.0.1:27017/kaam-hisab-test)
process.env.NODE_ENV = 'test';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const { today, addDays } = require('../src/lib/dates');

const URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/kaam-hisab-test';
let tok, site, worker;
const T = today();
const auth = (r) => r.set('authorization', 'Bearer ' + tok);

before(async () => { process.env.NODE_ENV = 'development'; await mongoose.connect(URI); await mongoose.connection.db.dropDatabase(); });
after(async () => { await mongoose.connection.db.dropDatabase(); await mongoose.disconnect(); });

test('sign up sets a PIN and rejects weak ones', async () => {
  let r = await request(app).post('/api/auth/check').send({ mobile: '9876543210' });
  assert.equal(r.status, 200); assert.equal(r.body.registered, false); assert.equal(r.body.pinLength, 6);

  r = await request(app).post('/api/auth/signup').send({ mobile: '9876543210', name: 'Test Owner', pin: '1234' });
  assert.equal(r.status, 400); assert.match(r.body.error, /exactly 6 digits/);
  r = await request(app).post('/api/auth/signup').send({ mobile: '9876543210', name: 'Test Owner', pin: '123456' });
  assert.equal(r.status, 400); assert.match(r.body.error, /counting order/);
  r = await request(app).post('/api/auth/signup').send({ mobile: '9876543210', name: 'Test Owner', pin: '111111' });
  assert.equal(r.status, 400); assert.match(r.body.error, /same digits/);
  r = await request(app).post('/api/auth/signup').send({ mobile: '9876543210', name: 'Test Owner', pin: '482015', confirmPin: '482016' });
  assert.equal(r.status, 400); assert.match(r.body.error, /don't match/);

  r = await request(app).post('/api/auth/signup').send({ mobile: '9876543210', name: 'Test  Owner', biz: 'Test Tiles', pin: '482015', confirmPin: '482015' });
  assert.equal(r.status, 201); assert.equal(r.body.user.name, 'Test Owner'); tok = r.body.token;

  const dup = await request(app).post('/api/auth/signup').send({ mobile: '9876543210', name: 'Someone', pin: '482015' });
  assert.equal(dup.status, 400); assert.match(dup.body.error, /already registered/);
});

test('the PIN is never stored in plain text', async () => {
  const raw = await mongoose.connection.db.collection('users').findOne({ mobile: '9876543210' });
  assert.ok(raw.pinHash.startsWith('scrypt$'));
  assert.ok(!JSON.stringify(raw).includes('482015'));
});

test('login needs the right PIN, and never leaks the hash', async () => {
  let r = await request(app).post('/api/auth/login').send({ mobile: '9876543210', pin: '999999' });
  assert.equal(r.status, 400); assert.match(r.body.error, /Wrong PIN\. 4 tries left/);
  r = await request(app).post('/api/auth/login').send({ mobile: '9999999999', pin: '482015' });
  assert.equal(r.status, 400); assert.match(r.body.error, /No account/);
  r = await request(app).post('/api/auth/login').send({ mobile: '9876543210', pin: '482015' });
  assert.equal(r.status, 200); assert.ok(r.body.token); assert.equal(r.body.user.pinHash, undefined);
  // a good login clears the earlier failed attempt
  const raw = await mongoose.connection.db.collection('users').findOne({ mobile: '9876543210' });
  assert.equal(raw.failedPins, 0);
});

test('account locks after 5 wrong PINs', async () => {
  await request(app).post('/api/auth/signup').send({ mobile: '9876500002', name: 'Lock Test', pin: '482016' });
  for (let i = 0; i < 5; i++) await request(app).post('/api/auth/login').send({ mobile: '9876500002', pin: '000111' });
  const r = await request(app).post('/api/auth/login').send({ mobile: '9876500002', pin: '482016' });
  assert.equal(r.status, 429); assert.match(r.body.error, /Try again in/);
});

test('change PIN requires the current one', async () => {
  const auth2 = (q) => q.set('authorization', 'Bearer ' + tok);
  let r = await auth2(request(app).post('/api/auth/change-pin')).send({ currentPin: '000000', newPin: '715243' });
  assert.equal(r.status, 400); assert.match(r.body.error, /current PIN is wrong/);
  r = await auth2(request(app).post('/api/auth/change-pin')).send({ currentPin: '482015', newPin: '482015' });
  assert.equal(r.status, 400); assert.match(r.body.error, /different from the old one/);
  r = await auth2(request(app).post('/api/auth/change-pin')).send({ currentPin: '482015', newPin: '715243', confirmPin: '715243' });
  assert.equal(r.status, 200);
  // the old PIN stops working, the new one works
  assert.equal((await request(app).post('/api/auth/login').send({ mobile: '9876543210', pin: '482015' })).status, 400);
  const ok = await request(app).post('/api/auth/login').send({ mobile: '9876543210', pin: '715243' });
  assert.equal(ok.status, 200); tok = ok.body.token;
});

test('site and worker validation', async () => {
  let r = await auth(request(app).post('/api/sites')).send({ name: 'Alpha Site', client: 'C', address: 'Baner', start: T });
  assert.equal(r.status, 201); site = r.body.site.id;
  r = await auth(request(app).post('/api/workers')).send({ name: 'A', mobile: '123', cat: 'majdoor', wage: '50', joined: T });
  assert.equal(r.status, 400); assert.ok(r.body.fields.name && r.body.fields.mobile && r.body.fields.wage);
  r = await auth(request(app).post('/api/workers')).send({ name: 'Ramesh Yadav', mobile: '9822041736', cat: 'karigar', wage: '900', joined: addDays(T, -10), site });
  assert.equal(r.status, 201); worker = r.body.worker; assert.equal(worker.wh[0].rate, 900);
  r = await auth(request(app).post('/api/workers')).send({ name: 'Other', mobile: '9822041736', cat: 'karigar', wage: '900', joined: T });
  assert.match(r.body.fields.mobile, /already belongs/);
});

test('attendance stores the day wage; wage change re-rates from effective date', async () => {
  let r = await auth(request(app).put('/api/attendance/' + addDays(T, -3))).send({ entries: [{ worker: worker.id, s: 'P', site }] });
  assert.equal(r.status, 200); assert.equal(r.body.attendance[0].rate, 900);
  await auth(request(app).put('/api/attendance/' + addDays(T, -1))).send({ entries: [{ worker: worker.id, s: 'H', site }] });
  r = await auth(request(app).put('/api/attendance/' + addDays(T, 1))).send({ entries: [{ worker: worker.id, s: 'P', site }] });
  assert.equal(r.status, 400);
  r = await auth(request(app).put('/api/attendance/' + addDays(T, -20))).send({ entries: [{ worker: worker.id, s: 'P', site }] });
  assert.equal(r.status, 400); assert.match(r.body.error, /joined/);
  r = await auth(request(app).patch('/api/workers/' + worker.id)).send({ ...worker, wage: '1000', eff: addDays(T, -2) });
  assert.equal(r.status, 200); assert.equal(r.body.recalculated, 1);
  const rates = Object.fromEntries(r.body.attendance.map((a) => [a.date, a.rate]));
  assert.equal(rates[addDays(T, -3)], 900); assert.equal(rates[addDays(T, -1)], 1000);
});

test('transactions validate and log activity', async () => {
  let r = await auth(request(app).post('/api/transactions')).send({ wid: worker.id, type: 'advance', amount: '0', date: T });
  assert.equal(r.status, 400);
  r = await auth(request(app).post('/api/transactions')).send({ wid: worker.id, type: 'advance', amount: '1500', date: T, method: 'UPI', note: 'rent' });
  assert.equal(r.status, 201); assert.equal(r.body.transaction.amount, 1500);
  r = await auth(request(app).get('/api/bootstrap'));
  assert.equal(r.body.transactions.length, 1); assert.match(r.body.activity[0].text, /Advance ₹1,500/);
});

test('completing a site clears it as default site', async () => {
  const r = await auth(request(app).patch('/api/sites/' + site)).send({ status: 'completed' });
  assert.equal(r.body.cleared, 1);
  const b = await auth(request(app).get('/api/bootstrap'));
  assert.equal(b.body.workers[0].site, '');
});

test('a past day can be marked and cleared for one worker', async () => {
  const past = addDays(T, -4);
  // marking one worker does not disturb anyone else already marked that day
  let r = await auth(request(app).put('/api/attendance/' + past)).send({ entries: [{ worker: worker.id, s: 'H', site: '' }] });
  assert.equal(r.status, 200); assert.equal(r.body.attendance[0].s, 'H');
  r = await auth(request(app).put('/api/attendance/' + past)).send({ entries: [{ worker: worker.id, s: 'A', site: '' }] });
  assert.equal(r.status, 200); assert.equal(r.body.attendance.length, 1); assert.equal(r.body.attendance[0].s, 'A');
  r = await auth(request(app).delete('/api/attendance/' + past + '/' + worker.id));
  assert.equal(r.status, 200); assert.equal(r.body.cleared, true);
  const b = await auth(request(app).get('/api/bootstrap'));
  assert.equal(b.body.attendance.filter((a) => a.date === past).length, 0);
  // clearing a day that holds nothing is not an error
  r = await auth(request(app).delete('/api/attendance/' + past + '/' + worker.id));
  assert.equal(r.status, 200); assert.equal(r.body.cleared, false);
});

test('other accounts cannot see data', async () => {
  const r = await request(app).get('/api/bootstrap');
  assert.equal(r.status, 401);
});
