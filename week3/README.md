# Capstone Project Manager

Full-stack project management application built for a 2-week capstone. Manage **Projects**, **Tasks**, and **Comments** with authentication, file uploads, dashboards, and data export.

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express.js |
| Database | MySQL / MariaDB (Railway-ready) |
| Auth | JWT (localStorage) |
| Email | Nodemailer (password reset) |
| Files | Multer |
| Theme | Dark/Light mode via localStorage |

## Features

- JWT authentication with protected routes and logout redirect
- Forgot / reset password flow (email via SMTP; dev fallback URL in console)
- Full CRUD for Projects, Tasks, and Comments
- Server-side search & filter on all list endpoints
- File uploads (profile avatars, project/task documents)
- Dashboard with interactive Recharts visualizations
- CSV and PDF export on data tables
- Client + server form validation
- Responsive mobile/desktop UI
- All secrets via `.env` (no hardcoded credentials)

## Project structure

```
week3/
├── client/                 # React frontend
├── server/                 # Express API
│   ├── database/schema.sql # Run once to create tables
│   └── src/
├── package.json            # Root convenience scripts
└── README.md
```

## Quick start

### 1. Database

Create a MySQL/MariaDB database and run the schema:

```bash
mysql -u root -p < server/database/schema.sql
```

Or paste `server/database/schema.sql` into Railway's MySQL console.

### 2. Backend

```bash
cd server
npm install
copy .env.example .env    # Windows
# Edit .env with DB credentials, JWT_SECRET, SMTP settings
npm run dev
```

API runs at `http://localhost:5000`  
Health check: `GET /api/health`

### 3. Frontend

```bash
cd client
npm install
copy .env.example .env
npm run dev
```

App runs at `http://localhost:5173` (proxies `/api` to backend).

### From root (optional)

```bash
npm run install:all
npm run dev:server   # terminal 1
npm run dev:client   # terminal 2
```

## Environment variables

### Server (`server/.env`)

| Variable | Description |
|----------|-------------|
| `PORT` | API port (default 5000) |
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` | MySQL connection |
| `JWT_SECRET`, `JWT_EXPIRES_IN` | Auth tokens |
| `CLIENT_URL` | Frontend URL for CORS & reset links |
| `SMTP_*`, `EMAIL_FROM` | Nodemailer config |
| `UPLOAD_DIR`, `MAX_FILE_SIZE_MB` | File upload settings |

### Client (`client/.env`)

| Variable | Description |
|----------|-------------|
| `VITE_API_URL` | API base URL (`/api` for dev proxy, full URL in production) |

## Deployment (Railway)

1. **MySQL** — Add MySQL plugin; run `schema.sql` against the database.
2. **Server** — Deploy `server/` folder; set all env vars from `.env.example`.
3. **Client** — Build with `VITE_API_URL=https://your-api.railway.app/api`, deploy `dist/` to Vercel/Netlify/Railway static.

## API overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/forgot-password` | Request reset email |
| POST | `/api/auth/reset-password` | Set new password |
| GET | `/api/auth/me` | Current user (auth) |
| CRUD | `/api/projects` | Projects |
| CRUD | `/api/tasks` | Tasks |
| CRUD | `/api/comments` | Comments |
| GET | `/api/dashboard/stats` | Dashboard data |
| POST/GET/DELETE | `/api/files` | File uploads |

All CRUD routes support `?search=`, `?status=`, `?limit=`, `?offset=` query params where applicable.

## License

ISC
