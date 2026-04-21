-- Library Admin Portal schema
-- Barcode-first: each physical copy is a row with its own barcode.
-- Safe to re-run.

-- =========================================================================
-- 0. Extend app_role enum to include 'library'
-- =========================================================================
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'library';

-- =========================================================================
-- 1. Books (titles — metadata only, NO per-copy data here)
-- =========================================================================
CREATE TABLE IF NOT EXISTS books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'textbook',
  isbn TEXT,
  publisher TEXT,
  year_published INTEGER,
  edition TEXT,
  reference_only BOOLEAN DEFAULT FALSE,
  replacement_cost NUMERIC(10, 2) DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'archived')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_books_title ON books USING gin (to_tsvector('simple', title));
CREATE INDEX IF NOT EXISTS idx_books_author ON books(author);
CREATE INDEX IF NOT EXISTS idx_books_isbn ON books(isbn);
CREATE INDEX IF NOT EXISTS idx_books_category ON books(category);

-- =========================================================================
-- 2. Book Copies (one row per physical copy — barcode is the primary id)
-- =========================================================================
CREATE TABLE IF NOT EXISTS book_copies (
  barcode TEXT PRIMARY KEY,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  shelf_location TEXT,
  condition TEXT NOT NULL DEFAULT 'good'
    CHECK (condition IN ('good', 'damaged', 'lost', 'out_of_service')),
  status TEXT NOT NULL DEFAULT 'available'
    CHECK (status IN ('available', 'issued')),
  acquired_on DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_copies_book ON book_copies(book_id);
CREATE INDEX IF NOT EXISTS idx_copies_status ON book_copies(status);

-- =========================================================================
-- 3. Library Issues (one row per issue event — references a specific copy)
-- =========================================================================
CREATE TABLE IF NOT EXISTS library_issues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_roll TEXT NOT NULL,
  student_name TEXT,
  copy_barcode TEXT NOT NULL REFERENCES book_copies(barcode) ON DELETE RESTRICT,
  book_id UUID NOT NULL REFERENCES books(id) ON DELETE RESTRICT,
  issued_on DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  returned_on DATE,
  return_condition TEXT CHECK (return_condition IN ('good', 'damaged', 'lost')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'returned', 'overdue', 'lost')),
  issued_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  returned_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- A copy can only have one active issue at a time.
CREATE UNIQUE INDEX IF NOT EXISTS idx_issue_one_active_per_copy
  ON library_issues (copy_barcode)
  WHERE status = 'active' OR status = 'overdue';

CREATE INDEX IF NOT EXISTS idx_issues_student ON library_issues(student_roll);
CREATE INDEX IF NOT EXISTS idx_issues_book ON library_issues(book_id);
CREATE INDEX IF NOT EXISTS idx_issues_status ON library_issues(status);
CREATE INDEX IF NOT EXISTS idx_issues_due ON library_issues(due_date);

-- =========================================================================
-- 4. Library Fines
-- =========================================================================
CREATE TABLE IF NOT EXISTS library_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_id UUID REFERENCES library_issues(id) ON DELETE SET NULL,
  student_roll TEXT NOT NULL,
  reason TEXT NOT NULL
    CHECK (reason IN ('overdue', 'damage', 'lost')),
  amount NUMERIC(10, 2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'unpaid'
    CHECK (status IN ('unpaid', 'paid', 'waived')),
  payment_ref TEXT,
  paid_on DATE,
  waiver_reason TEXT,
  handled_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fines_student ON library_fines(student_roll);
CREATE INDEX IF NOT EXISTS idx_fines_status ON library_fines(status);

-- =========================================================================
-- 5. Settings (single row for library-wide config)
-- =========================================================================
CREATE TABLE IF NOT EXISTS library_settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  loan_period_days INTEGER NOT NULL DEFAULT 14,
  fine_per_day NUMERIC(10, 2) NOT NULL DEFAULT 2,
  max_books_per_student INTEGER NOT NULL DEFAULT 3,
  fine_block_threshold NUMERIC(10, 2) NOT NULL DEFAULT 100,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

INSERT INTO library_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- =========================================================================
-- 6. Helper view: copies summary per book
-- =========================================================================
CREATE OR REPLACE VIEW book_inventory AS
SELECT
  b.id AS book_id,
  b.title,
  b.author,
  b.category,
  b.reference_only,
  COUNT(c.barcode) AS total_copies,
  COUNT(c.barcode) FILTER (WHERE c.status = 'available' AND c.condition = 'good') AS available_copies,
  COUNT(c.barcode) FILTER (WHERE c.status = 'issued') AS issued_copies
FROM books b
LEFT JOIN book_copies c ON c.book_id = b.id
GROUP BY b.id;

-- =========================================================================
-- Seed: one library admin entry hint (actual auth user created separately)
-- =========================================================================
-- To enable Library Admin login:
--   1. Supabase → Authentication → Add user
--        email: library@mlrit.ac.in
--        password: <secure>
--        user_metadata: {"role": "library"}
--   2. INSERT INTO user_roles (user_id, role) VALUES ('<uuid>', 'library');
