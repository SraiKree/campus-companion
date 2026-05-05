-- =====================================================================
-- Seed an HR auth user + grant the `hr` role
-- ---------------------------------------------------------------------
-- ⚠  RUN IN TWO STEPS in the Supabase SQL editor.
--    Postgres requires new enum values to be COMMITTED before they can
--    be used in the same transaction. Running the whole file at once
--    will fail with: "unsafe use of new value 'hr' of enum type app_role".
-- =====================================================================


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║ STEP 1 — Run this block on its own first.                        ║
-- ║ Highlight just these lines, click Run, wait for success.         ║
-- ╚══════════════════════════════════════════════════════════════════╝

ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'hr';


-- ╔══════════════════════════════════════════════════════════════════╗
-- ║ STEP 2 — After Step 1 succeeds, run everything BELOW this line.  ║
-- ║ Highlight from here to the end of the file, then click Run.      ║
-- ╚══════════════════════════════════════════════════════════════════╝

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.seed_one_hr_user(
  p_email    TEXT,
  p_name     TEXT,
  p_password TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $fn$
DECLARE
  uid UUID;
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
      crypt(p_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('role','hr','name', p_name),
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
    SET encrypted_password = crypt(p_password, gen_salt('bf')),
        raw_user_meta_data = jsonb_build_object('role','hr','name', p_name),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = uid;
  END IF;

  -- Grant / refresh the hr role (handle_new_user may have inserted it
  -- already via trigger; this guarantees the final state regardless).
  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'hr'::public.app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'hr'::public.app_role;

  RETURN uid;
END;
$fn$;

-- Create the default HR account.
-- Edit email/name/password below if you want different values.
SELECT public.seed_one_hr_user(
  'hr@mlrit.ac.in',   -- email
  'HR Office',        -- display name
  'Hr@2026'           -- password (change after first login)
) AS hr_user_id;

-- Verify
SELECT u.email, u.raw_user_meta_data->>'name' AS name, ur.role
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'hr'::public.app_role
ORDER BY u.email;
