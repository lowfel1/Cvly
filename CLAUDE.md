# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Cvly** is an AI-powered job application platform (resume analysis, cover letter generation, interview prep) built as a monorepo with a Next.js frontend and FastAPI backend, connected to a Supabase PostgreSQL database.

## Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev      # Dev server on localhost:3000
npm run build    # Production build
npm run lint     # ESLint
```

### Backend (FastAPI)
```bash
cd backend
source venv/Scripts/activate   # Windows: venv\Scripts\activate
uvicorn main:app --reload       # Dev server on localhost:8000
```

### Database Migrations (Alembic)
```bash
cd backend
alembic revision --autogenerate -m "description"
alembic upgrade head
```

## Architecture

### Stack
- **Frontend**: Next.js 16 (App Router) + React 19 + TypeScript + Tailwind CSS 4
- **Backend**: FastAPI + SQLAlchemy 2 + Alembic + psycopg2
- **Database**: Supabase PostgreSQL (also used for file storage — resumes/PDFs)
- **Auth**: Custom JWT via `python-jose`; tokens stored in localStorage (`cvly_token`) + cookies
- **AI**: Anthropic Claude API (resume parsing, cover letter generation)

### Frontend Structure
- `app/(auth)/` — Route group for login/register with split-screen layout
- `components/auth/` — `LoginForm`, `RegisterForm` with client-side validation and password strength
- `components/landing/` — Marketing landing page sections
- `components/ui/` — Reusable `Button`, `Input` primitives
- `hooks/useAuth.ts` — Central auth hook: `{ user, isAuth, loading, error, login, register, logout }`
- `lib/api.ts` — FastAPI client; base URL from `NEXT_PUBLIC_API_URL` (default `http://localhost:8000`)
- `lib/auth.ts` — JWT utilities: save/get/remove token, decode payload, check expiry
- `lib/supabase.ts` — Supabase client for file uploads
- `types/index.ts` — Shared TypeScript interfaces (`User`, `TokenResponse`, `ApiError`, etc.)
- `proxy.ts` — Route protection rules (protected/auth routes); **not yet wired to middleware**

### Backend Structure
```
backend/
├── main.py              # FastAPI app + CORS (allows localhost:3000)
└── app/
    ├── api/routes/      # Endpoints (scaffold — needs auth routes)
    ├── database/        # DB connection + session (scaffold)
    ├── models/          # SQLAlchemy models (scaffold)
    └── services/        # Business logic: auth, JWT, AI (scaffold)
```

### Auth Flow
1. Frontend calls `POST /auth/register` or `POST /auth/login` via `lib/api.ts`
2. Backend returns `{ access_token, token_type: "bearer" }`
3. `lib/auth.ts` saves token to localStorage + cookie; decodes JWT payload client-side
4. `useAuth` hook reads token on mount, calls `GET /auth/me` to hydrate `user` state
5. Successful auth redirects to `/dashboard`

JWT payload shape: `{ sub/id, email, full_name, exp, created_at }`

## Environment Variables

**Frontend** (`.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

**Backend** (`.env`):
```
DATABASE_URL=postgresql://...
SUPABASE_URL=...
SUPABASE_Anon_KEY=...
JWT_SECRET=...
JWT_EXPIRE_DAYS=7
CLAUDE_API_KEY=sk-ant-...
FRONTEND_URL=http://localhost:3000
```

## Key Notes

- **Route protection**: `frontend/proxy.ts` defines protected routes but `middleware.ts` was deleted. Route guards need to be re-implemented in a new `frontend/middleware.ts`.
- **Backend is scaffolded**: `app/api/routes/`, `app/models/`, `app/database/`, `app/services/` directories exist but are empty. The FastAPI app only serves a health-check endpoint (`GET /`).
- **Social OAuth**: Google/Apple login buttons exist in the auth forms but are not implemented.
- **Tailwind color scheme**: Primary teal `#0f766e`, light `#ccfbf1`, dark `#0d6b63` — defined as CSS custom properties in `globals.css`.
- **PDF processing**: `pdfplumber`, `PyMuPDF`, `pypdfium2` are in `requirements.txt` for resume parsing (not yet implemented).
- **AGENTS.md warning**: Next.js 16 introduced breaking changes — consult `frontend/AGENTS.md` before upgrading dependencies.
