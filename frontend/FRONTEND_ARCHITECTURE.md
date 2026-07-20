# Frontend Architecture — Design Discussion & Decisions

## Simulated Discussion: Engineer A (Frontend Architect) vs Engineer B (Product Designer)

---

### 1. React folder structure

**Engineer A (Frontend Architect):** Keep a flat, role-agnostic structure under `src/`: `api/` for all backend calls, `components/` for reusable UI (grouped as `common/`, `layout/`, `auth/`), `pages/` for route-level screens, `hooks/` for shared logic (auth, API), `routes/` for routing and guards, `utils/` for constants and helpers. Avoid a deep feature-based tree for now so we don’t over-split before we see real duplication.

**Engineer B (Product Designer):** Staff and patients need to find things quickly. One place for “where do I go after login?” (dashboard) and clear entry points (login, then role-specific home). The folder structure should make it obvious where to add a new page or a new API.

**Agreed:** Use the requested layout:

- **api/** — Axios client and API modules (auth, doctors, patients, appointments, queue, admin).
- **components/** — `common/` (Button, Input, Card, Table), `layout/` (Header, Sidebar, MainLayout), `auth/` (LoginForm, ProtectedRoute).
- **pages/** — One folder; each page is a single file (LoginPage, Dashboard, etc.). Role-specific content is handled inside pages or via route config, not by separate “feature” folders.
- **hooks/** — useAuth, useApi (optional), and later usePolling for queue.
- **routes/** — AppRouter (route list + role-based redirects), PrivateRoute (auth + optional role check).
- **utils/** — constants (API base URL, roles), helpers (date/time, storage keys).

No `store/` or `features/` for v1; add later if we introduce global client state or clear feature boundaries.

---

### 2. Page structure

**Engineer A:** Map one primary URL to each “screen” the user sees. Login is a single page; post-login we have a single “app” shell (layout + outlet). Dashboard is the default landing after login; its content varies by role (patient / doctor / admin). Other pages: Patient (My Appointments, My Queue / Get Token), Doctor (My Queue, My Appointments), Admin (Dashboard, Queues, Doctors, Patients, Appointments). Use a single Dashboard that branches on role, or separate DashboardPatient, DashboardDoctor, DashboardAdmin — single Dashboard with role-based content keeps the URL simple and avoids duplicate layout code.

**Engineer B:** Users should land on the most useful screen: patients see “my appointments” or “get a token”, doctors see “my queue”, admins see the admin dashboard. So “Dashboard” = role-specific first screen. Other pages are clearly named: Login, Dashboard, and for each role only the pages that role can see (no empty menus).

**Agreed:**

- **LoginPage** — Single route `/login`; no role-specific login UI.
- **Dashboard** — Single route `/` or `/dashboard`; component switches content by `user.role` (patient | doctor | admin). Shows: Patient — summary + quick actions (book appointment, get token); Doctor — my queue + today’s appointments; Admin — dashboard metrics (from `/admin/dashboard`) and links to queues, workload, stats.
- **Role-specific pages** (add as needed): e.g. Appointments (list/book), Queue (patient: get token / doctor: manage queue), Admin Queues, Admin Doctors, Admin Patients. These are added incrementally; the router and layout are set up so new pages are just new route entries and nav items for the right role.

---

### 3. Components needed

**Engineer A:** Start with a small set of primitives and one layout so we can compose all early screens without custom markup everywhere. **Common:** Button, Input, Card, Table (or DataTable), LoadingSpinner, ErrorMessage. **Layout:** MainLayout (sidebar + main area), Header (title + user menu), Sidebar (nav links filtered by role). **Auth:** ProtectedRoute (redirect to login if not authenticated), optional RoleGuard (redirect or 403 if wrong role). LoginForm can live inside LoginPage or as a component in `components/auth/`.

**Engineer B:** Hospitals need clarity and low cognitive load: big touch targets, clear labels, and obvious “current” page in the nav. Reusable Card and Table help keep lists and dashboards consistent. A single MainLayout with Sidebar that shows only allowed links is enough for v1.

**Agreed:**

- **common:** Button, Input, Card, Table, LoadingSpinner, ErrorMessage (stub or minimal for now).
- **layout:** MainLayout (children + sidebar + header), Header, Sidebar (nav items by role).
- **auth:** ProtectedRoute (requires auth, redirects to /login), optional RoleGuard (requires role(s)), LoginForm (optional; can be inlined in LoginPage initially).

Implement only what’s needed for the first routes; stubs are fine for the rest.

---

### 4. API service layer

**Engineer A:** One Axios instance in `api/client.js`: base URL from env, request interceptor to attach `Authorization: Bearer <accessToken>`, response interceptor to on 401 try refresh then retry, and on refresh failure redirect to login. Separate modules (e.g. `auth.api.js`, `doctors.api.js`) that import the client and export functions (login, getMe, listDoctors, …). No API logic inside components; pages/hooks call these functions.

**Engineer B:** Errors should be surfaced in a simple way (e.g. toast or inline message). The client can expose a small callback or we handle errors in the caller; for v1, callers can catch and set local error state. CORS and base URL must be configurable for dev vs production.

**Agreed:**

- **api/client.js** — Create axios instance with `baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1'`, request interceptor to add Bearer token from auth context (or storage), response interceptor: on 401 call refresh; if refresh fails clear auth and redirect to /login; on success retry original request. Export the instance.
- **api/auth.api.js**, **api/doctors.api.js**, etc. — Import client, export functions (e.g. `login(credentials)`, `getMe()`, `listDoctors(params)`). Backend base path is `/api/v1`; each module matches one backend area (auth, doctors, patients, appointments, queue, admin).

---

### 5. State management approach

**Engineer A:** Avoid global state until needed. Auth state (user, accessToken, role) is needed in many places (router, API client, header); use React Context (AuthContext) with a single provider. Store access token in memory (ref or state) and optionally persist in sessionStorage for refresh-on-reload; refresh token only in memory or in a single place (e.g. sessionStorage) if we need to restore session. Server state (lists, dashboard data) can be useState + useEffect for v1; we can add React Query later for caching and polling.

**Engineer B:** Users should stay logged in across tab refresh if the refresh token is still valid. So we need to restore auth from storage on load (e.g. try refresh on app init). No need for Redux or Zustand for the first version.

**Agreed:**

- **Auth:** AuthContext holds user, accessToken, role, login, logout, refresh. Provider wraps the app. On mount, if we have a stored refresh token (or access token), try refresh or getMe to restore session; otherwise show login for protected routes.
- **Server state:** Fetch in pages with useState + useEffect; pass setState or callbacks where needed. No React Query or global store in v1; introduce later if we see duplication or need caching/polling patterns.

---

### 6. Authentication handling

**Engineer A:** Login: POST credentials → receive accessToken + refreshToken + user; store tokens (memory + optional sessionStorage), set user in context, redirect to Dashboard. Logout: call backend logout with refresh token, clear context and storage, redirect to login. Every protected route is wrapped in ProtectedRoute; optional RoleGuard for admin-only (or doctor-only) routes. API client reads accessToken from context (or a getter provided by context); on 401, call refresh with refreshToken, then retry; if refresh fails, logout and redirect.

**Engineer B:** After login, always send the user to the same place (Dashboard); the dashboard then shows role-specific content. No “remember me” for v1; sessionStorage is enough so that closing the tab logs them out unless we later add refresh-token persistence. Clear error message on login failure (invalid credentials / network).

**Agreed:**

- **Login flow:** Submit → auth.api.login → store tokens + user in AuthContext; redirect to `/` or `/dashboard`.
- **Logout:** auth.api.logout(refreshToken), clear context and storage, redirect to `/login`.
- **Persistence:** Access token in context (and optionally sessionStorage for retries); refresh token in sessionStorage so we can refresh on 401 and on page reload. On app init, if refresh token exists, call refresh and set user/tokens.
- **Protected routes:** ProtectedRoute checks context (user/token); if missing, redirect to `/login`. RoleGuard (optional) checks role and redirects or shows “Forbidden” for wrong role.

---

### 7. Live queue updates strategy

**Engineer A:** Backend has no WebSockets; so we poll. For “current queue” views (doctor queue, patient’s token status), poll every 5–10 seconds when the page is visible. Use a simple hook (e.g. usePolling(callback, interval)) that runs callback on mount and on interval, and optionally pauses when tab is hidden (Page Visibility API) to avoid unnecessary requests. No need for WebSockets in v1.

**Engineer B:** Staff and patients need to see queue changes within a few seconds. Polling every 5–10 seconds is acceptable; show a “Last updated” label so users know the data is live. If we add a large queue board later, we can increase frequency or add WebSockets then.

**Agreed:**

- **Strategy:** Polling only. When we implement queue views, use a `usePolling` hook (e.g. 5–10 s interval) to refetch queue data. Optionally pause when document.hidden to save load.
- **Placeholder:** Define the hook signature and a comment in the architecture; implement when building queue pages.

---

## Final architecture summary

| Concern | Decision |
|--------|----------|
| **Folder structure** | `src/api`, `src/components` (common, layout, auth), `src/pages`, `src/hooks`, `src/routes`, `src/utils`. |
| **Pages** | LoginPage, Dashboard (role-based content). Add Appointments, Queue, Admin* as we build. |
| **Components** | common: Button, Input, Card, Table, LoadingSpinner, ErrorMessage. layout: MainLayout, Header, Sidebar. auth: ProtectedRoute, RoleGuard. |
| **API layer** | Axios instance in `api/client.js` (base URL, Bearer token, 401 refresh retry). Modules: auth, doctors, patients, appointments, queue, admin. |
| **State** | AuthContext for user + tokens; server state in local component state (useState/useEffect). |
| **Auth** | Login → store tokens + user in context (+ sessionStorage for refresh). ProtectedRoute for private routes. API client interceptors for Bearer and 401 refresh. |
| **Live queue** | Polling (e.g. 5–10 s) via usePolling when we build queue views; no WebSockets in v1. |

---

## Role-to-routes (initial)

- **Patient:** `/`, `/dashboard`, (later: `/appointments`, `/queue`).
- **Doctor:** `/`, `/dashboard`, (later: `/queue`, `/appointments`).
- **Admin:** `/`, `/dashboard`, (later: `/admin/queues`, `/admin/doctors`, `/admin/patients`, etc.).

All roles: `/login` when not authenticated. Single Dashboard component that branches on `user.role`.

This document is the reference for implementing the frontend.
