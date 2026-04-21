-- Transport Admin Portal schema
-- Safe to re-run (IF NOT EXISTS + ON CONFLICT DO NOTHING).

-- =========================================================================
-- 0. Extend app_role enum to include 'transport'
-- =========================================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'transport';

-- =========================================================================
-- 1. Routes (created first — buses reference routes)
-- =========================================================================
CREATE TABLE IF NOT EXISTS transport_routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  distance_km NUMERIC(6, 2),
  fee_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 2. Drivers (created before buses — buses reference drivers)
-- =========================================================================
CREATE TABLE IF NOT EXISTS transport_drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  alternate_phone TEXT,
  license_number TEXT NOT NULL UNIQUE,
  license_expiry DATE NOT NULL,
  address TEXT,
  photo_url TEXT,
  joining_date DATE DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'assigned', 'on_leave', 'inactive')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 3. Buses
-- =========================================================================
CREATE TABLE IF NOT EXISTS buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_number TEXT NOT NULL UNIQUE,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  route_id UUID REFERENCES transport_routes(id) ON DELETE SET NULL,
  driver_id UUID REFERENCES transport_drivers(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'maintenance')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 4. Route stops (each stop belongs to one route, ordered)
-- =========================================================================
CREATE TABLE IF NOT EXISTS transport_route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE CASCADE,
  stop_name TEXT NOT NULL,
  landmark TEXT,
  pickup_time TIME NOT NULL,
  stop_order INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (route_id, stop_order)
);

-- =========================================================================
-- 5. Student assignments (who rides which bus at which stop)
-- =========================================================================
CREATE TABLE IF NOT EXISTS transport_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_roll TEXT NOT NULL,
  student_name TEXT,
  route_id UUID NOT NULL REFERENCES transport_routes(id) ON DELETE RESTRICT,
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE RESTRICT,
  stop_id UUID NOT NULL REFERENCES transport_route_stops(id) ON DELETE RESTRICT,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'ended')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A student may only have ONE active assignment at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_assignment_one_active_per_student
  ON transport_assignments (student_roll)
  WHERE status = 'active';

-- =========================================================================
-- 6. Fees (auto-generated on assignment, one row per term)
-- =========================================================================
CREATE TABLE IF NOT EXISTS transport_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID REFERENCES transport_assignments(id) ON DELETE SET NULL,
  student_roll TEXT NOT NULL,
  route_id UUID REFERENCES transport_routes(id) ON DELETE SET NULL,
  amount NUMERIC(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_ref TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'paid', 'partial', 'waived', 'overdue')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- 7. Notifications (alerts sent by admin)
-- =========================================================================
CREATE TABLE IF NOT EXISTS transport_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL
    CHECK (type IN ('bus_delay', 'route_change', 'fee_reminder', 'general')),
  audience_type TEXT NOT NULL
    CHECK (audience_type IN ('bus', 'route', 'stop', 'student', 'overdue_all')),
  audience_ref TEXT,
  message TEXT NOT NULL,
  recipient_count INTEGER NOT NULL DEFAULT 0,
  sent_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- Indexes
-- =========================================================================
CREATE INDEX IF NOT EXISTS idx_buses_route ON buses(route_id);
CREATE INDEX IF NOT EXISTS idx_buses_driver ON buses(driver_id);
CREATE INDEX IF NOT EXISTS idx_route_stops_route ON transport_route_stops(route_id, stop_order);
CREATE INDEX IF NOT EXISTS idx_assignments_bus ON transport_assignments(bus_id);
CREATE INDEX IF NOT EXISTS idx_assignments_route ON transport_assignments(route_id);
CREATE INDEX IF NOT EXISTS idx_assignments_stop ON transport_assignments(stop_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student ON transport_assignments(student_roll);
CREATE INDEX IF NOT EXISTS idx_fees_status ON transport_fees(status);
CREATE INDEX IF NOT EXISTS idx_fees_assignment ON transport_fees(assignment_id);
CREATE INDEX IF NOT EXISTS idx_fees_student ON transport_fees(student_roll);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON transport_notifications(sent_at DESC);

-- =========================================================================
-- Helper view: seats_remaining per bus
-- =========================================================================
CREATE OR REPLACE VIEW bus_capacity AS
SELECT
  b.id AS bus_id,
  b.bus_number,
  b.capacity,
  COUNT(a.id) FILTER (WHERE a.status = 'active') AS assigned_count,
  b.capacity - COUNT(a.id) FILTER (WHERE a.status = 'active') AS seats_remaining
FROM buses b
LEFT JOIN transport_assignments a ON a.bus_id = b.id
GROUP BY b.id;

-- =========================================================================
-- Seed: one transport admin entry hint (actual auth user created separately)
-- =========================================================================
-- To enable Transport Admin login:
--   1. Supabase → Authentication → Add user
--        email: transport@mlrit.ac.in
--        password: <secure>
--        user_metadata: {"role": "transport"}
--   2. INSERT INTO user_roles (user_id, role) VALUES ('<uuid>', 'transport');
