-- Step 2 of 2 — seed the Sport Admin auth user + grant the role.
-- Prerequisite: sql/sport_admin_01_add_role.sql must have been run
-- successfully and committed BEFORE running this file.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.seed_one_sport_admin_user(
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
      jsonb_build_object('role','sport_admin','name', p_name),
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
        raw_user_meta_data = jsonb_build_object('role','sport_admin','name', p_name),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
        updated_at = NOW()
    WHERE id = uid;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (uid, 'sport_admin'::public.app_role)
  ON CONFLICT (user_id) DO UPDATE SET role = 'sport_admin'::public.app_role;

  RETURN uid;
END;
$fn$;

-- Create the default Sport Admin account.
-- Edit email/name/password below if you want different values.
SELECT public.seed_one_sport_admin_user(
  'keertan.k@gmail.com',  -- email
  'Sport Admin',          -- display name
  '123456789'             -- password (change after first login)
) AS sport_admin_user_id;

-- Verify
SELECT u.email, u.raw_user_meta_data->>'name' AS name, ur.role
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE ur.role = 'sport_admin'::public.app_role
ORDER BY u.email;
