# Admin Dashboard Module — Design Discussion & Final Architecture

## Simulated Discussion: AI Engineer A (Data Engineer) vs AI Engineer B (Product Engineer)

---

### 1. What metrics hospitals need on a dashboard

**Engineer B (Product):** The dashboard should answer: “How busy are we right now?” and “What’s the overall system health?” So we need: total patients today, total appointments today, how many queues are active, and average waiting time. A separate “stats” endpoint can serve broader summary numbers (total patients, doctors, appointments over time) for reports and headers.

**Engineer A (Data):** Agreed. “Total patients today” should be a **distinct count** of patients who had activity today—either in a queue or with an appointment. Otherwise we double-count and overstate. So: `COUNT(DISTINCT patient_id)` from the union of (queue_tokens where queue_date = today) and (appointments where appointment_date = today and status != 'cancelled'). One query with a subquery/CTE or two counts and merge in app; prefer one SQL query for consistency.

**Agreed:** Dashboard returns: **totalPatientsToday** (distinct patients in queue or appointments today), **totalAppointmentsToday** (count of appointments today, status in scheduled/completed), **activeQueues** (list or count of doctors with at least one token in waiting/called/serving today), **averageWaitingTimeMinutes** (see below). Stats endpoint returns system-wide counts (users by role, patients, doctors, appointments today/week/total, queue tokens today).

---

### 2. How to calculate daily patient counts

**Engineer A:** Use a single aggregation. Option 1: `SELECT COUNT(DISTINCT patient_id) FROM (SELECT patient_id FROM queue_tokens WHERE queue_date = $1 UNION SELECT patient_id FROM appointments WHERE appointment_date = $1 AND status != 'cancelled') u`. Option 2: two queries—count distinct from queue_tokens for date, count distinct from appointments for date, then in app take max or sum; but that double-counts patients who are both in queue and have an appointment. So we must use UNION (not UNION ALL) in SQL to get true distinct.

**Engineer B:** “Total patients today” is the number of unique patients the hospital is seeing today (in queue or by appointment). So one query with UNION of patient_id from both sources, then COUNT(DISTINCT). Good for dashboard and for any “patients today” KPI.

**Agreed:** Single query: subquery or CTE with `SELECT patient_id FROM queue_tokens WHERE queue_date = $1 UNION SELECT patient_id FROM appointments WHERE appointment_date = $1 AND status != 'cancelled'`, then `SELECT COUNT(*) FROM (...)` or `SELECT COUNT(DISTINCT patient_id)` depending on how we structure it. UNION already deduplicates, so outer COUNT(*) is correct.

---

### 3. How to calculate average waiting time

**Engineer A:** We don’t store actual wait duration; we only have the queue formula: estimated_minutes = max(0, token_number - current_token_number - 1) × 10. So “average waiting time” for the dashboard is the **average of estimated wait** across all tokens currently in status **waiting** for today. If no one is waiting, return 0 or null. We need one query that joins queue_tokens (status = 'waiting', queue_date = today) with doctor_daily_queue to get current_token_number per doctor, then compute (token_number - current - 1) * 10 per row and AVG in SQL or in app.

**Engineer B:** Showing “average estimated wait” is still useful—it sets expectations. Compute it per doctor and then average across doctors, or average across all waiting patients? Averaging across **all waiting patients** is more patient-centric and matches “how long do patients wait on average right now.”

**Agreed:** Average = mean of (max(0, token_number - current_token_number - 1) × 10) over all queue_tokens where queue_date = today and status = 'waiting', joining doctor_daily_queue for current_token_number. Single aggregation query with JOIN and AVG(GREATEST(0, (qt.token_number - dq.current_token_number - 1) * 10)). If no waiting tokens, return 0.

---

### 4. How to calculate doctor workload

**Engineer A:** “Workload” = number of patients per doctor **today**. Source: queue_tokens where queue_date = today and status != 'cancelled'. One GROUP BY doctor_id with COUNT(*). Join doctors for name/specialization. Index (doctor_id, queue_date) or (queue_date, doctor_id) supports this; we have (doctor_id, queue_date) already.

**Engineer B:** Admin should see which doctors have how many patients in queue today (including completed)—so total tokens today per doctor. Optionally we could also show “active” (waiting/called/serving) vs “completed” counts; for v1 a single “patient count today” per doctor is enough.

**Agreed:** GET /admin/doctors/workload returns list of { doctorId, doctor name, specialization, patientCountToday }. patientCountToday = COUNT(*) from queue_tokens where doctor_id = X and queue_date = today and status != 'cancelled'. One query with GROUP BY doctor_id, JOIN doctors.

---

### 5. How to list active queues

**Engineer A:** “Active queue” = a doctor who has at least one token in (waiting, called, serving) for today. We can: (1) get distinct doctor_ids from queue_tokens where queue_date = today and status in (...), then for each fetch current queue state (N+1), or (2) one query: from doctor_daily_queue join queue_tokens on (doctor_id, queue_date) where queue_date = today and status in (...), group by doctor_id, and select current_token_number, last_token_number, count of active tokens. Join doctors once for names. That’s one aggregation + one join to doctors.

**Engineer B:** Response should include: doctor id, doctor name, current token number, last token number, count of patients waiting (or in queue), so staff see at a glance which queues are live and how long they are. Optional: include list of token numbers; for dashboard summary we can keep it to counts and current/last.

**Agreed:** Single query: doctor_daily_queue dq JOIN queue_tokens qt ON (qt.doctor_id = dq.doctor_id AND qt.queue_date = dq.queue_date AND qt.queue_date = $1 AND qt.status IN ('waiting','called','serving')) JOIN doctors d ON d.id = dq.doctor_id. GROUP BY dq.doctor_id, dq.current_token_number, dq.last_token_number, d.id, d.first_name, d.last_name, d.specialization. Select doctor fields, current_token_number, last_token_number, COUNT(qt.id) as active_count. Only include rows where the join found at least one token (INNER JOIN). So we only get doctors with active queues. Order by active_count desc or doctor name.

---

### 6. What indexes are needed for analytics queries

**Engineer A:** Existing: queue_tokens(doctor_id, queue_date), (doctor_id, queue_date, status); appointments(appointment_date); doctor_daily_queue PK (doctor_id, queue_date). For “all active queues today” we filter queue_tokens by queue_date = today and status IN (...). The composite (doctor_id, queue_date, status) is used when we join to doctor_daily_queue by (doctor_id, queue_date). For “distinct patients today” we scan queue_tokens by queue_date and appointments by appointment_date—both have date indexes. Adding queue_tokens(queue_date) can help date-only filters (e.g. COUNT today) when we don’t filter by doctor_id first. Optional: (queue_date, status) on queue_tokens for “active tokens today” scan.

**Engineer B:** Dashboard and queues are read-heavy; we want sub-second response. If existing indexes already support the queries (explain analyze), we can skip new indexes; otherwise add the minimal set.

**Agreed:** Rely on existing indexes for v1. Add **queue_tokens(queue_date)** in migration 010 to optimize “tokens today” and “distinct patients today” (queue side). appointments(appointment_date) already exists. Run EXPLAIN on dashboard query and add (queue_date, status) only if needed.

---

## Final Architecture

### API (base /api/v1/admin)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /admin/dashboard | totalPatientsToday, totalAppointmentsToday, activeQueues (array), averageWaitingTimeMinutes | Admin |
| GET | /admin/queues | List active queues for all doctors (today): doctor info, current_token_number, last_token_number, active_count | Admin |
| GET | /admin/doctors/workload | Number of patients per doctor today (doctor_id, name, specialization, patientCountToday) | Admin |
| GET | /admin/stats | Summary: total users, patients, doctors; appointments today/week/total; queue tokens today | Admin |

All admin routes: **requireRole(['admin'])** and **authMiddleware**.

### Dashboard payload (GET /admin/dashboard)

- **totalPatientsToday**: number (distinct patients in queue or appointments today).
- **totalAppointmentsToday**: number (appointments today, status in scheduled/completed).
- **activeQueues**: array of { doctorId, doctorName, specialization, currentTokenNumber, lastTokenNumber, activeCount }.
- **averageWaitingTimeMinutes**: number (average estimated wait over all waiting tokens today; 0 if none).

### Queues payload (GET /admin/queues)

- Array of { doctorId, doctorName, specialization, currentTokenNumber, lastTokenNumber, activeCount } for doctors who have at least one token in (waiting, called, serving) today.

### Workload payload (GET /admin/doctors/workload)

- Array of { doctorId, firstName, lastName, specialization, patientCountToday } for all doctors who have at least one queue token today (status != 'cancelled'), plus optionally doctors with 0 (include all doctors with 0 for today). Product choice: include only doctors with activity today, or all doctors with patientCountToday (0 for none). **Agreed:** Return all doctors with patientCountToday (0 if no tokens today) so the dashboard can show “every doctor and their load.”

### Stats payload (GET /admin/stats)

- **totalUsers**, **totalPatients**, **totalDoctors** (count from users/patients/doctors by role or table).
- **appointmentsToday**, **appointmentsThisWeek**, **appointmentsTotal** (or similar).
- **queueTokensToday** (count of queue_tokens where queue_date = today).

Use PostgreSQL aggregation (COUNT, COUNT DISTINCT, AVG, GROUP BY, UNION, JOIN). Single queries per metric where possible to minimize round-trips.

### Layer

- **admin.routes.js**: authMiddleware, requireRole(['admin']), wire GET /dashboard, /queues, /doctors/workload, /stats.
- **admin.controller.js**: call service methods, return JSON; no business logic.
- **admin.service.js**: getDashboardMetrics(), getActiveQueues(), getDoctorsWorkload(), getStats(). Each uses pool and parameterized queries; return plain objects/arrays.

### File layout

- backend/src/modules/admin/: admin.controller.js, admin.service.js, admin.routes.js.
- Optional: backend/src/db/migrations/010_admin_analytics_indexes.sql (e.g. queue_tokens(queue_date)).

### Indexes (010)

- **queue_tokens(queue_date)** to speed up date-scoped analytics (distinct patients today, count tokens today, active queues today).

This document is the agreed spec for the admin dashboard module.
