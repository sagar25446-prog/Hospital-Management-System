# 🏥 Q-Care Hospital Management System

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?logo=tailwind-css)
![Express](https://img.shields.io/badge/Express-4.x-000000.svg?logo=express)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791.svg?logo=postgresql)

Q-Care is an ultra-premium, full-stack Hospital Management System designed for modern clinics and hospitals. It features a stunning glassmorphic UI, real-time patient queue tracking, secure JWT authentication, and advanced telehealth capabilities.

**🔗 Live Demo:** [https://frontend-seven-sigma-66.vercel.app](https://frontend-seven-sigma-66.vercel.app)

---

## ✨ Key Features

- **🧑‍⚕️ Smart Patient Queues**: Real-time token generation, live wait-time estimation, and queue displays for hospital waiting rooms.
- **📹 Telehealth Video Calls**: Fully integrated, free-to-use video consultations using Jitsi Meet embedded directly in the patient and doctor portals.
- **📄 Digital Prescriptions**: Doctors can generate detailed medical records, and patients can instantly download them as beautifully formatted, branded PDFs.
- **🤖 AI Symptom Checker**: A smart chat widget that analyzes patient symptoms and recommends the right medical specialist.
- **📊 Admin Analytics Dashboard**: Real-time insights into patient volume, queue times, and doctor workloads.
- **🔐 Secure Architecture**: Enterprise-grade security with `httpOnly` cookies, rate-limiting, and Helmet security headers.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** React + Vite
- **Styling:** Tailwind CSS (Custom Premium Color Palette)
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Features:** jsPDF (Prescriptions), Jitsi Meet API (Telehealth)

### Backend
- **Server:** Node.js + Express
- **Database:** PostgreSQL (Neon serverless)
- **Authentication:** JWT (Access + Refresh tokens) via HTTP-only cookies
- **Security:** Helmet, Express-Rate-Limit, CORS

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
