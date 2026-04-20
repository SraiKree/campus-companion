# Club Role — Remaining Work

Feature: separate login per club with Announcements / Events / Members / Facility Booking.
Full plan: `~/.claude/plans/sunny-wiggling-yao.md`

## Done
- [x] `sql/clubs_schema.sql` — clubs, club_members, club_announcements, club_events + 4 sample clubs
- [x] `types/erp.ts` — `'club'` added to `UserRole` union

## Remaining

### 1. Role plumbing — `utils/roles.ts`
- Add `'club'` to `STAFF_ROLES`
- `ROLE_LABELS.club = 'Club'`
- `ROLE_DASHBOARD_PATH.club = '/club'`
- Add `'club'` to the array inside `isValidRole`

### 2. Layout — `components/layout/ClubLayout.tsx`
Copy `FacultyLayout.tsx` structure. Sidebar nav:
- Dashboard → `/club`
- Announcements → `/club/announcements`
- Events → `/club/events`
- Members → `/club/members`
- Book Facility → `/club/bookings`

### 3. API routes (all new)
Each uses a local `authenticateClub(request)` helper that checks `role === 'club'` and loads the `clubs` row via `user_id`.

- `app/api/club/me/route.ts` — `GET` → `{ club, counts: { members, events, announcements } }`
- `app/api/club/announcements/route.ts` — GET/POST/DELETE
- `app/api/club/events/route.ts` — GET/POST/DELETE
- `app/api/club/members/route.ts` — GET/POST/DELETE
- `app/api/student/sports/courts/route.ts` — **edit**: relax role check to allow `['student','club']`; for club bookings set `student_name = club.name`, `student_roll_number = 'CLUB'`, `student_department = 'Club'`

### 4. Pages (all new, each uses `useRoleProtection('club')` + `<ClubLayout>`)
- `app/club/page.tsx` — dashboard (club name, advisor, 3 count tiles)
- `app/club/announcements/page.tsx` — list + create dialog (title, body)
- `app/club/events/page.tsx` — list + create dialog (name, date, time, venue, eligibility, max_participants)
- `app/club/members/page.tsx` — list + add-by-roll-number form
- `app/club/bookings/page.tsx` — trimmed copy of the student sports facility grid + booking dialog (~150 lines)

### 5. Verification
1. Run `sql/clubs_schema.sql` in Supabase SQL Editor.
2. Supabase dashboard → Authentication → add user `coding@mlrit.ac.in` with `user_metadata = {"role": "club"}`.
3. `INSERT INTO user_roles (user_id, role) VALUES ('<uuid>', 'club');`
4. `UPDATE clubs SET user_id = '<uuid>' WHERE name = 'Coding Club';`
5. `npm run dev` → Login (Staff tab → Club) → should land on `/club`.
6. Post an announcement, create an event, add a member, book a badminton court.
7. Log in as student → confirm sports booking still works.
8. `npx tsc --noEmit` clean.

## How to resume
From this project directory:
```
claude --continue
```
then say **"continue club work"** — the harness preserves task ids #12–#16 and the plan file.
