# Doctor Module — Design Discussion & Final Architecture

## Simulated Discussion: AI Engineer A (Database) vs AI Engineer B (Product)

---

### 1. What doctor data should be stored

**Engineer A (Database):** Keep the existing `doctors` table: id, user_id, first_name, last_name, specialization, qualification, consultation_fee, is_available, created_at, updated_at. Add a `phone` column for contact (optional, VARCHAR) so we don’t need a join for basic contact. Normalize with `users` for auth; avoid duplicating email on doctors.

**Engineer B (Product):** For queue and appointments, we need at least: name, specialization, is_available, consultation_fee. Qualification is for display. Profile response should include user email (from users) for staff views; don’t expose it on public listing. So: store only what’s needed on `doctors`; join `users` when we need email for profile.

**Agreed:** No schema change to core doctor columns in 007. Keep doctors as-is. Optionally add `phone` in migration 007 for contact. Profile API returns doctor row + email from users join when the caller is staff/admin.

---

### 2. How doctor availability should work

**Engineer A:** Use a separate table `doctor_schedules`: (doctor_id, day_of_week, start_time, end_time, is_available). One row per (doctor, day_of_week) or allow multiple slots per day (e.g. morning and afternoon). Multiple slots per day are more flexible: (doctor_id, day_of_week, start_time, end_time, is_available). Index (doctor_id, day_of_week) for fast “get schedule for doctor” and “is doctor available on day X at time Y”.

**Engineer B:** Staff need to set weekly recurring availability (e.g. Mon 09:00–17:00, Tue 09:00–13:00). One or more slots per day is fine. API: get schedule = list slots; set schedule = replace all slots for a doctor with the payload (idempotent). No need for “available at instant T” in v1; that can be derived from slots + appointments/queue later.

**Agreed:** Table `doctor_schedules`: id, doctor_id (FK), day_of_week (0–6), start_time, end_time, is_available (default true). Multiple rows per doctor per day allowed. Get schedule: return all rows for doctor. Set schedule: delete existing for doctor, insert new set (or upsert by business key). Index on (doctor_id, day_of_week).

---

### 3. How doctor specialization should be structured

**Engineer A:** Free-text VARCHAR(100) is already in place; index for filters. No separate `specializations` table in v1 to avoid joins and reference data. If we need autocomplete later, we can add a lookup table and keep doctor.specialization as FK, or keep text and add a GIN index for search.

**Engineer B:** Filter “by specialization” should support partial match so “Cardio” matches “Cardiology”. Use ILIKE in the list query; no new tables. Return distinct specializations from doctors for filters/dropdowns if needed (separate endpoint or include in list meta).

**Agreed:** Keep `specialization` as VARCHAR on doctors. Filter list with `specialization ILIKE $1` (e.g. `%Cardio%`). No new tables. Optional: GET /doctors/specializations returning distinct list for UI.

---

### 4. How doctors relate to queues and appointments

**Engineer A:** doctors.id is FK in `appointments` and `queue_tokens` / `doctor_daily_queue`. No schema change. “Doctors with active queue” = doctors that have at least one queue_tokens row for the given date with status in ('waiting','called','serving'). Single query with EXISTS or JOIN.

**Engineer B:** “List doctors with active queues” is a filter on list doctors: same GET /doctors with query param e.g. has_active_queue=true&date=today. Response can include a flag or count for “active queue today” so the UI can show a badge.

**Agreed:** Reuse GET /doctors. Query params: specialization, is_available, has_active_queue (boolean), date (default today). When has_active_queue=true, join or subquery on queue_tokens for that date and status in (waiting, called, serving). Return doctor list; optionally include active_queue_count or has_active_queue on each row.

---

### 5. How hospitals with multiple doctors should be supported

**Engineer A:** Single-tenant for now: all doctors in one `doctors` table. No hospital_id. If we add multi-tenancy later, add hospital_id to doctors and scope all queries. Index (hospital_id, is_available) etc. would follow.

**Engineer B:** No “hospital” in scope for v1. List doctors returns all doctors; filters (specialization, available, active queue) are enough. No API change for multi-hospital in this phase.

**Agreed:** No hospital entity in v1. All doctors in one table. Design is ready for a future hospital_id column if needed.

---

### 6. What indexes are needed for performance

**Engineer A:** Existing: doctors(user_id), doctors(specialization), doctors(is_available). For list with active queue we need queue_tokens(doctor_id, queue_date, status) — already have doctor_id and queue_date. Add composite index (doctor_id, queue_date, status) if not present. For doctor_schedules: (doctor_id, day_of_week).

**Engineer B:** List doctors is the hot path; pagination (limit/offset) is required. Index on (is_available, specialization) can help filtered lists; optional since we have both columns indexed.

**Agreed:** Keep existing indexes. Add doctor_schedules(doctor_id), and (doctor_id, day_of_week). queue_tokens already has idx_queue_tokens_doctor_date; ensure status is used in filter so index can be used. No change to doctors table indexes in 007.

---

## FINAL Agreed Architecture

### Database (migration 007)

- **doctor_schedules:** id (UUID), doctor_id (FK → doctors), day_of_week (0–6), start_time (TIME), end_time (TIME), is_available (BOOLEAN default true), created_at. Unique or not: allow multiple slots per (doctor_id, day_of_week). Index: (doctor_id), (doctor_id, day_of_week).
- **doctors:** Optional: add `phone` VARCHAR(30). (Included in 007 for contact.)

### API (base /api/v1/doctors)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /doctors | Create doctor (user + doctor row); body: email, password, first_name, last_name, specialization, qualification?, consultation_fee? | Admin |
| GET | /doctors | List doctors; query: specialization, is_available, has_active_queue, date, limit, offset | Authenticated |
| GET | /doctors/:id | Get doctor profile (with schedule, optional email for staff) | Authenticated |
| PATCH | /doctors/:id | Update doctor (partial); admin or doctor (own) | Admin, Doctor (own) |
| GET | /doctors/:id/schedule | Get availability schedule | Authenticated |
| PUT | /doctors/:id/schedule | Set availability (replace slots); body: [{ day_of_week, start_time, end_time, is_available? }] | Admin, Doctor (own) |
| GET | /doctors/specializations | Distinct specializations (optional) | Authenticated |

### Create doctor flow

- Create user (email, password_hash, role='doctor'), then create doctor (user_id, first_name, last_name, specialization, qualification, consultation_fee). Same transaction. Return doctor profile (no password); do not return tokens.

### List doctors with active queues

- GET /doctors?has_active_queue=true&date=YYYY-MM-DD. Backend: join or EXISTS on queue_tokens for that date and status in ('waiting','called','serving').

### File layout

- backend/src/modules/doctors/: doctor.controller.js, doctor.service.js, doctor.routes.js, doctor.validation.js
- backend/src/db/migrations/007_update_doctors_tables.sql

### Indexes (007)

- doctor_schedules: (doctor_id), (doctor_id, day_of_week).

This document is the agreed spec for the doctor module.

---

## Senior review (post-implementation)

- **Create doctor:** Single transaction: insert user (role doctor) then doctor row; bcrypt for password. Returns doctor + email; no tokens. Duplicate email → 409.
- **List doctors:** Pagination (limit/offset), filter by specialization (ILIKE), is_available (boolean), has_active_queue (JOIN queue_tokens for date with status waiting/called/serving). Parameter indices in SQL built correctly for optional filters and LIMIT/OFFSET.
- **Profile:** getDoctorById used for existence and profile; getDoctorProfile adds schedule and optionally email (for admin/reception). No password or sensitive user data.
- **Update / schedule:** Only admin or doctor (own id via getDoctorIdByUserId). PATCH body validated for allowed fields; setSchedule replaces all slots in a transaction and validates start_time < end_time.
- **Specialization:** Kept as free text; list filter uses ILIKE. getSpecializations returns distinct values for UI.
- **Indexes:** doctor_schedules(doctor_id), (doctor_id, day_of_week) in 007; existing doctors indexes retained.
