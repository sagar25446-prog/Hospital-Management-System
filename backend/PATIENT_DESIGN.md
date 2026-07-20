# Patient Module — Design Discussion & Final Architecture

## Simulated Discussion: AI Engineer A (Database) vs AI Engineer B (Product)

---

### 1. What patient information should be stored

**Engineer A (Database):** Keep the existing `patients` table: id, user_id, first_name, last_name, date_of_birth, gender, phone, address, blood_group, created_at, updated_at. No duplicate of email; join `users` when email is needed for staff. Optional: add an index on phone for search.

**Engineer B (Product):** Staff need to find patients by name or phone quickly. List and search are the main use cases. Profile should show full demographics plus optional email (for admin/reception). Patient (own) sees own profile without other patients’ data.

**Agreed:** No new columns in 008. Store only what’s in the current schema. Profile API returns patient row; include email from users when caller is admin/reception.

---

### 2. How patient profiles connect to users

**Engineer A:** One-to-one: patients.user_id → users.id, UNIQUE. One user (role patient) = one patient row. Create patient = create user (email, password, role=patient) then insert patient row in same transaction, same as doctor creation.

**Engineer B:** When staff creates a patient, they supply email and password so the patient can log in. Response returns patient profile; optionally include email for confirmation. Patient can later log in and see/update own profile.

**Agreed:** Create patient = create user (email, password_hash, role=patient) + insert patient (user_id, first_name, last_name, …) in one transaction. No tokens returned. Duplicate email → 409.

---

### 3. How patients interact with queues

**Engineer A:** queue_tokens.patient_id → patients.id. Already indexed (idx_queue_tokens_patient). “Queue history” = list queue_tokens for this patient_id, ordered by queue_date desc, with doctor info (join doctors). Pagination (limit/offset) for large history.

**Engineer B:** Staff and patient (own) need to see “past queue visits”: date, doctor, token number, status. Single endpoint GET /patients/:id/queue-history with optional limit/offset and date range.

**Agreed:** GET /patients/:id/queue-history returns list of queue_tokens for that patient with doctor (id, first_name, last_name, specialization). Order by queue_date desc, created_at desc. Query params: limit, offset (default limit 50, max 100).

---

### 4. How patient history (appointments + queues) should be queried

**Engineer A:** Two separate endpoints: queue history (queue_tokens) and appointment history (appointments). Both filter by patient_id; appointments already have idx_appointments_patient. Return arrays; no heavy aggregation in v1.

**Engineer B:** Staff want one place to see “this patient’s activity”. Either one combined “history” (mixed queue + appointments by date) or two lists. Two lists are simpler and map to two tables; frontend can merge/sort if needed.

**Agreed:** Two endpoints: GET /patients/:id/queue-history and GET /patients/:id/appointment-history. Each returns list with relevant joins (doctor info). Pagination via limit/offset.

---

### 5. How duplicate patients should be prevented

**Engineer A:** Uniqueness on users.email prevents duplicate login identity. Optionally enforce unique phone on patients to prevent same phone for two records; but phone can be shared (e.g. family). So: duplicate prevention by email only when creating (user). No UNIQUE(phone) in schema unless product requires it.

**Engineer B:** At registration we already have unique email. When staff “creates” a patient we create a new user+patient; if email exists, fail with 409. No need for duplicate “merge” in v1.

**Agreed:** Prevent duplicate by unique users.email. On create patient, insert user then patient; 23505 on users → 409 “Email already registered”. No phone uniqueness in v1.

---

### 6. What indexes are needed for fast lookups

**Engineer A:** List with search by name/phone: WHERE (first_name ILIKE … OR last_name ILIKE … OR phone ILIKE …). B-tree on (last_name, first_name) helps ORDER BY and partial name filters. Index on phone for phone search. Existing idx_patients_user_id for “get by user”. Queue and appointment history use existing idx_queue_tokens_patient and idx_appointments_patient.

**Engineer B:** Search should be fast for “type a few characters”. ILIKE '%term%' can’t use plain B-tree; we still add index on phone and (last_name, first_name) for equality/prefix and ordering.

**Agreed:** Migration 008: add index on patients(phone) if not present; add composite index (last_name, first_name) for list ordering and name filters. Rely on existing patient_id indexes for history queries.

---

## FINAL Agreed Architecture

### Database (migration 008)

- **patients:** No new columns. Add index on phone; add composite index (last_name, first_name) for list/sort.

### API (base /api/v1/patients)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | /patients | Create patient (user + patient); body: email, password, first_name, last_name, date_of_birth?, gender?, phone?, address?, blood_group? | Admin, Reception |
| GET | /patients | List patients; query: search (name or phone ILIKE), limit, offset | Admin, Reception |
| GET | /patients/:id | Get patient profile (optional email for staff) | Admin, Reception, Patient (own) |
| PATCH | /patients/:id | Update patient (partial) | Admin, Reception, Patient (own) |
| GET | /patients/:id/queue-history | Queue tokens for patient with doctor info; query: limit, offset | Admin, Reception, Patient (own) |
| GET | /patients/:id/appointment-history | Appointments for patient with doctor info; query: limit, offset | Admin, Reception, Patient (own) |

### Create patient flow

- Body: email, password, first_name, last_name, date_of_birth?, gender?, phone?, address?, blood_group?.
- Transaction: insert user (email, password_hash, role=patient), then insert patient (user_id, …). Return patient profile (no password). 409 if email exists.

### List patients

- GET /patients?search=john&limit=20&offset=0. search optional: ILIKE on (first_name, last_name, phone). Pagination required.

### File layout

- backend/src/modules/patients: patient.controller.js, patient.service.js, patient.routes.js, patient.validation.js
- backend/src/db/migrations/008_update_patients_tables.sql

### Indexes (008)

- patients(phone)
- patients(last_name, first_name)

This document is the agreed spec for the patient module.

---

## Senior review (post-implementation)

- **Create patient:** Single transaction: insert user (role patient) then patient row; bcrypt for password. Returns patient + email; no tokens. Duplicate email → 409.
- **List patients:** Pagination (limit/offset); optional search over first_name, last_name, phone via ILIKE. Search term escaped for LIKE (%, _) to avoid pattern injection. Order by last_name, first_name.
- **Profile / update / history:** getPatientById used for existence and profile; email included only for admin/reception. Update uses whitelist UPDATE_ALLOWED_KEYS. Queue and appointment history join doctors for display; pagination via limit/offset.
- **Own-resource:** Patient role can access only own profile (get, update, queue-history, appointment-history) via getPatientIdByUserId(req.user.id) === id. List and create restricted to admin/reception.
- **Indexes:** 008 adds patients(phone) and (last_name, first_name). Existing idx_patients_user_id and idx_queue_tokens_patient / idx_appointments_patient used for history.
