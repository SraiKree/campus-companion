-- Seed auth users + user_roles + clubs.user_id for every club in the `clubs` table.
-- Bypasses the Supabase Auth REST API — inserts directly into auth.users / auth.identities.
--
-- Safe to re-run. Password for every club is 'Club@2026' (bcrypt via pgcrypto).
-- Prerequisite: sql/fix_user_roles_table.sql must have been run.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.seed_one_club_user(p_name TEXT, p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
AS $fn$
DECLARE
  uid UUID;
  pw  TEXT := 'Club@2026';
BEGIN
  SELECT id INTO uid FROM auth.users WHERE email = p_email LIMIT 1;

  IF uid IS NULL THEN
    uid := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      created_at, updated_at, confirmation_token, email_change,
      email_change_token_new, recovery_token
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      uid,
      'authenticated',
      'authenticated',
      p_email,
      crypt(pw, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role','club','name', p_name),
      NOW(), NOW(), '', '', '', ''
    );

    INSERT INTO auth.identities (
      id, user_id, provider_id, identity_data, provider,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(),
      uid,
      uid::text,
      jsonb_build_object('sub', uid::text, 'email', p_email),
      'email',
      NOW(), NOW(), NOW()
    );
  ELSE
    UPDATE auth.users
    SET encrypted_password = crypt(pw, gen_salt('bf')),
        raw_user_meta_data = jsonb_build_object('role','club','name', p_name),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = uid;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'club'::public.app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'club'::public.app_role;

  UPDATE public.clubs SET user_id = uid WHERE name = p_name;

  RETURN uid;
END;
$fn$;

-- Run it for every club that still needs an auth user
SELECT name, contact_email, public.seed_one_club_user(name, contact_email) AS uid
FROM public.clubs
WHERE contact_email IS NOT NULL
ORDER BY name;

-- Verify
SELECT c.name, c.contact_email,
       c.user_id IS NOT NULL AS linked,
       ur.role AS user_role
FROM public.clubs c
LEFT JOIN public.user_roles ur ON ur.user_id = c.user_id
ORDER BY c.name;
