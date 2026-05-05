-- =====================================================================
-- Faculty Modules Schema
-- ---------------------------------------------------------------------
-- Adds: payslips, incentives, faculty_events_attended,
-- faculty_publications, faculty_patents, faculty_projects,
-- lor_requests, lab_marks, student_projects.
--
-- Designed to integrate with existing tables:
--   - hr_employees (employee_id link for payroll/incentives)
--   - profiles / auth.users (faculty_id link)
--   - students25 (student_roll link)
-- =====================================================================

-- =====================================================================
-- PAYROLL
-- =====================================================================
create table if not exists public.payslips (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  pay_month int not null check (pay_month between 1 and 12),
  pay_year int not null,
  basic_salary numeric(12,2) default 0,
  hra numeric(12,2) default 0,
  allowances numeric(12,2) default 0,
  incentive_total numeric(12,2) default 0,
  pf_deduction numeric(12,2) default 0,
  tax_deduction numeric(12,2) default 0,
  other_deductions numeric(12,2) default 0,
  net_pay numeric(12,2) generated always as
    (basic_salary + hra + allowances + incentive_total - pf_deduction - tax_deduction - other_deductions)
    stored,
  status text check (status in ('draft','generated','paid')) default 'generated',
  generated_at timestamptz not null default now(),
  paid_at timestamptz,
  remarks text,
  unique (employee_id, pay_month, pay_year)
);
create index if not exists idx_payslips_emp on public.payslips (employee_id);
create index if not exists idx_payslips_period on public.payslips (pay_year, pay_month);

-- =====================================================================
-- INCENTIVES
-- =====================================================================
create table if not exists public.incentives (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  category text not null check (category in ('research','teaching','extra-duty','publication','patent','event','other')),
  title text not null,
  amount numeric(12,2) not null default 0,
  awarded_date date not null default current_date,
  description text,
  status text check (status in ('pending','approved','paid','rejected')) default 'approved',
  approved_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index if not exists idx_incentives_emp on public.incentives (employee_id);
create index if not exists idx_incentives_category on public.incentives (category);

-- =====================================================================
-- EVENTS ATTENDED  (workshops, conferences, FDPs, seminars)
-- =====================================================================
create table if not exists public.faculty_events_attended (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references auth.users(id) on delete cascade,
  event_name text not null,
  event_type text check (event_type in ('workshop','conference','fdp','seminar','training','other')) default 'workshop',
  organizer text,
  location text,
  date_from date,
  date_to date,
  certificate_url text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_events_faculty on public.faculty_events_attended (faculty_id);
create index if not exists idx_events_date on public.faculty_events_attended (date_from);

-- =====================================================================
-- R&D — Publications, Patents, Projects
-- =====================================================================
create table if not exists public.faculty_publications (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  authors text,
  journal text,
  publisher text,
  publication_type text check (publication_type in ('journal','conference','book-chapter','book','other')) default 'journal',
  year int,
  doi text,
  url text,
  indexed_in text, -- e.g. "Scopus, SCI"
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_pub_faculty on public.faculty_publications (faculty_id);

create table if not exists public.faculty_patents (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  inventors text,
  application_no text,
  patent_no text,
  filing_date date,
  grant_date date,
  status text check (status in ('filed','published','granted','rejected')) default 'filed',
  jurisdiction text,
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_patent_faculty on public.faculty_patents (faculty_id);

create table if not exists public.faculty_projects (
  id uuid primary key default gen_random_uuid(),
  faculty_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  funding_agency text,
  amount numeric(14,2),
  start_date date,
  end_date date,
  status text check (status in ('proposed','ongoing','completed','closed')) default 'ongoing',
  description text,
  created_at timestamptz not null default now()
);
create index if not exists idx_project_faculty on public.faculty_projects (faculty_id);

-- =====================================================================
-- LOR — Letter of Recommendation Requests (student → faculty)
-- =====================================================================
create table if not exists public.lor_requests (
  id uuid primary key default gen_random_uuid(),
  student_roll text not null,
  student_name text,
  student_email text,
  faculty_id uuid not null references auth.users(id) on delete cascade,
  faculty_name text,
  purpose text not null,                    -- e.g. "MS Application", "PhD"
  target_institution text,                  -- e.g. "Stanford University"
  application_deadline date,
  message text,                             -- student's note to faculty
  status text not null check (status in ('pending','approved','rejected','completed')) default 'pending',
  faculty_response text,                    -- faculty's note when responding
  lor_url text,                             -- uploaded LOR document URL
  requested_at timestamptz not null default now(),
  decided_at timestamptz,
  completed_at timestamptz
);
create index if not exists idx_lor_faculty on public.lor_requests (faculty_id);
create index if not exists idx_lor_student on public.lor_requests (student_roll);
create index if not exists idx_lor_status on public.lor_requests (status);

-- =====================================================================
-- LAB EVALUATIONS — student lab marks
-- =====================================================================
create table if not exists public.lab_marks (
  id uuid primary key default gen_random_uuid(),
  student_roll text not null,
  student_name text,
  subject_code text not null,
  subject_name text,
  faculty_id uuid not null references auth.users(id) on delete cascade,
  lab_name text not null,                   -- e.g. "Lab 1: Sorting Algorithms"
  marks numeric(6,2) not null check (marks >= 0),
  total_marks numeric(6,2) not null default 100 check (total_marks > 0),
  evaluated_on date not null default current_date,
  remarks text,
  created_at timestamptz not null default now()
);
create index if not exists idx_lab_student on public.lab_marks (student_roll);
create index if not exists idx_lab_subject on public.lab_marks (subject_code);
create index if not exists idx_lab_faculty on public.lab_marks (faculty_id);

-- =====================================================================
-- STUDENT PROJECT APPROVALS (Faculty → HOD → Admin workflow)
-- =====================================================================
create table if not exists public.student_projects (
  id uuid primary key default gen_random_uuid(),
  student_roll text not null,
  student_name text,
  team_members text,                        -- comma-separated roll numbers for team projects
  title text not null,
  description text,
  domain text,                              -- e.g. "AI/ML", "IoT"
  guide_id uuid references auth.users(id) on delete set null,  -- faculty guide
  guide_name text,
  file_url text,                            -- proposal/report URL
  status text not null check (status in (
    'submitted','faculty-approved','faculty-rejected',
    'hod-approved','hod-rejected',
    'admin-approved','admin-rejected'
  )) default 'submitted',
  faculty_comments text,
  hod_comments text,
  admin_comments text,
  submitted_at timestamptz not null default now(),
  faculty_decided_at timestamptz,
  hod_decided_at timestamptz,
  admin_decided_at timestamptz
);
create index if not exists idx_project_student on public.student_projects (student_roll);
create index if not exists idx_project_guide on public.student_projects (guide_id);
create index if not exists idx_project_status on public.student_projects (status);

-- =====================================================================
-- DISABLE ROW LEVEL SECURITY
-- ---------------------------------------------------------------------
-- All access goes through server-side API routes that authenticate via
-- lib/faculty-auth.ts / lib/student-auth.ts and query through the
-- service-role admin client. RLS would block those calls unless we
-- wrote permissive policies. Disable instead.
-- =====================================================================
alter table public.payslips                  disable row level security;
alter table public.incentives                disable row level security;
alter table public.faculty_events_attended   disable row level security;
alter table public.faculty_publications      disable row level security;
alter table public.faculty_patents           disable row level security;
alter table public.faculty_projects          disable row level security;
alter table public.lor_requests              disable row level security;
alter table public.lab_marks                 disable row level security;
alter table public.student_projects          disable row level security;
