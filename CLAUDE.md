# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start development server (localhost:3000)
npm run build     # Production build
npm run lint      # ESLint checking
npm run start     # Start production server
```

No test runner is configured — there are no test files currently in the project.

## Architecture Overview

**Campus Companion** is a college ERP system with two user roles: **Student** and **Faculty**. It is built with Next.js App Router, Supabase (PostgreSQL), and Shadcn UI.

### Auth Flow

- `/` — Login page. Students authenticate with roll number + password (default password = roll number). Faculty use email + password.
- `POST /api/auth/login` — validates credentials, creates/signs in a Supabase Auth user, stores the session in `sessionStorage`.
- Auth state lives in `contexts/AuthContext.tsx` and is consumed app-wide. Route protection is done client-side (no server middleware).
- The admin Supabase client (`lib/supabase-admin.ts`) is used server-side for privileged operations (user creation, service-role queries).

### Routing

```
/                    → Login
/student/*           → Student pages (dashboard, attendance, grades, assignments, announcements, courses, profile, leave-request)
/faculty/*           → Faculty pages (dashboard, attendance, grades, assignments, announcements, timetable)
/app/api/*           → API routes for auth, student, and faculty operations
```

### Data Layer

- **No ORM** — raw SQL via `@supabase/supabase-js`.
- Public client: `lib/supabase.ts` (uses `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
- Admin client: `lib/supabase-admin.ts` (uses `SUPABASE_SERVICE_ROLE_KEY`, server-side only).
- Key tables: `students25`, `profiles`, `user_roles`, `attendance`, `grades`, `assignments`, `timetable`, `leave_requests`, `subjects`, `announcements`, `student_activity_log`, `student_login_sessions`.
- Custom view: `student_attendance_summary`. RPC function: `get_student_attendance_by_date_range()`.
- All SQL schema and seed files live in the `sql/` folder (one file per feature, e.g. `sql/hostel_schema.sql`).

### Component Patterns

- All page-level components are client components (`'use client'`).
- Data fetching uses **TanStack Query** via custom hooks in `hooks/` (e.g., `useStudentDashboard`, `useFacultyAttendance`).
- Large dashboard components live in `components/pages/` (StudentDashboard.tsx ~28KB, FacultyDashboard.tsx ~19KB).
- UI primitives are Shadcn UI components in `components/ui/` — do not hand-roll replacements for things Shadcn already provides.
- All TypeScript interfaces for domain entities (User, AttendanceRecord, Grade, Assignment, etc.) are in `types/erp.ts`.

### Environment Variables

Required in `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```
