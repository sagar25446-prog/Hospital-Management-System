# Authentication Module — Design Discussion & Final Architecture

## Simulated Discussion: AI Engineer A (Security) vs AI Engineer B (Backend Architect)

---

### 1. JWT Strategy

**Engineer A (Security):** We need short-lived access tokens (15 min) so stolen tokens have limited impact. Refresh tokens should be long-lived (e.g. 7 days) but stored in the DB as a hash so we can revoke them on logout. Never put sensitive data in the JWT payload—only `userId`, `email`, `role` for authorization.

**Engineer B (Backend Architect):** Agreed. Keep the access token stateless so we don’t hit the DB on every request. Refresh token lookup in DB is acceptable only for /auth/refresh and /auth/logout. Use separate secrets for access and refresh to limit blast radius if one is leaked.

**Agreed:** Access token: 15 min, payload `{ userId, email, role }`. Refresh token: 7 days, stored as hash in `refresh_tokens` table. Two env vars: `JWT_SECRET`, `JWT_REFRESH_SECRET`.

---

### 2. Password Hashing

**Engineer A:** Use bcrypt with cost factor 10 (or 12 in production). Never log or return `password_hash`; strip it from any user object before sending in responses.

**Engineer B:** Single place for hashing: auth.service (register, and any future password change). Controllers never see plain passwords except to pass to service; service returns DTOs without `password_hash`.

**Agreed:** bcrypt, cost 10. Hash only in auth.service; responses never include `password_hash`.

---

### 3. Refresh Token & Logout

**Engineer A:** On refresh, rotate: verify current refresh token, delete it from DB, issue new access + new refresh, store new refresh hash. Single use reduces replay risk. Logout = delete refresh token(s) for the user (or for the token ID if we store one).

**Engineer B:** Logout can accept `refreshToken` in body; we hash it and delete that row. Optional: support “logout all” by `userId` for admin. Keep refresh endpoint idempotent in terms of “one refresh token use”: after one successful refresh, that token is invalid.

**Agreed:** Refresh = verify → delete old refresh → issue new access + new refresh → store new refresh hash. Logout = body has `refreshToken` → delete that token from DB. No “logout all” in v1.

---

### 4. Folder Structure & Layering

**Engineer B:** Auth lives under `backend/src/modules/auth/`: `auth.routes.js` → `auth.controller.js` → `auth.service.js`. Validation in `auth.validation.js` (called from controller or as middleware). Service uses `pool` from `config/database.js` and never touches `req`/`res`. Middleware in `backend/src/middleware/`: one for JWT verification and one for role checks.

**Engineer A:** Middleware should set `req.user = { id, email, role }` from the verified access token so downstream code doesn’t parse JWT again. Role middleware should run after auth so `req.user` is always set.

**Agreed:**  
- **Auth module:** `auth.routes.js`, `auth.controller.js`, `auth.service.js`, `auth.validation.js`.  
- **Middleware:** `authMiddleware.js` (verify JWT, set `req.user`), `roleMiddleware.js` (e.g. `requireRole(['admin'])`).  
- **Flow:** routes → validation (inline or middleware) → controller → service → DB.

---

### 5. Validation

**Engineer B:** Prefer minimal deps: validation in `auth.validation.js` as plain JS functions that return `{ error }` or `{ value }`. Controllers call them and return 400 with error message when `error` is set.

**Engineer A:** Validate email format, password min length (e.g. 8), and required fields. For refresh/logout, require `refreshToken` in body.

**Agreed:** No Joi for now. Validation functions in `auth.validation.js`; controller checks result and returns 400 on error.

---

### 6. Register Flow

**Engineer B:** Register creates `users` row and, based on role, one of `patients` or `doctors` in the same transaction. Admin/reception can be added later via a separate flow; register endpoint accepts only `patient` and `doctor`.

**Engineer A:** Require strong password and unique email. Return 409 if email exists. On success return 201 and tokens (same shape as login) so the user is logged in after register.

**Agreed:** Register body: `email`, `password`, `role` (`patient` | `doctor`), plus role-specific fields (e.g. `first_name`, `last_name` for both; patient: `date_of_birth`, `gender`, `phone`, `address`, `blood_group`; doctor: `specialization`, `qualification`, `consultation_fee`). Single transaction: insert user, then insert patient or doctor. Return access + refresh tokens and user DTO (no `password_hash`).

---

## FINAL Agreed Architecture

| Concern | Decision |
|--------|-----------|
| **Access token** | JWT, 15 min, payload `{ userId, email, role }`, signed with `JWT_SECRET` |
| **Refresh token** | JWT, 7 days, stored as hash in `refresh_tokens`; rotation on use |
| **Password** | bcrypt, cost 10; hash only in auth.service |
| **Middleware** | `authMiddleware.js`: verify JWT, set `req.user`. `roleMiddleware.js`: `requireRole(roles)` |
| **Validation** | `auth.validation.js`: plain JS, return `{ error }` or `{ value }` |
| **Layer** | routes → controller → service → DB (pool); no business logic in controller |
| **Register** | User + patient or doctor in one transaction; return tokens |
| **Logout** | Body `refreshToken`; delete that token from DB |
| **Get current user** | GET /auth/me, auth required; return user + profile (patient/doctor) without `password_hash` |

### Auth Endpoints

| Method | Endpoint | Body | Auth | Description |
|--------|----------|------|------|-------------|
| POST | /api/v1/auth/register | email, password, role, ... | — | Create user + profile; return tokens |
| POST | /api/v1/auth/login | email, password | — | Return access + refresh tokens |
| POST | /api/v1/auth/refresh | refreshToken | — | Rotate refresh; return new tokens |
| POST | /api/v1/auth/logout | refreshToken | optional | Invalidate refresh token |
| GET | /api/v1/auth/me | — | access token | Current user + profile |

### Database

- Use existing `users`, `patients`, `doctors` tables.
- Add `refresh_tokens` table (migration 005): `id`, `user_id`, `token_hash`, `expires_at`, `created_at`.

### File Layout

```
backend/src/
├── config/
│   ├── database.js
│   └── env.js              # Validate JWT_SECRET, etc. on load (optional)
├── middleware/
│   ├── authMiddleware.js   # JWT verify, req.user
│   └── roleMiddleware.js   # requireRole([...])
├── modules/auth/
│   ├── auth.controller.js
│   ├── auth.service.js
│   ├── auth.routes.js
│   └── auth.validation.js
├── utils/
│   ├── ApiError.js
│   └── asyncHandler.js
├── db/
│   └── migrations/
│       └── 005_create_refresh_tokens.sql
├── app.js
└── server.js
```

This document is the agreed spec for implementing the auth module.
