-- Learning Resources module.
--
-- `learning_resources` holds notes / lectures / syllabus / reference material.
-- Files live in the `learning-resources` Supabase Storage bucket; the row
-- stores `storage_path` so deletes can clean the file up.
-- `external_link` is used for lectures that point to YouTube / Drive / etc.

CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('notes', 'lecture', 'syllabus', 'reference')),
  subject TEXT NOT NULL,
  subject_code TEXT,
  semester TEXT,
  department TEXT,
  section TEXT,
  file_url TEXT,
  file_type TEXT,
  file_size BIGINT,
  external_link TEXT,
  storage_path TEXT,
  uploaded_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uploaded_by_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_learning_resources_type ON learning_resources(type);
CREATE INDEX IF NOT EXISTS idx_learning_resources_subject ON learning_resources(subject);
CREATE INDEX IF NOT EXISTS idx_learning_resources_semester ON learning_resources(semester);
CREATE INDEX IF NOT EXISTS idx_learning_resources_uploaded_by ON learning_resources(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_learning_resources_created_at ON learning_resources(created_at DESC);

-- Student bookmarks
CREATE TABLE IF NOT EXISTS resource_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (student_id, resource_id)
);

CREATE INDEX IF NOT EXISTS idx_resource_bookmarks_student ON resource_bookmarks(student_id);

-- Student view history (for "Recently viewed")
CREATE TABLE IF NOT EXISTS resource_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES learning_resources(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_resource_views_student ON resource_views(student_id, viewed_at DESC);

-- Storage bucket for uploaded files (public read so file_url works directly).
INSERT INTO storage.buckets (id, name, public)
VALUES ('learning-resources', 'learning-resources', true)
ON CONFLICT (id) DO NOTHING;

-- Allow service role (admin client) to manage objects.
-- Anyone can read since the bucket is public.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Public read learning-resources'
  ) THEN
    CREATE POLICY "Public read learning-resources"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'learning-resources');
  END IF;
END$$;
