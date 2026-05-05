-- =====================================================================
-- HR Module Schema
-- ---------------------------------------------------------------------
-- HR is a separate role/portal that manages faculty as employees.
-- Tables here EXTEND the existing faculty/profiles records with
-- employment data. Faculty is matched by email (the canonical id used
-- across the auth system), with an optional user_id link.
-- =====================================================================

-- 1. Core employee record (one row per faculty staff member) ----------
create table if not exists public.hr_employees (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text not null unique,
  full_name text not null,
  employee_code text unique,
  department text,
  designation text,
  employment_type text check (employment_type in ('full-time','part-time','contract','visiting')) default 'full-time',
  status text check (status in ('active','on-leave','resigned','terminated')) default 'active',
  date_of_joining date,
  date_of_birth date,
  phone text,
  address text,
  emergency_contact text,

  -- Salary structure (optional, used by Payroll module)
  basic_salary numeric(12,2) default 0,
  hra numeric(12,2) default 0,
  allowances numeric(12,2) default 0,
  pf_deduction numeric(12,2) default 0,
  tax_deduction numeric(12,2) default 0,

  -- Leave balances
  casual_leave_balance int default 12,
  sick_leave_balance int default 10,
  earned_leave_balance int default 15,

  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_hr_employees_email on public.hr_employees (email);
create index if not exists idx_hr_employees_dept on public.hr_employees (department);
create index if not exists idx_hr_employees_status on public.hr_employees (status);

-- 2. Employee documents (uploaded files / certifications) -------------
create table if not exists public.hr_documents (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  doc_type text not null check (doc_type in (
    'aadhaar','pan','passport','degree','offer_letter','contract',
    'experience','id_proof','address_proof','other'
  )),
  title text not null,
  file_url text,
  uploaded_by uuid references auth.users(id),
  uploaded_at timestamptz not null default now()
);

create index if not exists idx_hr_documents_emp on public.hr_documents (employee_id);

-- 3. Performance reviews ----------------------------------------------
create table if not exists public.hr_performance_reviews (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references public.hr_employees(id) on delete cascade,
  review_period text not null, -- e.g. "2025-26 Annual" or "2025 Q4"
  rating numeric(3,1) check (rating between 0 and 10),
  strengths text,
  areas_to_improve text,
  reviewer_name text,
  review_date date not null default current_date,
  remarks text,
  created_at timestamptz not null default now()
);

create index if not exists idx_hr_reviews_emp on public.hr_performance_reviews (employee_id);

-- 4. Helpful view: HR employees joined with the existing profiles -----
-- Faculty are not stored in students25 — they live in profiles/auth.
-- This view gives HR a single read surface.
create or replace view public.hr_employee_overview as
select
  e.id,
  e.email,
  e.full_name,
  e.employee_code,
  e.department,
  e.designation,
  e.employment_type,
  e.status,
  e.date_of_joining,
  (e.basic_salary + e.hra + e.allowances - e.pf_deduction - e.tax_deduction) as net_salary,
  e.casual_leave_balance,
  e.sick_leave_balance,
  e.earned_leave_balance
from public.hr_employees e;

-- 5. updated_at trigger ------------------------------------------------
create or replace function public.set_hr_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists trg_hr_employees_updated on public.hr_employees;
create trigger trg_hr_employees_updated
  before update on public.hr_employees
  for each row execute function public.set_hr_updated_at();

-- 6. Seed: register the HR portal account in user_roles ---------------
-- Run this AFTER creating an auth user (e.g. hr@mlrit.ac.in) in the
-- Supabase dashboard, replacing the user_id below.
-- insert into public.user_roles (user_id, role) values
--   ('REPLACE-WITH-AUTH-USER-ID', 'hr')
--   on conflict (user_id) do update set role = excluded.role;

-- 7. Disable Row Level Security ---------------------------------------
-- All HR access goes through server-side API routes that use the
-- service-role admin client + lib/hr-auth.ts gating. RLS would block
-- those calls unless we wrote permissive policies. Disable instead.
alter table public.hr_employees           disable row level security;
alter table public.hr_documents           disable row level security;
alter table public.hr_performance_reviews disable row level security;
