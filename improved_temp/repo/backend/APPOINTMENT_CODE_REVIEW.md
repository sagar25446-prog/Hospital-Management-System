# Appointment Module – Senior Engineer Code Review

## Summary
The appointment module follows the existing routes → controller → service → database pattern and integrates correctly with queue, doctors, and patients. Below are review notes and applied improvements.

## Positive findings
- **Transaction safety**: Booking uses a single transaction for appointment insert, token generation, and linking; no orphaned records.
- **Double-booking prevention**: DB unique constraint `(doctor_id, appointment_date, start_time)` plus service-level `checkNoConflict` (excluding cancelled) give clear errors.
- **Schedule integration**: `checkSlotInSchedule` validates against `doctor_schedules` (day_of_week, start_time, end_time, is_available).
- **Role and ownership**: Controller enforces patient/doctor own-resource and admin/reception access consistently.
- **Parameterized queries**: All SQL uses `$1, $2, ...`; no string concatenation of user input.
- **Validation**: Centralized in `appointment.validation.js` with date/time parsing and allowed statuses.

## Improvements applied
1. **Time normalization**: `parseTime` now normalizes `HH:MM` to `HH:MM:SS` so slot checks compare correctly with PostgreSQL TIME values from `doctor_schedules`.
2. **Queue transaction API**: `generateTokenInTransaction(client, ...)` in queue.service allows appointment booking to create the token inside the same transaction without duplicating queue logic.

## Recommendations (optional)
- **Same-day past slots**: Currently we allow booking (today, 09:00) even after 09:00. Could add a check that `(appointment_date, start_time)` is not in the past for stricter semantics.
- **Idempotent cancel**: Calling cancel on an already-cancelled appointment is allowed and returns success; no change needed.
- **List response shape**: Consider adding `total` count for pagination (e.g. a separate count query or window function); current limit/offset is sufficient for MVP.

## Files touched
- `backend/src/db/migrations/009_update_appointments_tables.sql` – add `queue_token_id`
- `backend/src/modules/queue/queue.service.js` – add `generateTokenInTransaction`
- `backend/src/modules/appointments/*` – new module
- `backend/src/app.js` – mount `/api/v1/appointments`
