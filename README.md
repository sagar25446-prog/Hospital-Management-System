# Q-Care Hospital Management System

[![CI](https://github.com/sagar25446-prog/Hospital-Management-System/actions/workflows/ci.yml/badge.svg)](https://github.com/sagar25446-prog/Hospital-Management-System/actions/workflows/ci.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg?logo=express)](https://expressjs.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)](https://www.postgresql.org/)

Q-Care is a full-stack hospital management platform designed around the day-to-day workflows of patients, doctors, receptionists, and administrators.

It combines appointment and queue management, live wait-time tracking, telehealth, digital prescriptions, analytics, authentication, and an AI-assisted symptom-checking experience in one application.

**Live demo:** https://frontend-seven-sigma-66.vercel.app

## What it includes

- **Patient management** — appointments, queue status, patient history, and prescription access.
- **Live queues** — token generation, queue tracking, and wait-time estimation for doctors and reception staff.
- **Telehealth** — embedded Jitsi video consultations for remote appointments.
- **Digital prescriptions** — doctors can create prescriptions and patients can export them as PDFs.
- **AI symptom checker** — helps users identify an appropriate medical specialty based on reported symptoms. It is an assistive feature, not a medical diagnosis system.
- **Admin analytics** — visibility into patient volume, queues, and doctor workload.
- **Authentication and security** — JWT access/refresh tokens through HTTP-only cookies, Helmet security headers, rate limiting, and CORS controls.

## Architecture

```text
                    ┌─────────────────────┐
                    │     React + Vite     │
                    │   Patient / Doctor   │
                    │ Reception / Admin    │
                    └──────────┬──────────┘
                               │ REST / Auth
                               ▼
                    ┌─────────────────────┐
                    │   Node.js + Express  │
                    │      REST API        │
                    └──────┬───────┬──────┘
                           │       │
                     ┌─────▼──┐ ┌──▼─────────┐
                     │Postgres│ │External APIs│
                     │  Neon  │ │Jitsi / AI   │
                     └────────┘ └─────────────┘
```

## Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion, React Router |
| UI | Lucide React, responsive components, animated interactions |
| Backend | Node.js, Express |
| Database | PostgreSQL / Neon |
| Authentication | JWT access + refresh tokens, HTTP-only cookies |
| Security | Helmet, Express Rate Limit, CORS |
| Healthcare workflow | Queues, appointments, prescriptions, patient records |
| Telehealth | Jitsi Meet |
| Documents | jsPDF, jsPDF AutoTable |

## Project structure

```text
Hospital-Management-System/
├── frontend/              # React + Vite client
├── backend/               # Express API and database layer
└── .github/workflows/     # CI and README validation
```

## Run locally

### 1. Clone

```bash
git clone https://github.com/sagar25446-prog/Hospital-Management-System.git
cd Hospital-Management-System
```

### 2. Backend

```bash
cd backend
npm install
```

Create `backend/.env`:

```env
PORT=5000
DATABASE_URL=postgresql://your_db_url
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

Start the API:

```bash
npm run dev
```

### 3. Frontend

In another terminal:

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

Start the client:

```bash
npm run dev
```

## User roles

| Role | Main capabilities |
|---|---|
| Patient | Appointments, queue status, telehealth, prescriptions |
| Doctor | Queue management, patient history, consultations, prescriptions |
| Receptionist | Walk-in registration and queue administration |
| Admin | Hospital analytics and staff account management |

## Engineering notes

The project is structured as a conventional client/API/database application rather than a single-page demo. The frontend communicates with the Express API, while PostgreSQL provides persistent application data. Authentication uses short-lived access credentials with refresh handling through HTTP-only cookies.

The live queue and wait-time features are designed to make the system useful in an actual clinic workflow, while telehealth and prescription generation extend the same application into remote care and digital records.

## Scope

Q-Care is a software project and portfolio demonstration. It is **not a certified medical device or clinical decision-support system**. The AI symptom checker should not be treated as a diagnosis or substitute for professional medical advice.

## License

This project is licensed under the MIT License.
