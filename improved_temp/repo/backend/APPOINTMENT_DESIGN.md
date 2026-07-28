# Appointment System – Design Discussion & Final Architecture

## Simulated discussion: two AI engineers

**Engineer A:** We need to implement the appointment module with book, list (doctor/patient), cancel, and update status. The requirement says "automatically generate queue token when appointment is booked." How should we tie appointments to the queue?

**Engineer B:** We should create the queue token in the same database transaction as the appointment. That way we never have an appointment without a token for that day, and we can store `queue_token_id` on the appointment row so the UI can show "Your token number: 5" without an extra lookup.

**Engineer A:** Agreed. So migration 009 adds `queue_token_id UUID REFERENCES queue_tokens(id)` to `appointments`. For booking we'll need the queue module to expose a transaction-scoped token generator—something like `generateTokenInTransaction(client, doctorId, patientId, queueDate)` that uses the provided client and doesn't commit, so the appointment service can run one transaction: insert appointment → generate token → update appointment with `queue_token_id`.

**Engineer B:** Yes. That keeps the queue logic in one place and avoids duplicating the `ensureDoctorDailyQueue` and token-insert logic.

**Engineer A:** Double booking: the table already has `UNIQUE(doctor_id, appointment_date, start_time)`. We still need to validate that the requested slot falls within the doctor's schedule (`doctor_schedules`: day_of_week, start_time, end_time). So we need to derive day_of_week from appointment_date and check that (start_time, end_time) lies inside at least one available slot and doesn't overlap existing appointments for that doctor.

**Engineer B:** Right. In the service we'll: (1) resolve doctor and patient exist; (2) get doctor schedules for that day_of_week; (3) check (start_time, end_time) is within a slot and slot is_available; (4) check no existing appointment for (doctor_id, appointment_date, start_time)—the UNIQUE will also catch it, but we can return a friendly message; (5) in a transaction: insert appointment, generate token for that date, update appointment.queue_token_id, commit.

**Engineer A:** Should we allow booking in the past?

**Engineer B:** No. Reject if appointment_date is before today. For "today" we could allow if start_time is still in the future, but to keep it simple we can reject same-day past slots by comparing (appointment_date, start_time) to now.

**Engineer A:** Cancel: just set status to 'cancelled', or also cancel the linked queue token?

**Engineer B:** Set appointment status to 'cancelled'. Optionally update the linked queue_token to status 'cancelled' if queue_date is today and token is still 'waiting', so the queue board doesn't show them. That's a nice touch; we can do it in the same update flow.

**Engineer A:** List doctor appointments and list patient appointments: filter by date or date range?

**Engineer B:** Support optional `date` (single day) and optional `from_date`/`to_date` for range. Default to upcoming (appointment_date >= today) with a sensible limit so we don't return years of history. Status filter optional (e.g. only 'scheduled').

**Engineer A:** Roles: patient can book for self only; doctor can list only their appointments; admin/reception can do everything. Single appointment get by id: patient sees own, doctor sees own, admin/reception see any.

**Engineer B:** Yes. We'll need getAppointmentById in service and enforce ownership in controller.

---

## Final architecture

### Database (migration 009)

- Add to `appointments`:
  - `queue_token_id UUID NULL REFERENCES queue_tokens(id) ON DELETE SET NULL`
- Index: `idx_appointments_queue_token_id` for lookups by token.
- Existing: `UNIQUE(doctor_id, appointment_date, start_time)` remains the double-booking constraint.

### API surface

| Method | Path | Description | Roles |
|--------|------|-------------|--------|
| POST | /api/v1/appointments | Book appointment (body: doctorId, patientId, appointment_date, start_time, end_time, notes?) | patient (self), admin, reception |
| GET | /api/v1/appointments/doctors/:doctorId | List doctor's appointments (query: date, from_date, to_date, status, limit, offset) | doctor (own), admin, reception |
| GET | /api/v1/appointments/patients/:patientId | List patient's appointments | patient (own), admin, reception |
| GET | /api/v1/appointments/:id | Get one appointment | patient/doctor (own), admin, reception |
| PATCH | /api/v1/appointments/:id/status | Update status (body: status) | doctor (own), admin, reception |
| DELETE or PATCH | /api/v1/appointments/:id/cancel | Cancel appointment (set status cancelled, optionally cancel queue token) | patient (own), doctor (own), admin, reception |

### Service layer

- **appointment.service.js**
  - `bookAppointment(data)`  
    - Validate doctor/patient exist, slot in doctor schedule, no double book, date not in past.  
    - Transaction: insert appointment → `queueService.generateTokenInTransaction(client, doctorId, patientId, appointment_date)` → update appointment with queue_token_id.
  - `listDoctorAppointments(doctorId, filters)`  
    - Filters: date, from_date, to_date, status, limit, offset. Default upcoming.
  - `listPatientAppointments(patientId, filters)`  
    - Same filter pattern.
  - `getAppointmentById(id)`  
    - Return row with doctor/patient names and queue token number if present.
  - `updateAppointmentStatus(id, status)`  
    - Allowed statuses: scheduled, completed, cancelled, no_show. On cancel, optionally set linked queue_token.status = 'cancelled' when queue_date = today and status = 'waiting'.
  - `cancelAppointment(id)`  
    - Convenience: call updateAppointmentStatus(id, 'cancelled').

- **queue.service.js** (add)
  - `generateTokenInTransaction(client, doctorId, patientId, queueDate)`  
    - Same logic as current token generation but using `client`, no commit/rollback. Returns created token row. Used only by appointment booking.

### Validation (appointment.validation.js)

- Book: doctorId, patientId, appointment_date (YYYY-MM-DD), start_time (HH:MM or HH:MM:SS), end_time, optional notes. Validate start_time < end_time, date >= today.
- List: optional date, from_date, to_date, status, limit, offset.
- Update status: status one of scheduled, completed, cancelled, no_show.

### Controller

- Enforce role and ownership on every handler using existing patterns (getDoctorIdByUserId / getPatientIdByUserId from queue or doctor/patient modules).
- Return 403 when a user tries to access another user's resource; 404 when appointment not found.

### Integration

- Mount routes under `/api/v1/appointments` in `app.js`.
- Patient module's existing `getAppointmentHistory` continues to read from `appointments`; no change required.

---

## Flow summary

1. **Book:** Validate input → check doctor schedule and conflicts → in one transaction: insert appointment → generate queue token → set appointment.queue_token_id → commit.
2. **List:** Apply filters (date/range, status), return appointments with doctor/patient info and token number.
3. **Cancel:** Set status to cancelled; if same-day and token exists and waiting, set queue_token.status to cancelled.
4. **Update status:** Validate new status, update appointment (and optionally linked token on cancel).

This keeps double-booking prevention in the DB and in service checks, integrates with doctor schedule, and links each booked appointment to a single queue token for the day.
