# Hospital Queue Management — Design Discussion & Final Architecture

## Simulated Discussion: AI Engineer A (System Architect) vs AI Engineer B (Product Engineer)

---

### 1. How to represent queues in the database

**Engineer A (System Architect):** We need a normalized, scalable model. Each queue position is a row: one table `queue_tokens` with (doctor_id, patient_id, token_number, queue_date, status). Token number is scoped per doctor per day (1, 2, 3…). A second table `doctor_daily_queue` tracks per-doctor-per-day state: `current_token_number` (which token is being served) and `last_token_number` (next number to assign), so we can atomically generate tokens and let staff advance the “current” token without touching every row.

**Engineer B (Product Engineer):** Staff and patients need to see “current token” and “upcoming tokens” quickly. So we need fast reads by (doctor_id, queue_date) with order by token_number. Indexes on (doctor_id, queue_date) and (doctor_id, queue_date, status) will keep list and “current queue” queries fast. Status should reflect reality: waiting → called → serving → completed (and cancelled for no-shows).

**Agreed:** Two tables: `queue_tokens` (one row per patient in queue; token_number unique per doctor per day) and `doctor_daily_queue` (doctor_id, queue_date, current_token_number, last_token_number). Status in queue_tokens: waiting | called | serving | completed | cancelled.

---

### 2. How tokens should be generated

**Engineer A:** Token numbers must be unique per (doctor_id, queue_date) and generated without race conditions. Use `doctor_daily_queue.last_token_number`: in a single transaction, increment it (via UPDATE … RETURNING or UPSERT) to get the next number, then INSERT into queue_tokens. That avoids two patients getting the same token number under concurrency.

**Engineer B:** From a UX perspective, token numbers should be simple integers (1, 2, 3…) so they’re easy to call and display. No need for a global UUID as the “token” for display; the integer is the token. We can still use UUID as primary key for queue_tokens for references.

**Agreed:** Token number = integer, per (doctor_id, queue_date). Generate by atomically incrementing `doctor_daily_queue.last_token_number` (with INSERT … ON CONFLICT DO UPDATE for first token of the day), then INSERT into queue_tokens. Return token_number (and queue_date, doctor_id, status) to the client.

---

### 3. How doctor-wise queues will work

**Engineer A:** Every list and counter is scoped by doctor_id and queue_date. “Get current queue for doctor” = list queue_tokens for that doctor and date with status in (waiting, called, serving), ordered by token_number. “Current token” display = doctor_daily_queue.current_token_number for that doctor and date.

**Engineer B:** Real-time feel: when staff “calls next”, we only update doctor_daily_queue.current_token_number (and optionally mark the previous token as completed). Clients can poll GET /queue/doctors/:doctorId?date= today to refresh the list and current token. No need for WebSockets in v1; polling every few seconds is acceptable.

**Agreed:** All queue operations are (doctor_id, queue_date)-scoped. Current token is stored in doctor_daily_queue; list of tokens comes from queue_tokens. Date defaults to “today” in server timezone (or passed as query param).

---

### 4. How waiting time can be estimated

**Engineer A:** Estimate = (number of people ahead) × (average consultation time). “People ahead” = count of queue_tokens for same doctor/date with token_number < this token and status not in (completed, cancelled). We can use a config constant (e.g. 10 minutes per patient) or a column per doctor later. Keep it simple: one constant for now.

**Engineer B:** Show estimate in minutes so patients know whether to stay or come back. If current_token_number is 3 and my token is 7, there are 3 people ahead (tokens 4, 5, 6 in waiting state). So position_ahead = current_token_number - token_number when token_number > current_token_number? No: “ahead” = tokens with token_number less than mine that are still “active”. Simpler: “position in line” = count of tokens with token_number < my token_number and status = 'waiting'. Then estimated_minutes = position_in_line * AVG_MINUTES. Or we use current_token_number: people_ahead = max(0, my_token_number - current_token_number - 1) if we assume everyone below current is done. So estimated_wait = (my_token_number - current_token_number - 1) * 10 minutes.

**Agreed:** estimated_wait_minutes = max(0, (token_number - current_token_number - 1)) * DEFAULT_AVG_CONSULTATION_MINUTES. If token_number <= current_token_number, estimate 0 (already being served or passed). Use a constant (e.g. 10) in code; can move to config or DB later.

---

### 5. How hospital staff updates the current token

**Engineer A:** Only staff (admin, reception, or the doctor) should update current token. Single endpoint: PATCH /queue/doctors/:doctorId/current with body { currentTokenNumber } and optional queue_date (default today). Implementation: UPDATE doctor_daily_queue SET current_token_number = $1, updated_at = NOW() WHERE doctor_id = $2 AND queue_date = $3. Ensure row exists (create with current_token_number = 0, last_token_number = 0 if not).

**Engineer B:** “Call next” could be a shortcut: increment current_token_number by 1. But allowing staff to set any number (e.g. “call token 15”) supports skip/correct. So one endpoint that sets current_token_number to a given value is enough; frontend can send current + 1 for “next”.

**Agreed:** PATCH /queue/doctors/:doctorId/current with body { currentTokenNumber } (and optional date). Role check: admin, reception, or doctor (own id only). Upsert doctor_daily_queue so the row exists.

---

### 6. Whether queues should reset daily

**Engineer A:** “Reset” should not delete data. Option 1: reset = set current_token_number = 0 (and optionally last_token_number = 0) for that doctor/date. Option 2: also cancel all queue_tokens for that doctor/date. Option 1 is non-destructive and allows “reset display” without losing history. Option 2 is “start day over” and loses that day’s queue. We should support at least Option 1: set current_token_number = 0 for the day so the board can show “no current token”. New day = new queue_date, so token numbers naturally start from 1 when we generate (doctor_daily_queue row created with last_token_number = 0, first token gets 1).

**Engineer B:** From a usability perspective, “reset daily queue” likely means “start of day”: no one is being served yet. So reset = set current_token_number = 0 for that doctor and date. No need to clear token list; existing tokens (1, 2, 3…) remain, we’re just not “serving” any yet. If the hospital wants to clear the list too, that can be a separate “clear queue” action later.

**Agreed:** “Reset daily queue” = set current_token_number = 0 for (doctor_id, queue_date). Do not delete or cancel queue_tokens. Date defaults to today. Optional: support “reset all doctors for today” (admin only).

---

### 7. How to prevent duplicate tokens

**Engineer A:** Database constraint: UNIQUE(doctor_id, queue_date, token_number) on queue_tokens. Token number comes only from incrementing doctor_daily_queue.last_token_number in the same transaction as the INSERT. So we never assign the same number twice. If the INSERT fails (e.g. duplicate patient?), we don’t increment again; client retries and gets the next number.

**Engineer B:** One token per patient per doctor per day? Or can a patient have multiple tokens (e.g. revisit)? For v1, one token per (patient_id, doctor_id, queue_date) is simpler: prevent duplicate by checking before generate, or use UNIQUE(doctor_id, queue_date, patient_id) and return friendly error “Already in queue today”.

**Agreed:** Uniqueness of token number: UNIQUE(doctor_id, queue_date, token_number). Optionally prevent same patient twice per doctor per day: UNIQUE(doctor_id, queue_date, patient_id) or application check before generate. We’ll add UNIQUE(doctor_id, queue_date, patient_id) so one patient can’t have two tokens for the same doctor on the same day.

---

## FINAL Agreed Architecture

### Database

| Table | Purpose |
|-------|---------|
| **queue_tokens** | One row per patient in queue: id, doctor_id, patient_id, token_number, queue_date, status (waiting \| called \| serving \| completed \| cancelled), created_at. UNIQUE(doctor_id, queue_date, token_number), UNIQUE(doctor_id, queue_date, patient_id). |
| **doctor_daily_queue** | Per-doctor-per-day state: doctor_id, queue_date (PK together), current_token_number (default 0), last_token_number (default 0), updated_at. Used to generate next token number and to show “current token”. |

### Token generation

- Ensure row in doctor_daily_queue for (doctor_id, queue_date) (upsert with 0,0).
- Increment last_token_number (INSERT … ON CONFLICT DO UPDATE … RETURNING last_token_number).
- INSERT into queue_tokens (doctor_id, patient_id, queue_date, token_number, status = 'waiting').
- Return token_number, queue_date, doctor_id, status, id.

### API (base /api/v1/queue)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /queue/token | Generate token (body: doctorId, patientId; date = today) | Patient (own), Reception, Admin |
| GET | /queue/doctors/:doctorId | Current queue for doctor (query: date) | All authenticated |
| PATCH | /queue/doctors/:doctorId/current | Set current token number (body: currentTokenNumber; query: date) | Admin, Reception, Doctor (own) |
| GET | /queue/doctors/:doctorId/estimate | Waiting time estimate (query: tokenNumber or tokenId, date) | All authenticated |
| GET | /queue/doctors/:doctorId/upcoming | List upcoming tokens (query: date, limit) | All authenticated |
| POST | /queue/doctors/:doctorId/reset | Reset daily queue (set current to 0; query: date) | Admin, Reception, Doctor (own) |

### Waiting time

- estimated_minutes = max(0, (token_number - current_token_number - 1)) × AVG_CONSULTATION_MINUTES (e.g. 10).

### File layout

- backend/src/modules/queue: queue.controller.js, queue.service.js, queue.routes.js, queue.validation.js
- backend/src/db/migrations/006_create_queue_tables.sql

### Roles

- Generate token: patient (own patientId), reception, admin.
- Update current / reset: admin, reception, or doctor (only for own doctorId).

This document is the agreed spec for the queue module.

---

## Senior review (post-implementation)

- **Doctor existence:** All queue operations that take `doctorId` now call `assertDoctorExists(doctorId)` so invalid doctor returns 404 instead of empty data.
- **Date validation:** Explicit `date` query param is validated (YYYY-MM-DD); invalid format returns 400 with a clear message. Omitted date defaults to server today.
- **Role/own-resource:** Generate token: patient may only use own `patientId` (resolved via `getPatientIdByUserId`). Update current / reset: doctor may only act on own `doctorId` (resolved via `getDoctorIdByUserId`).
- **Token uniqueness:** `UNIQUE(doctor_id, queue_date, token_number)` and `UNIQUE(doctor_id, queue_date, patient_id)` in DB; token number from atomic increment of `doctor_daily_queue.last_token_number` in same transaction as insert.
- **Layering:** Validation in controller (using queue.validation); business logic and DB in service; routes only wire auth + asyncHandler + controller.
