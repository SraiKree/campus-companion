-- Student Admin & Accounts requests (unified table for 8 modules)
-- Safe to re-run.

CREATE TABLE IF NOT EXISTS student_admin_account_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_roll TEXT,
  student_name TEXT,

  module_type TEXT NOT NULL CHECK (module_type IN (
    'certificate',    -- Bonafide / TC / Custodian / Language
    'scholarship',    -- Scholarship particulars
    'letterhead',     -- Letter heads
    'fee_query',      -- Fees related Details
    'internet',       -- Internet issues
    'id_card',        -- ID Card apply/reissue
    'event_media',    -- Event banners / brochures
    'event_bill'      -- Event bills
  )),

  -- Human-readable sub-type within a module (e.g. 'Bonafide', 'Transfer', 'Banner', 'Brochure')
  sub_type TEXT,

  purpose TEXT NOT NULL,
  description TEXT,
  required_by DATE,

  -- Module-specific fields (bill amount, club/event name, device id, etc.)
  details JSONB NOT NULL DEFAULT '{}'::jsonb,

  -- Optional uploaded artefact (bill receipt, photo, etc.)
  attachment_url TEXT,

  status TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'In Review', 'Approved', 'Rejected', 'Completed')),
  admin_remarks TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sa_requests_student ON student_admin_account_requests(student_id);
CREATE INDEX IF NOT EXISTS idx_sa_requests_module  ON student_admin_account_requests(module_type);
CREATE INDEX IF NOT EXISTS idx_sa_requests_status  ON student_admin_account_requests(status);
CREATE INDEX IF NOT EXISTS idx_sa_requests_created ON student_admin_account_requests(created_at DESC);
