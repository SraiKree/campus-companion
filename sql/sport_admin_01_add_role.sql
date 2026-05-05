-- Step 1 of 2 — add the `sport_admin` value to the app_role enum.
-- Run this file FIRST and wait for it to succeed.
-- Then run sql/sport_admin_02_seed_user.sql.

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sport_admin';
