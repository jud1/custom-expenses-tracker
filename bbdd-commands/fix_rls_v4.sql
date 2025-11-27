-- FIX RLS V4 (The "Nuclear" Option)

-- 1. Disable RLS temporarily to confirm we can reset
alter table accounts disable row level security;
alter table account_members disable row level security;

-- 2. Drop ALL policies on these tables (to clear any duplicates or old names)
drop policy if exists "Accounts viewable by members" on accounts;
drop policy if exists "Accounts insertable by authenticated users" on accounts;
drop policy if exists "Accounts updatable by owner" on accounts;
drop policy if exists "Enable insert for authenticated users only" on accounts;
drop policy if exists "Public profiles are viewable by everyone" on profiles;
-- Add any other names you might have seen

-- 3. Re-enable RLS
alter table accounts enable row level security;
alter table account_members enable row level security;

-- 4. Re-create the Helper Function (just in case)
create or replace function get_my_account_ids()
returns setof uuid
language sql
security definer
set search_path = public
stable
as $$
  select account_id from account_members where user_id = auth.uid()
  union
  select id from accounts where owner_id = auth.uid();
$$;

-- 5. Create SIMPLE, WORKING policies

-- ACCOUNTS
create policy "select_accounts" on accounts for select 
using ( id in (select get_my_account_ids()) );

create policy "insert_accounts" on accounts for insert 
with check ( auth.uid() = owner_id );

create policy "update_accounts" on accounts for update 
using ( auth.uid() = owner_id );

-- ACCOUNT MEMBERS
create policy "select_members" on account_members for select 
using ( account_id in (select get_my_account_ids()) );

create policy "insert_members" on account_members for insert 
with check ( 
  exists (
    select 1 from accounts a
    where a.id = account_id
    and a.owner_id = auth.uid()
  )
);
