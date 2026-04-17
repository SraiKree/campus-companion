DROP TABLE IF EXISTS certificate_requests CASCADE;

CREATE TABLE certificate_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT,
  student_roll_number TEXT,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN (
    'Bonafide', 'Study', 'Conduct', 'Character', 'Transfer', 'No Dues', 'Internship', 'Course Completion'
  )),
  purpose TEXT NOT NULL,
  additional_details TEXT,
  required_by DATE,
  status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Issued')),
  remarks TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_certificate_requests_student_id ON certificate_requests(student_id);
CREATE INDEX idx_certificate_requests_status ON certificate_requests(status);
CREATE INDEX idx_certificate_requests_created_at ON certificate_requests(created_at DESC);
