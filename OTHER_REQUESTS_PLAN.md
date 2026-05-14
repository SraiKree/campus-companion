# Other Requests Backend — Implementation Plan

Status: **Not implemented.** This document captures the design so it can be picked up later. Do not act on it yet.

## Why this exists

The Student → Requests page has two tabs:

- **Leave & Gate Pass** — fully wired. Writes to `leave_requests` via `POST /api/student/leave-requests`, displays real rows by `pending | approved | rejected`.
- **Other Requests** — UI is built (academic / hostel / financial categories with approval-chain visualization) but the submission is a 1-second `setTimeout` simulation and the "My Requests" table reads from a hardcoded `mockRequests` array. Nothing persists.

This plan is the work needed to make the Other Requests tab real.

## Out of scope

- Approval UIs for faculty / HOD / warden / accounts / principal. This plan only covers the student-side write and read paths plus a basic status-transition endpoint. Each approver role will need its own page in a follow-up.
- New approver roles: the approval chain references `warden`, `accounts`, `hostel head`. `user_roles` already has `hostel`, `hod`, `principal`. Decide whether to reuse those or add new ones before starting.

## 1. Database schema

Two new tables.

### `student_requests`

```sql
CREATE TABLE public.student_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('academic', 'hostel', 'financial')),
  request_type text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  document_url text,                       -- optional attached file (Supabase Storage)
  current_step integer NOT NULL DEFAULT 0, -- index into the approval chain
  overall_status text NOT NULL DEFAULT 'pending'
    CHECK (overall_status IN ('pending', 'approved', 'rejected')),
  rejected_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_student_requests_student ON public.student_requests(student_id, created_at DESC);
CREATE INDEX idx_student_requests_status ON public.student_requests(overall_status);
```

### `student_request_steps`

One row per approval step per request. Lets each approver act independently and lets the UI render the pipeline.

```sql
CREATE TABLE public.student_request_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id uuid NOT NULL REFERENCES public.student_requests(id) ON DELETE CASCADE,
  step_index integer NOT NULL,             -- 0-based position in the chain
  role text NOT NULL,                      -- 'faculty', 'hod', 'principal', 'warden', 'hostel', 'accounts'
  label text NOT NULL,                     -- display label
  status text NOT NULL DEFAULT 'upcoming'
    CHECK (status IN ('upcoming', 'current', 'completed', 'rejected')),
  acted_by uuid REFERENCES auth.users(id),
  acted_at timestamptz,
  comment text,
  UNIQUE (request_id, step_index)
);

CREATE INDEX idx_request_steps_role_status ON public.student_request_steps(role, status);
```

When a request is created, its step rows are inserted from the approval chain corresponding to `category`. The first step starts at `current`; the rest at `upcoming`.

## 2. Approval chains (lives in `lib/`)

Already in code at `app/student/requests/page.tsx`:

```ts
academic:  ['faculty', 'hod', 'principal']
hostel:    ['warden', 'hostel']
financial: ['accounts', 'principal']
```

Extract to `lib/request-chains.ts` so server and client share one source of truth.

## 3. Supabase Storage

Create a bucket `request-documents`:

- Folder structure: `{student_id}/{request_id}/{filename}`
- Max file size: 5 MB (enforced client-side and via bucket policy)
- Allowed MIME types: `image/jpeg`, `image/png`, `application/pdf`
- Bucket visibility: **private** — generate signed URLs (1 hour) when displaying.

RLS policies on the bucket:

- INSERT: only the authenticated student can upload to their own `{student_id}/...` prefix.
- SELECT: the owning student, plus any role that appears in the request's approval chain (joined via `student_request_steps`).

## 4. API endpoints

### `POST /api/student/requests`

- Body: `{ category, request_type, subject, description, document_url? }`
- Auth: Bearer token, role `student`.
- Inserts into `student_requests`, then inserts the chain into `student_request_steps` (first step `current`).
- Returns the new row with its steps.

### `GET /api/student/requests`

- Auth: Bearer token, role `student`.
- Returns the caller's own requests joined with their steps, ordered `created_at desc`.

### `POST /api/student/requests/upload`

- Multipart file upload. Server uploads to Storage with the path described above, returns the storage key (NOT a signed URL).
- The form holds the key and includes it as `document_url` when calling `POST /api/student/requests`.

### `PATCH /api/requests/[id]/steps/[step_index]` (approver-side)

- Auth: Bearer token, role must match the step's `role`.
- Body: `{ action: 'approve' | 'reject', comment? }`
- Approve: marks the current step `completed`, sets the next step to `current`, or sets `overall_status='approved'` if it was the last step.
- Reject: marks the step `rejected`, sets `overall_status='rejected'`, freezes remaining steps.

This is the only endpoint approvers need to act on requests. They'll each get a list page that queries by `role = their role AND status = 'current'`.

## 5. Frontend changes

In `app/student/requests/page.tsx`:

1. Delete the `mockRequests` array.
2. In `OtherRequestsTab`, add a `useEffect` that fetches `GET /api/student/requests` on mount and after each submission. Replace `filteredRequests` source.
3. `handleSubmit` becomes real:
   - If a file is attached, `POST /api/student/requests/upload` first → get key.
   - `POST /api/student/requests` with the body (and key as `document_url`).
   - Refetch the list.
4. The "View Request" dialog already renders steps — just feed it real data.

## 6. Sequencing

Recommended order so each step is verifiable on its own:

1. SQL migration (tables + indexes). Run on a branch.
2. `lib/request-chains.ts` extraction. No behavior change yet.
3. `POST` + `GET` student endpoints. Test with a mock UI submit (no upload). Confirm rows appear.
4. Storage bucket + upload endpoint. Add file input. Confirm files land in the bucket and the URL is stored.
5. Approver `PATCH` endpoint + a single faculty-approver page as a thin proof.
6. Build out remaining approver UIs in their own role layouts.

## Open questions to resolve before starting

- Do we add `warden` and `accounts` roles to `user_roles`, or reuse `hostel` + a yet-undefined accounts role?
- Should the student be able to delete or cancel their own request before any approver acts? (Probably yes — adds a `cancelled` overall_status.)
- File-attachment quota per student? (Bucket-level cap is enough for now.)
- Notifications on status change? (Out of scope here; the `student_request_steps` table is enough to power an in-app feed later.)
