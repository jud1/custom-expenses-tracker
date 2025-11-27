-- FIX RLS V6 (Idempotent Fix)
-- This script safely drops existing policies before creating them to avoid errors.

-- 1. Drop ALL potential Profile policies
drop policy if exists "Public profiles are viewable by everyone" on profiles;
drop policy if exists "Users can insert their own profile" on profiles;
drop policy if exists "Users can update own profile" on profiles;

-- 2. Recreate Profile Policies
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);

-- 3. Accounts Policy (Double Check)
drop policy if exists "insert_accounts" on accounts;
create policy "insert_accounts" on accounts for insert 
with check ( auth.uid() = owner_id );
