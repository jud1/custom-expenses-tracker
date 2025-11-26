-- FIX RLS V5 (Restore Profile Visibility)

-- 1. Profiles Policy
-- I accidentally deleted the profile policies in the previous step, making your profile invisible.
-- This restores visibility so the app can find you.
create policy "Public profiles are viewable by everyone" on profiles for select using (true);

-- Allow users to update their own profile
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Allow users to insert their own profile (if missing)
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

-- 2. Accounts Policy (Double Check)
-- Ensure you can create accounts
drop policy if exists "insert_accounts" on accounts;
create policy "insert_accounts" on accounts for insert 
with check ( auth.uid() = owner_id );
