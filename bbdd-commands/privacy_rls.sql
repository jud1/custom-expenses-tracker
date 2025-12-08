-- Enable RLS on profiles if not already enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Remove existing policies to start fresh
-- Note: We drop specific names to avoid conflicts.
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles; -- Drop legacy name just in case
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles visible to self and shared account members" ON profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles; -- Drop default supabase policy if it exists

-- 1. INSERT: Allow users to insert their *own* profile.
CREATE POLICY "Users can insert their own profile"
ON profiles FOR INSERT
WITH CHECK ( auth.uid() = id );

-- 2. UPDATE: Allow users to update their *own* profile.
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING ( auth.uid() = id );

-- 3. SELECT: Privacy by Default
-- Users can see their OWN profile.
-- Users can see profiles of other users if they share an account.
CREATE POLICY "Profiles visible to self and shared account members"
ON profiles FOR SELECT
USING (
  auth.uid() = id
  OR
  EXISTS (
    SELECT 1
    FROM account_members am_my
    JOIN account_members am_other ON am_my.account_id = am_other.account_id
    WHERE am_my.user_id = auth.uid()
      AND am_other.user_id = profiles.id
  )
);
