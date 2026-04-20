-- Recreates the missing `public.user_roles` table that `handle_new_user()` depends on.
-- Run this in Supabase SQL Editor BEFORE sql/seed_club_auth_users.sql.
--
-- Safe to re-run.

-- 1. Recreate user_roles (trigger handle_new_user references public.user_roles).
--    Casts to the existing app_role enum (the trigger already uses it, so it exists).
CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Make sure 'club' is a valid value in the enum (no-op if already present)
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'club';

-- The trigger handle_new_user() inserts here as the auth-service role.
-- Disable RLS so the trigger can always write (service_role bypass + trigger context).
ALTER TABLE public.user_roles DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT role, COUNT(*) AS users
FROM public.user_roles
GROUP BY role
ORDER BY role;
