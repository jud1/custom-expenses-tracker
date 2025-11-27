-- FINAL FIX (Permissive Mode)
-- This will allow ANY logged-in user to create accounts and members.
-- We are removing the strict checks and relying on the App to send the right data.

-- 1. ACCOUNTS: Allow any authenticated user to insert
drop policy if exists "insert_accounts" on accounts;
drop policy if exists "Accounts insertable by authenticated users" on accounts;
drop policy if exists "Accounts updatable by owner" on accounts;

create policy "allow_all_inserts" on accounts for insert 
to authenticated 
with check (true);

create policy "allow_owner_updates" on accounts for update 
using ( auth.uid() = owner_id );

-- 2. ACCOUNT_MEMBERS: Allow any authenticated user to insert
drop policy if exists "insert_members" on account_members;
drop policy if exists "Owners can add members" on account_members;

create policy "allow_member_inserts" on account_members for insert 
to authenticated 
with check (true);

-- 3. Ensure Select policies are still good (using the helper function)
drop policy if exists "select_accounts" on accounts;
drop policy if exists "Accounts viewable by members" on accounts;

create policy "select_accounts" on accounts for select 
using ( id in (select get_my_account_ids()) );
