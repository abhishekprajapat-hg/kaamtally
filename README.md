# Kaamtally — labour attendance, wages & payments

React Native (Expo SDK 58) app built from the **Kaam Hisab v3** Claude Design file (now branded **Kaamtally**), with a Node/Express API and MongoDB.

```
Labour-app/
├─ backend/   Express 5 + Mongoose 9 API (OTP login, workers, sites, attendance, payments)
├─ mobile/    Expo / React Native app (iOS, Android, web)
└─ design/    The original design file it was built from
```

## 1. Database
Install MongoDB Community Server (or use a free MongoDB Atlas cluster) and note the connection string.

## 2. Backend
```bash
cd backend
npm install
copy .env.example .env      # macOS/Linux: cp .env.example .env
# edit .env → MONGODB_URI, JWT_SECRET
npm run seed                # optional: demo account +91 90000 12345 with sample team & hisab
npm run dev                 # API on http://localhost:4000
npm test                    # unit + integration tests (needs MongoDB running)
```

## Tests
```bash
cd backend && npm test      # 33 tests: pure helpers, auth/lockout, workers & wages, attendance
cd mobile  && npm test      # 28 tests: wage maths, date helpers, keyboard geometry
```
Backend tests use a separate database (`MONGODB_TEST_URI`, default `kaam-hisab-test`) and drop it
before and after each file, so they never touch your real data. The mobile tests are pure Node —
no simulator and no extra dependency; `mobile/test/_esm.js` compiles the app's ES modules on require
using the Babel that Expo already installs.

### Login PIN
There is no OTP and no SMS. On sign up the owner picks a **6-digit PIN**; after that, logging in is
mobile number + PIN.

- The PIN is never stored. Only a salted **scrypt** hash is kept, so a stolen database can't be read.
- Obvious PINs are refused: all the same digit (`111111`), counting order (`123456`, `654321`)
  and repeats (`123123`).
- After **5 wrong PINs** the account locks for **15 minutes**.
- The PIN can be changed in the app under **More → Wage rules → Change login PIN** (needs the current PIN).

**Forgot the PIN?** There's no self-service reset, so nobody can take over an account from the login screen.
Reset it from the backend instead:
```bash
cd backend
npm run reset-pin -- 9000012345 445566
```
The demo account from `npm run seed` is **+91 90000 12345** with PIN **314159**.
Both are set in `backend/src/seed.js` (`DEMO_MOBILE` / `DEMO_PIN`), and can be overridden
with those names in `backend/.env`. `npm run reset` empties the whole database first.

Settings in `.env`: `PIN_LENGTH`, `PIN_MAX_TRIES`, `PIN_LOCK_MINUTES`.

## 3. Mobile app
```bash
cd mobile
npm install
npx expo start
```
Scan the QR code with **Expo Go** (phone on the same Wi-Fi as your computer). The app finds the API automatically
on port 4000 of the computer running Expo. If it can't (e.g. a deployed API), create `mobile/.env` with
`EXPO_PUBLIC_API_URL=http://<your-ip>:4000/api`. Allow Node through Windows Firewall if the phone can't connect.

Press `w` to open it in a browser, `a` for an Android emulator.

## API
| Method | Path | Purpose |
|---|---|---|
| POST | /api/auth/check | `{mobile}` → `{registered}`, so the app shows the right screen |
| POST | /api/auth/signup | `{mobile, name, biz, pin, confirmPin}` → `{token, user}` |
| POST | /api/auth/login | `{mobile, pin}` → `{token, user}` |
| POST | /api/auth/change-pin | `{currentPin, newPin, confirmPin}` (signed in) |
| GET | /api/bootstrap | everything for the signed-in owner |
| PATCH | /api/me | business profile + settings (theme, Sunday off, past-date confirm, language) |
| POST/PATCH | /api/workers(/:id) | add / edit worker; wage change re-rates attendance from the effective date |
| POST/PATCH | /api/sites(/:id) | add site, mark completed / active |
| GET/PUT | /api/attendance(/:date) | read range / save a day's entries (wage stored per entry) |
| GET/POST | /api/transactions | payments, advances, extra earnings |
| GET | /api/activity | recent activity |

All routes except auth need `Authorization: Bearer <token>`; every record is scoped to its owner.

## Wage rules (same as the design)
Present = 1 day wage · Half day = 0.5 · Absent/Off = ₹0 · an advance is subtracted once, on the day it's given.
Balance = wages earned + extra − advances − payments. Each attendance entry stores that day's wage,
so changing a wage never changes old salary unless you pick an earlier "applies from" date.
