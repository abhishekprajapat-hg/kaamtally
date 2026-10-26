// Integration tests for sign-in security: the PIN lockout, changing a PIN,
// and keeping one account's data out of another's hands.
// Needs a running MongoDB: MONGODB_TEST_URI (default mongodb://127.0.0.1:27017/kaam-hisab-test)
process.env.NODE_ENV = 'test';
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../src/app');
const { today } = require('../src/lib/dates');

const URI = process.env.MONGODB_TEST_URI || 'mongodb://127.0.0.1:27017/kaam-hisab-test';
const T = today();

const signup = (mobile, pin, name) =>
  request(app).post('/api/auth/signup').send({ mobile, pin, confirmPin: pin, name: name || 'Owner ' + mobile });
const login = (mobile, pin) => request(app).post('/api/auth/login').send({ mobile, pin });

before(async () => { process.env.NODE_ENV = 'development'; await mongoose.connect(URI); await mongoose.connection.db.dropDatabase(); });
after(async () => { await mongoose.connection.db.dropDatabase(); await mongoose.disconnect(); });

test('wrong PINs count down, then lock the account', async () => {
  const mob = '9811100001';
  assert.equal((await signup(mob, '314159')).status, 201);

  const left = [];
  for (let i = 0; i < 4; i++) {
    const r = await login(mob, '999999');
    assert.equal(r.status, 400);
    left.push(r.body.error);
  }
  assert.match(left[0], /4 tries left/);
  assert.match(left[3], /1 try left/);           // singular on the last try

  // the fifth wrong PIN locks it
  let r = await login(mob, '999999');
  assert.equal(r.status, 429);
  assert.match(r.body.error, /Too many wrong PINs/);
  assert.match(r.body.error, /\d+ minutes?/);

  // and the correct PIN is refused while locked
  r = await login(mob, '314159');
  assert.equal(r.status, 429, 'a locked account must stay locked even for the right PIN');
});

test('a successful login clears earlier failures', async () => {
  const mob = '9811100002';
  await signup(mob, '314159');
  await login(mob, '999999');
  await login(mob, '999999');                    // 2 strikes

  const ok = await login(mob, '314159');
  assert.equal(ok.status, 200);
  assert.ok(ok.body.token, 'a successful login returns a token');

  const r = await login(mob, '999999');          // counter should have reset
  assert.match(r.body.error, /4 tries left/);
});

test('the PIN never comes back from the API', async () => {
  const mob = '9811100003';
  const s = await signup(mob, '314159');
  const body = JSON.stringify(s.body);
  assert.ok(!body.includes('314159'), 'signup response must not contain the PIN');
  assert.ok(!/pinHash/.test(body), 'signup response must not contain the hash');

  const me = await request(app).get('/api/auth/me').set('authorization', 'Bearer ' + s.body.token);
  assert.equal(me.status, 200);
  assert.ok(!JSON.stringify(me.body).includes('314159'));
  assert.ok(!/pinHash/.test(JSON.stringify(me.body)));
});

test('changing a PIN is guarded, and the old PIN stops working', async () => {
  const mob = '9811100004';
  const tok = (await signup(mob, '314159')).body.token;
  const change = (b) => request(app).post('/api/auth/change-pin').set('authorization', 'Bearer ' + tok).send(b);

  let r = await change({ currentPin: '999999', newPin: '482015', confirmPin: '482015' });
  assert.equal(r.status, 400); assert.match(r.body.error, /current PIN is wrong/);

  r = await change({ currentPin: '314159', newPin: '111111', confirmPin: '111111' });
  assert.equal(r.status, 400); assert.match(r.body.error, /same digits/);

  r = await change({ currentPin: '314159', newPin: '482015', confirmPin: '482016' });
  assert.equal(r.status, 400); assert.match(r.body.error, /don't match/);

  r = await change({ currentPin: '314159', newPin: '314159', confirmPin: '314159' });
  assert.equal(r.status, 400); assert.match(r.body.error, /different from the old one/);

  r = await change({ currentPin: '314159', newPin: '482015', confirmPin: '482015' });
  assert.equal(r.status, 200);

  assert.equal((await login(mob, '314159')).status, 400, 'the old PIN must stop working');
  assert.equal((await login(mob, '482015')).status, 200, 'the new PIN must work');
});

test('requests without a valid token are refused', async () => {
  assert.equal((await request(app).get('/api/auth/me')).status, 401);
  assert.equal((await request(app).get('/api/auth/me').set('authorization', 'Bearer nonsense')).status, 401);
  assert.equal((await request(app).get('/api/bootstrap')).status, 401);
  assert.equal((await request(app).get('/api/workers').set('authorization', 'Bearer ')).status, 401);
});

test('one account cannot see or touch another account\'s data', async () => {
  const a = (await signup('9811100005', '314159')).body.token;
  const b = (await signup('9811100006', '482015')).body.token;
  const asA = (r) => r.set('authorization', 'Bearer ' + a);
  const asB = (r) => r.set('authorization', 'Bearer ' + b);

  const w = await asA(request(app).post('/api/workers'))
    .send({ name: 'A Worker', mobile: '9811100007', cat: 'majdoor', wage: '600', joined: T });
  assert.equal(w.status, 201);
  const id = w.body.worker.id;

  const boot = await asB(request(app).get('/api/bootstrap'));
  assert.equal(boot.status, 200);
  assert.equal(boot.body.workers.length, 0, "B must not see A's workers");

  const patch = await asB(request(app).patch('/api/workers/' + id))
    .send({ name: 'Hijacked', mobile: '9811100007', cat: 'majdoor', wage: '900', joined: T });
  assert.equal(patch.status, 404, "B must not be able to edit A's worker");

  const mark = await asB(request(app).put('/api/attendance/' + T)).send({ entries: [{ worker: id, s: 'P' }] });
  assert.equal(mark.status, 400, "B must not be able to mark A's worker");

  const clear = await asB(request(app).delete(`/api/attendance/${T}/${id}`));
  assert.equal(clear.status, 400, "B must not be able to clear A's attendance");

  // A's own worker is still intact and untouched
  const back = await asA(request(app).get('/api/bootstrap'));
  assert.equal(back.body.workers.length, 1);
  assert.equal(back.body.workers[0].name, 'A Worker');
});
