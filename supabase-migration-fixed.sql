-- ==========================================
-- SUPABASE MIGRATION SQL (FIXED)
-- Run this in your Supabase SQL Editor
-- ==========================================

-- 1. Create invites table (if not exists)
CREATE TABLE IF NOT EXISTS invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  school_id TEXT NOT NULL,
  class_id TEXT,
  created_by TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_by TEXT,
  used_at TIMESTAMP WITH TIME ZONE
);

-- 2. Create indexes for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_invites_school_id ON invites(school_id);
CREATE INDEX IF NOT EXISTS idx_invites_code ON invites(code);
CREATE INDEX IF NOT EXISTS idx_invites_used ON invites(used);

-- 3. Enable Row Level Security
ALTER TABLE invites ENABLE ROW LEVEL SECURITY;

-- 4. Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read invites" ON invites;
DROP POLICY IF EXISTS "Authenticated users can create invites" ON invites;
DROP POLICY IF EXISTS "Users can update invites" ON invites;
DROP POLICY IF EXISTS "Users can delete their invites" ON invites;

-- 5. Create policies
-- Allow anyone to read invites (needed for validation)
CREATE POLICY "Anyone can read invites"
  ON invites FOR SELECT
  USING (true);

-- Allow authenticated users to create invites
CREATE POLICY "Authenticated users can create invites"
  ON invites FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update invites they created or are using
CREATE POLICY "Users can update invites"
  ON invites FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete invites they created
CREATE POLICY "Users can delete their invites"
  ON invites FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- 6. Create function to clean up expired invites (optional)
CREATE OR REPLACE FUNCTION cleanup_expired_invites()
RETURNS void AS $$
BEGIN
  DELETE FROM invites
  WHERE expires_at < NOW() AND used = FALSE;
END;
$$ LANGUAGE plpgsql;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Migration completed successfully!';
END $$;
