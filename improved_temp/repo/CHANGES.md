# Changes in this pass

This documents everything changed from the original repo, why, and what's
still open. Written to be read by the project owner, not just skimmed.

## How to use this

I don't have push access to your GitHub or your Vercel project, so this
wasn't deployed for you. The whole repo (this working copy, with every
change below already applied and verified) is in the zip. To ship it:

```bash
# from a fresh clone of your real repo
git checkout -b redesign-and-features
# copy every file from this zip over your working tree, then:
git add -A
git commit -m "Landing page redesign, real-time queue, symptom checker, audit log, tests"
git push origin redesign-and-features
# open a PR, review the diff, merge
```
Then set any new environment variables you want on Vercel/Render (all
optional, see "Environment variables" below) and redeploy as usual —
`npm run build` still runs migrations automatically, so the new
`audit_logs` table will be created on first deploy.

---

## 1. The landing page (the thing that got called "vibe coded")

Rebuilt from scratch with an actual design point of view instead of the
generic glassmorphism-and-fake-stats template:

- **Removed fabricated trust signals** — "Voted #1 Healthcare Platform
  2026" and "4.9/5 rating from 10,000+ patients" were hardcoded strings
  with no data behind them. Gone.
- **New visual identity**: a "queue ticket stub" motif (perforated edge,
  tabular mono numerals, a live-looking "Now Serving" card) instead of a
  stock AI-generated hospital photo. It's literally the one thing this
  product does — show someone their place in line — so the hero shows
  that, not a building.
- **Fixed a broken nav link** — `#reviews` pointed at a testimonials
  section that was never built. Replaced with an honest "built for every
  role" section describing the real RBAC roles that actually exist.
- **Consistent iconography** — replaced emoji service icons with a shared
  `specialistIcons.js` map (lucide-react) used by the landing page, the
  symptom checker, and available for the doctors directory.
- **Real type system** — Fraunces (display) + Inter (body) + JetBrains
  Mono (queue numbers), replacing an unused `Playfair Display` import and
  a generic Inter+Outfit pairing.
- **The rest of the app (17 internal pages) was deliberately left alone.**
  Re-skinning every dashboard/form/modal to match was a much bigger,
  separate project than this pass, and risked breaking working screens
  for no real benefit — nobody complained the *admin dashboard* looked
  templated. I kept the old color tokens and `glass-panel`/`btn-premium`
  utility classes working as a compatibility layer
  (`tailwind.config.js`, `index.css`) so those 17 pages render exactly as
  before. If you want the new identity extended further, that's a good
  next step.

## 2. Real-time queue updates (Socket.io)

Previously "real-time" meant 3–5 second polling. Added actual push
updates via Socket.io — **with an important caveat I want to be upfront
about**: your backend's `server.js` only calls `.listen()` outside of
Vercel's production path; on Vercel it's exported as a serverless
function handler. WebSockets need a long-lived connection to one server
process, which a serverless function fundamentally can't provide.

So: `backend/src/realtime/socket.js` only initializes when the backend
runs as a persistent process (Render, Docker, a VPS, or `npm run dev`
locally). On your current Vercel deployment, `initSocket()` is simply
never called, and the app keeps working exactly as it did — the existing
polling in `usePolling.js` is untouched, and the new
`useQueueSocket.js` hook is layered on top of it (not a replacement): it
tries to connect, triggers an instant refetch when a real event arrives,
and silently does nothing if it can't connect. Nothing breaks either way.

If you want real push updates on your actual deployment, the backend
needs to run somewhere persistent (Render's free tier works fine for
this) rather than as a Vercel function.

## 3. The "AI Symptom Checker" — it didn't exist

This was the single biggest gap I found. `frontend/src/utils/symptomEngine.js`
was a complete, reasonably well-built keyword-matching engine — 325 lines
— and it was **never imported by any component in the app**. It was
advertised in the README and had zero UI surface.

Fixed properly, not just patched:
- Ported the matching logic to the backend as the canonical implementation
  (`backend/src/modules/symptom-checker/keywordMatcher.js`).
- Added an optional real LLM path (`symptomChecker.service.js`): if
  `ANTHROPIC_API_KEY` is set, it asks a real model for structured triage
  JSON (validated before use, 8s timeout); if not set, or the call fails
  for any reason, it falls back to the keyword matcher. Every response
  includes `source: 'ai' | 'keyword'` so the UI can be honest about which
  one answered.
- Built an actual `SymptomCheckerWidget.jsx` — a floating widget, mounted
  globally in `App.jsx` — that calls this endpoint, and falls back to the
  original frontend keyword engine only if the network call itself fails
  (so it's no longer dead code — it's a genuine offline fallback now).
- Updated the README to describe what this actually is, instead of just
  saying "AI Symptom Checker."

### A real bug found while doing this

Writing a test for the matcher (`"severe chest pain and cannot breathe"`)
surfaced that it was returning **Orthopedic**, not Cardiologist. The
fuzzy-match reverse-check let the generic word "pain" false-match against
*every* unrelated keyword phrase containing "pain" — "joint pain", "knee
pain", "back pain", etc. — which piled up 10 weak matches for Orthopedic
against 1 correct exact match ("chest pain") for Cardiologist, so
Orthopedic won on raw count. For a symptom-routing feature, misrouting an
emergency chest-pain description is a serious accuracy bug, not a
cosmetic one.

Fixed in both copies of the logic (backend canonical +
frontend offline fallback): the reverse partial-typing check now only
applies to single-word keywords, where it was actually intended to catch
things like "arthrit" → "arthritis". A regression test guards this in
both the Jest and Vitest suites.

## 4. Doctor scheduling — backend existed, frontend didn't

`doctor_schedules` (migration `007`) and the full `GET`/`PUT
/doctors/:id/schedule` API already existed and worked. No frontend ever
called it — a doctor had no way to set their own hours. Added
`ScheduleEditor.jsx`, wired into `DoctorProfilePage.jsx`.

## 5. Admin analytics — now actual charts

`Dashboard.jsx`'s admin view only ever rendered static numbers. Added
`AdminAnalyticsCharts.jsx` (Recharts): patients-seen-today per doctor,
and current queue load per doctor. Reuses data the page already fetches
— no additional API calls.

## 6. Audit logging for EMR/prescription access

New migration `015_create_audit_logs.sql`, `modules/audit/` (service +
middleware), mounted on every `/api/v1/emr/*` route. Logs who accessed
what, when, from where, fire-and-forget (a logging hiccup never blocks
the real request). New admin endpoint `GET /api/v1/admin/audit-logs` to
review it. This is standard practice for anything touching health
records and the app had none before.

## 7. Notification service — was a pure mock, now real-if-configured

`notificationService.js` only ever `console.log`'d — email/SMS were
never actually sendable, even in production, even with real credentials.
Rewritten to call Resend (email) / Twilio (SMS) over plain HTTP when
`RESEND_API_KEY`/`TWILIO_*` env vars are set, and fall back to logging
only when they aren't. Same function signatures, so nothing else needed
to change.

## 8. Repo hygiene

- Removed a stray 1.2MB `Hospital-Management-System-updated1.zip`
  committed to the repo root.
- Removed `RazorpayMockModal.jsx` — dead code left over after the real
  Razorpay Checkout integration replaced it (it wasn't even exported from
  the components index).
- `npm audit fix` on the frontend: 11 vulnerabilities → 4 (axios SSRF/
  prototype-pollution CVEs, PostCSS XSS, form-data, picomatch — all fixed
  without breaking changes). The remaining 4 need a react-router major
  version bump, which needs real regression testing before I'd want to
  push it in an unsupervised pass — flagging it rather than force-pushing
  blindly.

## 9. Performance: route-based code splitting

`AppRouter.jsx` eagerly imported every page (including `jsPDF` and
`html2canvas`, pulled in by the prescription-PDF page) into one bundle —
948KB, before a single user had even logged in. Converted every
authenticated route to `React.lazy()`. Main entry bundle: **948KB → 387KB**;
the rest loads per-route, on demand.

## 10. Tests (there were none)

- Backend: Jest + Supertest, 30 tests — `appointment.validation`,
  `doctor.validation`, the symptom-checker matcher, and an HTTP-level
  test of the `/symptom-checker` endpoint. `npm test` in `backend/`.
- Frontend: Vitest + React Testing Library, 7 tests — the symptom engine
  and the specialist icon map. `npm test` in `frontend/`.
- Two real bugs (see §3 and below) were caught by writing these, not
  invented for demonstration.

### Second bug found via tests

`parseDate()` (duplicated in both `appointment.validation.js` and
`doctor.validation.js`) accepted `2026-02-30` as valid. JavaScript
silently rolls invalid calendar dates over (`new Date('2026-02-30')`
becomes March 2) instead of producing an invalid `Date`, so the
`isNaN(getTime())` check never caught it. Fixed in both files by
verifying the constructed date's year/month/day round-trip matches the
input; added a regression test.

## 11. CI

`.github/workflows/ci.yml` — runs backend Jest and frontend Vitest +
build on every push/PR to `main`/`master`. There was no CI before.

---

## Environment variables (all new ones are optional)

Every new feature degrades gracefully if its env var isn't set — nothing
here is required for the app to keep working exactly as it did before.

| Variable | Enables | Falls back to |
|---|---|---|
| `ANTHROPIC_API_KEY` | Real LLM symptom triage | Keyword matcher |
| `RESEND_API_KEY` + `NOTIFICATION_FROM_EMAIL` | Real email sending | Console log |
| `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` / `TWILIO_FROM_NUMBER` | Real SMS sending | Console log |
| *(none — automatic)* | Socket.io real-time push | Only works on a persistent server process, not Vercel serverless; polling covers the gap either way |

---

## What I did NOT do (explicitly out of scope for this pass)

- **Full visual re-skin of the 17 internal app pages** (dashboards, queue
  tools, admin forms/modals). See §1 — kept working via a compatibility
  CSS layer, but they still use the original design language.
- **zod/schema-based validation refactor.** The hand-rolled validators
  work correctly (and are now tested), but a schema library would reduce
  boilerplate across modules. Worth doing as a follow-up, module by
  module.
- **react-router major version bump** to close the last 4 audit findings
  — needs its own regression pass given how central routing is to the
  app.
- **i18n / multi-language support** — flagged as a possible feature in
  the original review, didn't fit in scope here.
- Doctor availability isn't yet cross-checked against appointment booking
  at the UI level (the backend validation exists in
  `appointment.validation.js`, but I didn't audit whether the booking
  form respects it against the newly-editable schedule end-to-end).
