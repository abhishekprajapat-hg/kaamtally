// Integration tests for workers and wage history — the part that decides what
// people actually get paid when a rate changes mid-engagement.
process.env.NODE_ENV = 'test';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const Worker = require('../src/models/Worker');
const { today, addDays } = require('../src/lib/dates');

const URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/kaam-hisab-test';
const T = today();
let tok;
const auth = (r) => r.set('authorization', 'Bearer ' + tok);
const mkWorker = (over) => auth(request(app).post('/api/workers'))
  .send({ name: 'Wage Tester', mobile: '9822200001', cat: 'karigar', wage: '900', joined: addDays(T, -30), ...over });

before(async () => {
  process.env.NODE_ENV = 'development';
  await mongoose.connect(URI);
  await mongoose.connection.db.dropDatabase();
  tok = (await request(app).post('/api/auth/signup')
    .send({ mobile: '9822200000', pin: '314159', confirmPin: '314159', name: 'Wage Owner' })).body.token;
});
after(async () => { await mongoose.connection.db.dropDatabase(); await mongoose.disconnect(); });

test('a new worker rejects bad details', async () => {
  const bad = async (over, field) => {
    const r = await mkWorker(over);
    assert.equal(r.status, 400, JSON.stringify(over));
    assert.ok(r.body.fields && r.body.fields[field], `expected a "${field}" error for ${JSON.stringify(over)}`);
  };
  await bad({ name: 'A' }, 'name');
  await bad({ mobile: '1234567890' }, 'mobile');     // must start 6-9
  await bad({ mobile: '98222' }, 'mobile');
  await bad({ wage: '50' }, 'wage');                 // below ₹100
  await bad({ wage: '99999' }, 'wage');              // above ₹5,000
  await bad({ cat: 'engineer' }, 'cat');
  await bad({ joined: addDays(T, 1) }, 'joined');    // cannot join in the future
  await bad({ joined: 'yesterday' }, 'joined');
});

test('two workers cannot share a mobile number', async () => {
  const a = await mkWorker();
  assert.equal(a.status, 201);
  const b = await mkWorker({ name: 'Someone Else' });
  assert.equal(b.status, 400);
  assert.match(b.body.fields.mobile, /already belongs/);
  // but the same worker may keep their own number when edited
  const edit = await auth(request(app).patch('/api/workers/' + a.body.worker.id))
    .send({ name: 'Wage Tester', mobile: '9822200001', cat: 'karigar', wage: '900', joined: addDays(T, -30) });
  assert.equal(edit.status, 200);
});

test('a wage change re-rates attendance from the effective date only', async () => {
  const w = (await mkWorker({ mobile: '9822200002', wage: '900' })).body.worker;
  const days = [addDays(T, -10), addDays(T, -5), addDays(T, -1)];
  for (const d of days) {
    const r = await auth(request(app).put('/api/attendance/' + d)).send({ entries: [{ worker: w.id, s: 'P' }] });
    assert.equal(r.status, 200);
    assert.equal(r.body.attendance[0].rate, 900);
  }

  const eff = addDays(T, -5);
  const r = await auth(request(app).patch('/api/workers/' + w.id))
    .send({ name: w.name, mobile: w.mobile, cat: w.cat, wage: '1100', joined: w.joined, eff });
  assert.equal(r.status, 200);
  assert.equal(r.body.recalculated, 2, 'only the days on or after the effective date are re-rated');

  const rates = Object.fromEntries(r.body.attendance.map((a) => [a.date, a.rate]));
  assert.equal(rates[days[0]], 900, 'an earlier day keeps the old rate');
  assert.equal(rates[days[1]], 1100, 'the effective day itself takes the new rate');
  assert.equal(rates[days[2]], 1100);
});

test('wage history stays in date order after several changes', async () => {
  const w = (await mkWorker({ mobile: '9822200003', wage: '600', joined: addDays(T, -60) })).body.worker;
  const edit = (wage, eff) => auth(request(app).patch('/api/workers/' + w.id))
    .send({ name: w.name, mobile: w.mobile, cat: w.cat, wage: String(wage), joined: w.joined, eff });

  await edit(700, addDays(T, -40));
  await edit(800, addDays(T, -20));
  const last = await edit(900, addDays(T, -5));
  const wh = last.body.worker.wh;

  const sorted = [...wh].sort((a, b) => (a.from < b.from ? -1 : 1));
  assert.deepEqual(wh, sorted, 'the app reads wage history in order — it must be stored that way');
  assert.deepEqual(wh.map((h) => h.rate), [600, 700, 800, 900]);
});

test('a future or pre-joining effective date is pulled back into range', async () => {
  const joined = addDays(T, -10);
  const w = (await mkWorker({ mobile: '9822200004', wage: '600', joined })).body.worker;
  const edit = (wage, eff) => auth(request(app).patch('/api/workers/' + w.id))
    .send({ name: w.name, mobile: w.mobile, cat: w.cat, wage: String(wage), joined, eff });

  const future = await edit(700, addDays(T, 30));
  assert.equal(future.body.worker.wh.at(-1).from, T, 'a future raise starts today, not later');

  const early = await edit(800, addDays(T, -90));
  assert.equal(early.body.worker.wh.at(-1).from, joined, 'a raise cannot predate the joining day');
});

test('marking someone outside their time at work is refused', async () => {
  const joined = addDays(T, -10);
  const w = (await mkWorker({ mobile: '9822200005', joined })).body.worker;

  let r = await auth(request(app).put('/api/attendance/' + addDays(T, -20))).send({ entries: [{ worker: w.id, s: 'P' }] });
  assert.equal(r.status, 400); assert.match(r.body.error, /joined/);

  r = await auth(request(app).put('/api/attendance/' + addDays(T, 1))).send({ entries: [{ worker: w.id, s: 'P' }] });
  assert.equal(r.status, 400); assert.match(r.body.error, /today or earlier/);

  // Marking someone inactive records today as their last day, and their last
  // day still counts as worked.
  await auth(request(app).patch('/api/workers/' + w.id))
    .send({ name: w.name, mobile: w.mobile, cat: w.cat, wage: '900', joined, active: false });
  r = await auth(request(app).put('/api/attendance/' + T)).send({ entries: [{ worker: w.id, s: 'P' }] });
  assert.equal(r.status, 200, 'the day someone leaves is still a working day');

  // Once that last day is in the past, later days are refused.
  await Worker.updateOne({ _id: w.id }, { $set: { left: addDays(T, -2) } });
  r = await auth(request(app).put('/api/attendance/' + T)).send({ entries: [{ worker: w.id, s: 'P' }] });
  assert.equal(r.status, 400); assert.match(r.body.error, /left/);
});
