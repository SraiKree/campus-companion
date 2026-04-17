CREATE TABLE IF NOT EXISTS announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    faculty_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    club_name TEXT NOT NULL,
    subject TEXT NOT NULL,
    description TEXT,
    link TEXT,
    image_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT announcements_club_name_check CHECK (
        club_name IN (
            'Came Club',
            'Club Lit',
            'CIE Club',
            'Apex',
            'Scope',
            'EWB',
            'NSS',
            'Code Club',
            'Aim Club',
            'MECH Club',
            'Robotics Club',
            'Squad Club',
            'IT Club'
        )
    )
);

CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_announcements_club_name ON announcements(club_name);
CREATE INDEX IF NOT EXISTS idx_announcements_faculty_id ON announcements(faculty_id);
