
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'user_roles_pkey'
      AND conrelid = 'public.user_roles'::regclass
  ) THEN
    -- Only drop+rebuild if the PK is still on (user_id) alone
    IF (
      SELECT array_agg(att.attname::text ORDER BY u.ord)
      FROM pg_constraint c
      JOIN unnest(c.conkey) WITH ORDINALITY u(attnum, ord) ON TRUE
      JOIN pg_attribute att ON att.attrelid = c.conrelid AND att.attnum = u.attnum
      WHERE c.conname = 'user_roles_pkey'
        AND c.conrelid = 'public.user_roles'::regclass
    ) = ARRAY['user_id']::text[] THEN
      ALTER TABLE public.user_roles DROP CONSTRAINT user_roles_pkey;
      ALTER TABLE public.user_roles ADD PRIMARY KEY (user_id, role);
    END IF;
  ELSE
    ALTER TABLE public.user_roles ADD PRIMARY KEY (user_id, role);
  END IF;
END $$;

-- 2. Patch the signup trigger so it uses the new composite PK
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  IF NEW.raw_user_meta_data ? 'role'
     AND (NEW.raw_user_meta_data->>'role') IS NOT NULL
     AND (NEW.raw_user_meta_data->>'role') <> '' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'role')::public.app_role
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$fn$;

-- 3. Verify
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.user_roles'::regclass
  AND contype = 'p';
