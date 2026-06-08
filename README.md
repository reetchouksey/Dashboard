# Employee Management Dashboard

A modern, fully-featured **Employee Management Dashboard** built with **React + Redux Toolkit**, featuring authentication, role-based access, attendance, leaves, departments, performance analytics, dark / light theme, and a beautiful responsive UI.

---

## Features

### Authentication & Authorization
- Email/password login with localStorage session persistence
- Protected routes with role-based access (`admin`, `employee`)
- Demo accounts pre-seeded in `db.json`

### Dashboard Overview
- Total Employees, Present Today, On Leave, Departments cards
- Performance bar chart (Recharts)
- Department headcount pie chart
- Recent activities feed
- Top performers list

### Employee Management
- Responsive employee table with avatars
- Add / Edit / Delete employees (Admin only)
- View detailed employee profile page
- Search by name, email, ID, designation
- Filter by department & status
- Pagination with page-size selector
- **Export to CSV**

### Attendance
- Mark Present / Absent / Leave per employee
- Date selector, summary cards, daily-trend line chart
- Monthly report with attendance percentage progress bars

### Leaves
- Apply leave (Casual / Sick / Earned)
- Auto-calculated days
- Admin can Approve / Reject pending leaves
- Stats cards + leaves-by-type bar chart

### Departments
- Beautiful card grid layout
- CRUD operations
- Department-wise employee count

### Performance Reports
- Average, top score, total reviews
- Performance trend over time (line chart)
- Top 5 performers (horizontal bar chart)
- Filterable monthly report table with rating bars

### Plus
- Dark / Light theme toggle (persisted)
- Notifications dropdown with unread badge
- Responsive sidebar (collapsible + mobile drawer)
- User profile editor
- Activity logs with search
- Settings page (theme, sidebar, notifications, danger zone)
- Toast notifications
- Loading, empty, error states throughout

---

## Tech Stack

| Layer            | Library                              |
| ---------------- | ------------------------------------ |
| UI               | React 18, React Router DOM v6        |
| State            | Redux Toolkit, React-Redux           |
| HTTP             | Axios with request/response interceptors |
| Charts           | Recharts                             |
| Icons            | React Icons (Feather set)            |
| Backend (mock)   | JSON Server                          |
| Build / Dev      | Vite                                 |
| Styling          | Pure CSS with theme-aware variables  |

---

## Folder Structure

```
src/
├── assets/                 # Static assets
├── components/
│   ├── common/             # Modal, Pagination, States, StatusBadge, ToastHost
│   └── employees/          # EmployeeForm
├── hooks/                  # useAuth, useToast, useDebounce
├── layouts/                # DashboardLayout, Sidebar, Topbar
├── pages/                  # Route-level pages
├── redux/
│   ├── slices/             # auth, employee, attendance, leave, department, ui
│   └── store.js
├── routes/                 # AppRoutes, ProtectedRoute
├── services/               # api.js + per-resource service modules
├── styles/                 # Global CSS with light/dark themes
├── utils/                  # constants, helpers
├── App.jsx
└── main.jsx
```

---

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start everything (frontend + JSON server) in one command

```bash
npm start
```

This launches:
- **JSON Server** on `http://localhost:5000`
- **Vite dev server** on `http://localhost:3000`

#### Or run them separately

```bash
npm run server    # JSON server only
npm run dev       # Vite only
```

### 3. Login

| Role     | Email                 | Password  |
| -------- | --------------------- | --------- |
| Admin    | `admin@company.com`   | `admin123`|
| Employee | `john@company.com`    | `john123` |

You can also click the demo buttons on the login page to auto-fill credentials.

---

## Available Scripts

| Command           | What it does                                         |
| ----------------- | ---------------------------------------------------- |
| `npm run dev`     | Start the Vite dev server                            |
| `npm run build`   | Production build                                     |
| `npm run preview` | Preview the production build locally                 |
| `npm run server`  | Start JSON Server with `db.json`                     |
| `npm start`       | Run the API + frontend concurrently                  |

---

## Environment

Set `VITE_API_URL` in a `.env` file to override the JSON Server URL (defaults to `http://localhost:5000`):

```
VITE_API_URL=http://localhost:5000
```

---

## API Endpoints (json-server)

All standard REST verbs are supported:

| Resource      | Endpoint           |
| ------------- | ------------------ |
| Users         | `/users`           |
| Employees     | `/employees`       |
| Departments   | `/departments`     |
| Attendance    | `/attendance`      |
| Leaves        | `/leaves`          |
| Performance   | `/performance`     |
| Activities    | `/activities`      |
| Notifications | `/notifications`   |

Examples:
```
GET    /employees
POST   /employees
PATCH  /employees/:id
DELETE /employees/:id
```

---

## Roles

- **Admin** — Full access: manage employees, departments, approve leaves, mark attendance for anyone.
- **Employee** — View dashboard, list employees, mark own attendance, apply for leave, view own profile.

The sidebar and action buttons hide automatically based on the active user's role.

---

## Build for Production

```bash
npm run build
```

Output goes to `dist/`.

---

## Deployment

### Option A — Single service on Render.com (recommended, free)

The Express server is configured to serve the built React SPA in production, so you only need **one URL**.

1. Push the repo to GitHub (already done).
2. Sign up at [render.com](https://render.com) and click **New → Blueprint**.
3. Connect your `Dashboard` repo. Render auto-detects [`render.yaml`](./render.yaml) and provisions a free Web Service.
4. Wait ~3 minutes for the first build. You'll get a URL like `https://ems-dashboard-xxxx.onrender.com`.
5. Open it on any device — login & sign-up will work end-to-end.

> ⚠️ **SQLite on free plans is ephemeral** — the database resets on every restart (and free Render services sleep after 15 min of inactivity). For persistent storage, either upgrade and attach a disk, or migrate to Postgres (Neon / Supabase have free tiers).

### Option B — Frontend on Vercel + backend on Render

If you've already deployed the frontend to Vercel and want to keep it there:

1. Deploy the backend separately on Render using `render.yaml` (as above) but pointing the start command at `npm run server` only — you'll still get an HTTPS URL.
2. In your **Vercel** project: **Settings → Environment Variables** → add:
   ```
   VITE_API_URL = https://your-backend.onrender.com
   ```
3. Redeploy the Vercel project. Login & sign-up will then call the Render backend.

> ⚠️ Both ends must be HTTPS or the browser will block the request as mixed content. Render and Vercel both give you HTTPS automatically.

---

## Customising

- **Theme colors** live in `src/styles/index.css` as CSS variables under `:root` and `[data-theme='dark']`.
- **Charts colors** are configured in `src/utils/constants.js` (`CHART_COLORS`).
- **Sidebar links** are declared in `src/layouts/Sidebar.jsx`.

---

## License

MIT — feel free to use this as a starting point for your own project.
