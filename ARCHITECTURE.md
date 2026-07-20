# Hospital Management System — Architecture Design

## 1. Full Folder Structure

```
Hospital_project/
├── backend/                          # Node.js + Express API
│   ├── src/
│   │   ├── config/
│   │   │   ├── database.js           # PostgreSQL connection pool
│   │   │   └── env.js                # Environment variables validation
│   │   ├── middleware/
│   │   │   ├── auth.js               # JWT verify, role checks
│   │   │   ├── errorHandler.js       # Global error handler
│   │   │   ├── validate.js           # Request validation (e.g. Joi)
│   │   │   └── rateLimiter.js        # Rate limiting
│   │   ├── modules/
│   │   │   ├── auth/
│   │   │   │   ├── auth.controller.js
│   │   │   │   ├── auth.service.js
│   │   │   │   ├── auth.routes.js
│   │   │   │   └── auth.validation.js
│   │   │   ├── users/
│   │   │   │   ├── user.model.js     # Shared user base (if ORM) or reference
│   │   │   │   ├── user.service.js
│   │   │   │   └── user.routes.js
│   │   │   ├── patients/
│   │   │   │   ├── patient.controller.js
│   │   │   │   ├── patient.service.js
│   │   │   │   ├── patient.routes.js
│   │   │   │   └── patient.validation.js
│   │   │   ├── doctors/
│   │   │   │   ├── doctor.controller.js
│   │   │   │   ├── doctor.service.js
│   │   │   │   ├── doctor.routes.js
│   │   │   │   └── doctor.validation.js
│   │   │   ├── appointments/
│   │   │   │   ├── appointment.controller.js
│   │   │   │   ├── appointment.service.js
│   │   │   │   ├── appointment.routes.js
│   │   │   │   └── appointment.validation.js
│   │   │   └── admin/
│   │   │       ├── admin.controller.js
│   │   │       ├── admin.service.js
│   │   │       └── admin.routes.js
│   │   ├── db/
│   │   │   ├── migrations/           # SQL migrations (e.g. node-pg-migrate)
│   │   │   │   ├── 001_create_users.sql
│   │   │   │   ├── 002_create_patients_doctors.sql
│   │   │   │   ├── 003_create_appointments.sql
│   │   │   │   └── ...
│   │   │   └── seeds/                # Optional seed data
│   │   ├── utils/
│   │   │   ├── logger.js
│   │   │   ├── ApiError.js
│   │   │   └── asyncHandler.js
│   │   ├── app.js                   # Express app setup (middleware, routes)
│   │   └── server.js                # Entry point, start server
│   ├── package.json
│   ├── .env.example
│   └── .env
│
├── frontend/                         # React SPA
│   ├── public/
│   │   ├── index.html
│   │   └── favicon.ico
│   ├── src/
│   │   ├── api/                     # API client (axios/fetch)
│   │   │   ├── client.js            # Base axios instance + interceptors
│   │   │   ├── auth.api.js
│   │   │   ├── patients.api.js
│   │   │   ├── doctors.api.js
│   │   │   ├── appointments.api.js
│   │   │   └── admin.api.js
│   │   ├── components/
│   │   │   ├── common/              # Reusable UI (Button, Input, Modal, Table)
│   │   │   ├── layout/              # Header, Sidebar, MainLayout
│   │   │   └── auth/                # LoginForm, ProtectedRoute
│   │   ├── features/
│   │   │   ├── auth/
│   │   │   │   ├── LoginPage.jsx
│   │   │   │   ├── RegisterPage.jsx
│   │   │   │   └── AuthContext.jsx
│   │   │   ├── patients/
│   │   │   │   ├── PatientList.jsx
│   │   │   │   ├── PatientForm.jsx
│   │   │   │   └── PatientDetail.jsx
│   │   │   ├── doctors/
│   │   │   │   ├── DoctorList.jsx
│   │   │   │   ├── DoctorForm.jsx
│   │   │   │   └── DoctorDetail.jsx
│   │   │   ├── appointments/
│   │   │   │   ├── AppointmentList.jsx
│   │   │   │   ├── BookAppointment.jsx
│   │   │   │   └── AppointmentCalendar.jsx
│   │   │   └── admin/
│   │   │       ├── Dashboard.jsx
│   │   │       ├── StatsCards.jsx
│   │   │       └── Reports.jsx
│   │   ├── hooks/
│   │   │   ├── useAuth.js
│   │   │   └── useApi.js
│   │   ├── routes/
│   │   │   ├── AppRoutes.jsx
│   │   │   └── PrivateRoute.jsx
│   │   ├── store/                   # Optional: Redux/Zustand
│   │   ├── utils/
│   │   │   └── constants.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js / react-scripts
│
├── project_rules.md
├── readme.md
└── ARCHITECTURE.md                   # This file
```

---

## 2. Database Schema (PostgreSQL)

### 2.1 Core Tables

| Table | Purpose |
|-------|---------|
| `users` | Base auth + role (admin, doctor, patient, reception) |
| `patients` | Patient profile (links to users) |
| `doctors` | Doctor profile + specialization (links to users) |
| `appointments` | Booking between patient and doctor |
| `schedules` (optional) | Doctor availability slots |

### 2.2 Entity-Relationship (Logical)

- **users**: id (PK), email (unique), password_hash, role, is_active, created_at, updated_at  
- **patients**: id (PK), user_id (FK → users), first_name, last_name, date_of_birth, gender, phone, address, blood_group, created_at, updated_at  
- **doctors**: id (PK), user_id (FK → users), first_name, last_name, specialization, qualification, consultation_fee, is_available, created_at, updated_at  
- **appointments**: id (PK), patient_id (FK → patients), doctor_id (FK → doctors), appointment_date, start_time, end_time, status (scheduled | completed | cancelled | no_show), notes, created_at, updated_at  

Optional for scalability:

- **doctor_schedules**: id (PK), doctor_id (FK), day_of_week, start_time, end_time, is_available  
- **refresh_tokens**: id (PK), user_id (FK), token_hash, expires_at (for secure logout / refresh)

### 2.3 SQL Schema (Normalized)

```sql
-- Roles enum (optional, or use CHECK constraint)
-- CREATE TYPE user_role AS ENUM ('admin', 'doctor', 'patient', 'reception');

CREATE TABLE users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email             VARCHAR(255) NOT NULL UNIQUE,
  password_hash     VARCHAR(255) NOT NULL,
  role              VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'doctor', 'patient', 'reception')),
  is_active         BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE patients (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  date_of_birth     DATE,
  gender            VARCHAR(20),
  phone             VARCHAR(30),
  address           TEXT,
  blood_group       VARCHAR(10),
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doctors (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  first_name        VARCHAR(100) NOT NULL,
  last_name         VARCHAR(100) NOT NULL,
  specialization    VARCHAR(100) NOT NULL,
  qualification     VARCHAR(200),
  consultation_fee   DECIMAL(10, 2) DEFAULT 0,
  is_available      BOOLEAN DEFAULT true,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id        UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id         UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  appointment_date  DATE NOT NULL,
  start_time        TIME NOT NULL,
  end_time          TIME NOT NULL,
  status            VARCHAR(30) NOT NULL DEFAULT 'scheduled'
    CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  notes             TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(doctor_id, appointment_date, start_time)  -- one slot per doctor per time
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_date ON appointments(appointment_date);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
```

Optional:

```sql
CREATE TABLE refresh_tokens (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash  VARCHAR(255) NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE doctor_schedules (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id     UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  day_of_week   SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time    TIME NOT NULL,
  end_time      TIME NOT NULL,
  is_available  BOOLEAN DEFAULT true
);
```

---

## 3. API Endpoints

Base path: `/api/v1` (versioned).

### 3.1 Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/auth/register` | Register (patient/doctor as per body) | Public |
| POST | `/auth/login` | Login (email, password) → access + refresh tokens | Public |
| POST | `/auth/refresh` | Refresh access token | Refresh token |
| POST | `/auth/logout` | Invalidate refresh token | Optional token |
| GET  | `/auth/me` | Current user + role profile | JWT |

### 3.2 Patient Management (`/api/v1/patients`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/patients` | List patients (paginated, filters) | Admin, Reception |
| GET    | `/patients/:id` | Get patient by id | Admin, Reception, Patient (own) |
| POST   | `/patients` | Create patient (admin/reception) | Admin, Reception |
| PATCH  | `/patients/:id` | Update patient | Admin, Reception, Patient (own) |
| DELETE | `/patients/:id` | Soft/delete patient | Admin |

### 3.3 Doctor Management (`/api/v1/doctors`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/doctors` | List doctors (filter by specialization, available) | All authenticated |
| GET    | `/doctors/:id` | Get doctor by id | All authenticated |
| POST   | `/doctors` | Create doctor | Admin |
| PATCH  | `/doctors/:id` | Update doctor | Admin, Doctor (own limited) |
| DELETE | `/doctors/:id` | Deactivate/delete doctor | Admin |

### 3.4 Appointments (`/api/v1/appointments`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/appointments` | List appointments (by patient/doctor/date filters) | All roles (scoped) |
| GET    | `/appointments/:id` | Get appointment by id | Participant or admin |
| POST   | `/appointments` | Book appointment | Patient, Reception, Admin |
| PATCH  | `/appointments/:id` | Update (e.g. status, notes) | Doctor, Admin, Reception |
| DELETE | `/appointments/:id` | Cancel appointment | Patient, Admin, Reception |

Optional:

- `GET /doctors/:id/availability?date=YYYY-MM-DD` — slots available for a doctor on a date.

### 3.5 Admin Dashboard (`/api/v1/admin`)

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET    | `/admin/stats` | Counts: patients, doctors, appointments (today/week/month) | Admin |
| GET    | `/admin/reports/appointments` | Aggregated appointments (by date, doctor, status) | Admin |
| GET    | `/admin/users` | List users (paginated, filter by role) | Admin |

---

## 4. Backend Architecture

### 4.1 Layered Structure

- **Routes** → **Controller** → **Service** → **Database (SQL / pool)**  
- Validation at route/controller (e.g. Joi) before calling service.  
- Auth middleware: verify JWT, attach `req.user` (id, role), optional role guard.  
- No business logic in controllers; orchestration and calls in services.  
- DB access via `pg` (node-postgres) connection pool from `config/database.js`; optional query builder (e.g. Knex) for migrations and complex queries.

### 4.2 Request Flow

1. **Request** → CORS, body parser, rate limiter.  
2. **Route** → Matches path and method.  
3. **Auth middleware** (where required): validate JWT, set `req.user`.  
4. **Validation middleware**: validate body/query/params.  
5. **Controller**: call service with validated input; return status + JSON.  
6. **Service**: business logic, call DB, return DTOs.  
7. **Error handler**: map errors to HTTP status and JSON (e.g. 401, 403, 404, 422, 500).

### 4.3 Security

- Passwords hashed with **bcrypt** (or argon2).  
- JWT: short-lived access token (e.g. 15 min), optional refresh token in DB.  
- Role-based access: middleware `requireRole(['admin','reception'])` etc.  
- SQL: parameterized queries only (no string concatenation).  
- Env: `NODE_ENV`, `PORT`, `DATABASE_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET` in `.env`; validate on startup.

### 4.4 Scalability Considerations

- **Stateless API**: no session store; JWT or refresh token in DB.  
- **Connection pooling**: single pool per process for PostgreSQL.  
- **Migrations**: versioned SQL in `db/migrations/`, run before deploy.  
- **Pagination**: all list endpoints use `limit`/`offset` or `cursor`.  
- **Indexes**: on foreign keys, `appointment_date`, `users.email`, `users.role` as in schema.  
- **Optional**: separate read replicas for dashboard/reports; cache doctor list or availability in Redis later.

### 4.5 Module Dependency Overview

- **auth**: uses `users`; creates `patients` or `doctors` on register.  
- **patients / doctors**: depend on `users` (user_id).  
- **appointments**: depend on `patients`, `doctors`.  
- **admin**: read-only aggregations on `users`, `patients`, `doctors`, `appointments`.

This document is the single source of truth for folder structure, database schema, API contract, and backend architecture. Implement code following this design and `project_rules.md`.
