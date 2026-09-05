# Expenze.Ly — Project & Feature Tracker

> **Last updated:** 2026-09-05
>
> This file is the single source of truth for what has been built, what is
> in progress, and what is still pending. If a session is interrupted, refer
> to this file to resume work.

---

## 1. Run the app

| Component | How to start | URL | Notes |
| --------- | ------------ | --- | ----- |
| MongoDB | Windows service `MongoDB` (port 27017) | — | Installed via `winget install --id MongoDB.Server` |
| Backend | `cd server && npm run dev` | http://localhost:5000 | nodemon; auto-reloads |
| Frontend | `cd client && npm run dev` | http://localhost:3000 | Next.js dev server |

**Demo account:** `demo@example.com` / `demo1234` (currency INR — set to
non-USD so the Currency & Market card is visible)
Current demo data: 15 expenses, 2 budgets, 1 recurring (Netflix) — seeded into
`expense_tracker` DB on `mongodb://127.0.0.1:27017`.

`client/next.config.ts` proxies `/api/*` → `http://localhost:5000/api/*`
(override via `API_PROXY_TARGET`). Dev-server logs live in
`C:\Users\MOHAMMAD KAIF\AppData\Local\Temp\opencode\next-dev*.log` and
`server-dev.log`.

---

## 2. Architecture & conventions

- **Frontend:** Next.js 16 (breaking changes — read `client/AGENTS.md` +
  `node_modules/next/dist/docs/`), React 19, TypeScript, Tailwind, recharts,
  sonner, next-themes. Routes under `client/src/app/`; UI kit in
  `client/src/components/ui/`.
- **Backend:** Node.js + Express (ESM), Mongoose, JWT + bcrypt. Routes in
  `server/src/routes/`, models in `server/src/models/`, utils in
  `server/src/utils/`.
- **Git workflow:** `main` (production) ← `develop` (integration) ←
  `feature/<name>` branches merged with `--no-ff`, then released to `main` and
  pushed. Feature commits stay in their feature branches.
- **IDs:** `server/package.json` name is `expenze-ly-server`; computed
  recurring is `server/src/utils/scheduler.js` (hourly + on boot).

---

## 3. Feature status overview

| # | Feature | Status | Branch(es) |
| - | ------- | ------ | ---------- |
| 1 | Auth (register/login/profile, JWT) | ✅ Done | feature/auth |
| 2 | App shell (sidebar, header, theme toggle, guards) | ✅ Done | feature/app-shell |
| 3 | Dashboard (stats, area chart, donut, recent, budgets) | ✅ Done | feature/dashboard |
| 4 | Expenses CRUD (filters, search, pagination) | ✅ Done | feature/expenses |
| 5 | Budgets CRUD (month nav, progress, thresholds) | ✅ Done | feature/budgets |
| 6 | Recurring (CRUD, pause/resume, process due) | ✅ Done | feature/recurring |
| 7 | Categories (chart + per-category totals) | ✅ Done | feature/categories |
| 8 | Landing page (hero, features, FAQ, mockup) | ✅ Done | feature/landing |
| 9 | Skeleton loading for app routes | ✅ Done | feature/landing |
| 10 | Settings page (name + default currency) | ✅ Done | feature/settings |
| 11 | CSV export button (honors filters) | ✅ Done | feature/export-csv |
| 12 | Recurring auto-scheduler (server, hourly) | ✅ Done | feature/recurring-scheduler |
| 13 | Server unit tests (`npm test`, 13 passing) | ✅ Done | feature/server-hardening |
| 14 | Strong JWT secret + `.env.example` | ✅ Done | feature/server-hardening |
| 15 | Rebrand app → **Expenze.Ly** | ✅ Done | feature/rebrand |
| 16 | Theme toggle – 3 modes (Light/Dark/System) w/ icons | ✅ Done | feature/rebrand |
| 17 | Currency backend: live rates + conversion + insight | ✅ Done | feature/currency |
| 18 | Currency display in preferred currency (Expenses/Budgets/Recurring/Categories) | ✅ Done | feature/currency |
| 19 | Currency display on Dashboard | ✅ Done | feature/currency |
| 20 | Currency & Market card on dashboard (rate vs USD, trend, expense-avoid + investment advice) | ✅ Done | feature/currency |
| 21 | Merge feature/currency → develop → main + release + verify | ✅ Done | feature/currency |
| 22 | Deploy backend/frontend to cloud (production) | ⏳ Pending (not requested yet) | — |

---

## 4. Feature details

### 4.1 Landing page (done, `feature/landing`)
- `client/src/app/page.tsx` is now a marketing page (hero + dashboard mockup,
  feature cards, stats band, 3-step how-it-works, FAQ accordion, CTA, footer).
- Anonymous users see it; auth happens via explicit **Sign in / Get started**.
- `client/src/app/(app)/loading.tsx` provides route-level skeleton loading.
- Old behavior (auto-redirect `/` → dashboard/login) was removed.

### 4.2 Settings (done, `feature/settings`)
- `client/src/app/(app)/settings/page.tsx`: edit **name** + **default
  currency** via `PUT /api/auth/profile`; updates auth context and localStorage
  immediately. Email is read-only.

### 4.3 CSV export (done, `feature/export-csv`)
- "Export CSV" button on the Expenses page (`client/src/app/(app)/expenses/page.tsx`).
- Hits `GET /api/dashboard/export?category=&startDate=&endDate=` (authenticated
  fetch → blob → browser download). Honors the page's active filters.

### 4.4 Recurring scheduler (done, `feature/recurring-scheduler`)
- `server/src/utils/scheduler.js` + started in `server/src/index.js`.
- Runs once on boot, then every `RECURRING_SCHEDULE_MS` (default 1 h;
  `unref`'d so it doesn't keep the process alive).
- Processes all users' due recurring items; manual `POST /api/recurring/process`
  still works.

### 4.5 Server tests + security (done, `feature/server-hardening`)
- `server/test/*.test.js` with Node's built-in runner; `npm test` (13 passing).
- `server/.env` now has a **strong random 48-byte (64-char) JWT secret**.
  ⚠️ Changing the secret invalidates existing tokens → users must re-login.
- `server/.env.example` documents all server env vars.
- `server/src/middleware/auth.js` warns at boot if `JWT_SECRET` is missing/<32 chars.
- `.env` is gitignored (not committed) — do not commit real secrets.

### 4.6 Rebrand → Expenze.Ly (done, `feature/rebrand`)
- Renamed in: root layout metadata, landing hero/footer, `(auth)` layout,
  app shell sidebar + mobile header, landing mockup URL, server root message,
  README, server package.json.
- Theme toggle now shows **Light / Dark / System** each with icon + checkmark.

### 4.7 Preferred currency + market advice (done, `feature/currency`)

**Backend (done):**
- `server/src/utils/rates.js` — fetches live rates from **Frankfurter (ECB)**
  `https://api.frankfurter.app`, cached 6 h, injectable fetch for tests.
  Exports `getRates`, `convert`, `getRateHistory`, `clearRatesCache`,
  `normalize`.
- `server/src/utils/advice.js` — `buildInsight(rate, history)` returns
  `{ strength, trend, pctChange, summary, advice, investments }`, where:
  - `trend`: `appreciating | depreciating | flat` (30-day vs USD)
  - `strength`: `strong | weak | neutral`
  - `advice`: expenses to **avoid** (weak: USD subs, imports, travel) or
    **take advantage of** (strong: USD purchases)
  - `investments`: tips (weak → inflation-protected/Rupee-cost-averaging; etc.)
- `server/src/routes/rates.js` (public, no auth):
  - `GET /api/rates` → `{ base:'USD', date, rates, currencies }`
  - `GET /api/rates/convert?amount&from&to`
  - `GET /api/rates/insight?to=INR` → rate, 30-day history, insight
- `server/test/rates.test.js` — 9 new tests (total 13 passing). Live-verified:
  `1 USD = 94.49 INR` (real ECB data).

**Frontend (done):**
- `client/src/lib/use-currency.ts` — catches preferred-currency + rate,
  `convert(usd)` and `format(usd)` helpers, 6-h cache, graceful 1:1 fallback.
- Converted display on pages: Expenses, Budgets, Recurring, Categories,
  Dashboard (stat cards, spending-trend/by-category charts, recent expenses,
  budgets, axes + tooltips).
- `client/src/components/currency-insights.tsx` — "Currency & Market" card on
  the dashboard (non-USD users only): `1 USD = ₹x`, strength badge
  (weak/strong/stable), 30-day sparkline + trend %, expense-avoid advice and
  investment tips. Offline/fallback state handled.
- Released to `main` (2026-09-05), demo account set to INR for verification.

**⚠️ Data model assumption (important):** stored expense amounts are treated as
**USD base**; the app *converts for display* to the user's preferred currency.
When a non-USD user adds an expense, it is stored as entered and treated as USD
for conversion purposes. If you want true multi-currency entry (storing the
currency per expense), that's extra work — decide before release.

---

## 5. Known limitations / notes

- Nearby real FX API needs **internet**; if offline the app falls back 1:1 and
  the insight card shows a fallback state.
- Rate history endpoint hits Frankfurter (2 calls); first call after boot is
  slow (~200–600 ms), then cached 6 h.
- After the JWT secret rotation, previously-logged-in sessions must sign in again.
- Dashboard `activeRecurringTotal` bug was fixed (compute recurring total from
  the recurring list instead of a missing Promise.all element), see commit in main.
- No CI/CD, no Docker, no deployment scripts yet. Backend serving is dev-only
  (nodemon); scheduler runs in-process (a separate worker/cron is a future step).

---

## 6. Resume here (next actions)

1. Deploy to cloud (when requested): backend + frontend to production,
   MongoDB Atlas (or managed), proper `JWT_SECRET`/envs, and scheduler as a
   standalone worker/cron (currently in-process).
2. Optional future work: true multi-currency entry (store currency per
   expense instead of treating everything as USD base).