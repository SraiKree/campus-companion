
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, r.role::public.app_role
FROM auth.users u
CROSS JOIN (VALUES
  ('faculty'),
  ('principal'),
  ('management'),
  ('hostel'),
  ('hod'),
  ('admin'),
  ('transport'),
  ('library'),
  ('hr'),
  ('sport_admin')
) AS r(role)
WHERE u.email = 'keertan.k@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;

-- Verify
SELECT u.email, ur.role::text AS role
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
WHERE u.email = 'keertan.k@gmail.com'
ORDER BY ur.role::text;
