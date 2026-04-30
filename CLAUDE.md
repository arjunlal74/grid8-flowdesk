# Grid8 — Claude Code Reference

## Project
Internal org management platform. Decoupled architecture:
- **Frontend**: React 18 + Vite + Tailwind + TanStack Query v5 + Zustand — `frontend/`
- **Backend**: Node.js + Express + Prisma + MySQL 8 + JWT — `backend/`
- **Docker**: 3 containers — `db` (MySQL 8), `backend` (:3001 internal), `frontend` (nginx :80)

## Running locally

```bash
cd /Users/arjunlal/Learning/Flowdesk/grid8

# Start all containers (production-like)
docker compose -f docker/docker-compose.yml up -d --build

# Rebuild only frontend
docker compose -f docker/docker-compose.yml up -d --no-deps --build frontend

# Rebuild only backend
docker compose -f docker/docker-compose.yml up -d --no-deps --build backend

# View backend logs
docker logs grid8_backend --tail 30

# Access app
open http://localhost
```

## Default credentials
- **Admin**: `admin@grid8.local` / `Admin@123`

## Key env facts (`backend/.env`)
- `DATABASE_URL` must use `db` (Docker service name), not `localhost`
- `PORT=3001` — must match nginx proxy target (`backend:3001`)

## Architecture decisions

### Drawers & Modals — MUST use `createPortal`
All `<Drawer>` and `<Modal>` components render via `ReactDOM.createPortal(…, document.body)`.
**Why**: `main` in AppShell has `overflow-x: hidden`, which Chrome treats as a scroll container and uses as the containing block for `position: fixed` children — causing drawers to start below the sticky header (52px gap). Portal bypasses this entirely.

### Drawer.jsx (`frontend/src/components/ui/Drawer.jsx`)
- Renders into `document.body` via `createPortal`
- Locks body scroll on open + compensates scrollbar width via `paddingRight`

### Modal.jsx (`frontend/src/components/ui/Modal.jsx`)
- Renders into `document.body` via `createPortal`
- `z-index: 60` (above drawer at 50, above backdrop at 40)

### TaskDetailDrawer — custom drawer
`frontend/src/components/tasks/TaskDetailDrawer.jsx` has its own fixed-panel implementation (not using `Drawer.jsx`). It also uses `createPortal` for the same reason.

### nginx (`frontend/nginx.conf`)
- `client_max_body_size 10M` — needed for avatar uploads
- Proxies `/api` and `/uploads` → `http://backend:3001`

### Auth rate limiter (`backend/src/routes/auth.routes.js`)
- 50 attempts per 15-minute window (raised from default 5 for dev)
- `app.set('trust proxy', 1)` set in `app.js` — required because nginx sets `X-Forwarded-For`

### Employee status
- New employees are `isActive: true` by default — they can log in immediately
- Activate/Deactivate is only in the Employee Detail Drawer (removed from table)
- Both actions require confirmation modal before executing

## Frontend structure
```
src/
  api/           — axios API wrappers per entity
  components/
    ui/          — Drawer, Modal, Avatar, Badge, Button, etc.
    employees/   — NewEmployeeDrawer, EmployeeDetailDrawer
    tasks/       — NewTaskDrawer, TaskDetailDrawer
    leads/       — NewLeadDrawer
    projects/    — NewProjectDrawer
    layout/      — AppShell, Sidebar, PageLayout
  pages/         — one folder per entity
  store/         — Zustand: authStore, themeStore
  styles/        — index.css (CSS variables for dark/light theme)
```

## Theme
Dark mode by default. Toggle via sidebar. CSS variables on `:root` / `:root.light`.
Theme transitions use `html.theme-transitioning` class (250ms).

## Known issues / fixed
- `DATABASE_URL localhost→db` fixed in `.env`
- `PORT 3003→3001` fixed in `.env`
- `trust proxy` added to `app.js` for rate limiter
- Portal fix applied to all drawers to remove top gap
- `client_max_body_size 10M` in nginx for avatar uploads
