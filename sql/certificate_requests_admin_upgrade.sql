-- Extend certificate_requests for full admin workflow:
--   Pending → Under Review → Approved → Issued
--                         ↘ Rejected
-- Plus a status_history table for timeline/audit and a signed PDF column.
-- Safe to re-run.

-- 1. Drop and recreate the status check to include 'Under Review'
ALTER TABLE certificate_requests
  DROP CONSTRAINT IF EXISTS certificate_requests_status_check;

ALTER TABLE certificate_requests
  ADD CONSTRAINT certificate_requests_status_check
  CHECK (status IN ('Pending', 'Under Review', 'Approved', 'Rejected', 'Issued'));

-- 2. New columns (idempotent)
ALTER TABLE certificate_requests
  ADD COLUMN IF NOT EXISTS reviewer_id UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS issued_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS signed_pdf_url TEXT;

-- 3. Status history table (timeline view)
CREATE TABLE IF NOT EXISTS certificate_status_history (
  id BIGSERIAL PRIMARY KEY,
  request_id UUID NOT NULL REFERENCES certificate_requests(id) ON DELETE CASCADE,
  from_status TEXT,
  to_status TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cert_history_request ON certificate_status_history(request_id);
CREATE INDEX IF NOT EXISTS idx_cert_history_created ON certificate_status_history(created_at DESC);

-- 4. Trigger: log every status change automatically
CREATE OR REPLACE FUNCTION log_certificate_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO certificate_status_history (request_id, from_status, to_status, changed_by, remarks)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.reviewer_id, NEW.remarks);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_log_cert_status ON certificate_requests;
CREATE TRIGGER trg_log_cert_status
AFTER UPDATE OF status ON certificate_requests
FOR EACH ROW EXECUTE FUNCTION log_certificate_status_change();
