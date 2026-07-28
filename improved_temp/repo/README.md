# 🏥 Q-Care Hospital Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css)
![Express](https://img.shields.io/badge/Express-4.x-000000.svg?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)

Q-Care is a full-stack Hospital Management System for clinics: live patient queue tracking, secure JWT authentication, telehealth video calls, and role-based dashboards for patients, doctors, reception, and admin.

**🔗 Live Demo:** [https://frontend-seven-sigma-66.vercel.app](https://frontend-seven-sigma-66.vercel.app)

> See [CHANGES.md](./CHANGES.md) for a full, honest account of what changed in the latest pass — including two real bugs that were found and fixed by writing tests, not just the feature list below.

---

## ✨ Key Features

- **🧑‍⚕️ Smart Patient Queues**: Token generation, live wait-time estimation, and queue displays for waiting rooms — updated instantly via WebSocket push when the backend runs as a persistent server, with automatic polling fallback otherwise (see CHANGES.md).
- **📹 Telehealth Video Calls**: Video consultations using Jitsi Meet, embedded in the patient and doctor portals.
- **📄 Digital Prescriptions**: Doctors write structured prescriptions; patients download them as PDFs. All access is now written to an append-only audit log.
- **🩺 Symptom Checker**: A floating widget that suggests which specialist to book with. Uses a real LLM call when `ANTHROPIC_API_KEY` is configured on the backend, and a deterministic keyword matcher otherwise — the response always says which one produced the answer, and every doctor's schedule availability is enforced server-side.
- **📊 Admin Analytics Dashboard**: Live charts (Recharts) of patient volume and per-doctor queue load, plus an audit-log viewer.
- **🗓️ Doctor Scheduling**: Doctors set their own weekly recurring availability from their profile page.
- **🔐 Secure Architecture**: `httpOnly` cookies, rotating refresh tokens, rate-limiting, Helmet headers, and now an automated test suite covering the validation and matching logic.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React + Vite (route-based code splitting)
- **Styling:** Tailwind CSS — a dedicated "ticket stub" design system for the public site, Fraunces + Inter + JetBrains Mono
- **Realtime:** socket.io-client (auto-fallback to polling)
- **Charts:** Recharts
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Testing:** Vitest + React Testing Library
- **Features:** jsPDF (Prescriptions), Jitsi Meet API (Telehealth)

### Backend
- **Server:** Node.js + Express
- **Realtime:** Socket.io (persistent-server deployments only — see CHANGES.md)
- **Database:** PostgreSQL (Neon serverless)
- **Authentication:** JWT (Access + Refresh tokens) via HTTP-only cookies
- **Security:** Helmet, Express-Rate-Limit, CORS, append-only audit log
- **AI:** Optional Anthropic API call for the symptom checker (graceful fallback if unset)
- **Testing:** Jest + Supertest

---

## 🚀 Getting Started

To run this project locally, follow these steps:

### 1. Clone the repository
```bash
git clone https://github.com/sagar25446-prog/Hospital-Management-System.git
cd Hospital-Management-System
```

### 2. Setup the Backend
```bash
cd backend
npm install
```
Create a `.env` file in the backend directory with the following variables:
```env
PORT=5000
DATABASE_URL=postgresql://your_db_url
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Optional — all features degrade gracefully without these:
ANTHROPIC_API_KEY=          # real LLM-backed symptom checker instead of keyword matching
RESEND_API_KEY=             # real email instead of console logging
NOTIFICATION_FROM_EMAIL=
TWILIO_ACCOUNT_SID=         # real SMS instead of console logging
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
```
Run the tests:
```bash
npm test
```
Run the server:
```bash
npm run dev
```

### 3. Setup the Frontend
Open a new terminal window:
```bash
cd frontend
npm install
```
Create a `.env` file in the frontend directory:
```env
VITE_API_URL=http://localhost:5000
```
Run the app:
```bash
npm run dev
```

---

## 👥 Roles & Access

The platform supports 4 different user roles:
1. **Patient**: Can book appointments, join video calls, and download PDF prescriptions.
2. **Doctor**: Can manage their live queue, see patient history, and write digital prescriptions.
3. **Receptionist**: Can manage walk-in patients and oversee all doctor queues.
4. **Admin**: Has access to hospital analytics, and can create new doctor/staff accounts.

---

## 📝 License

This project is licensed under the MIT License.
