-- FIX RLS POLICIES V2
-- Run this script to fully reset and fix the security policies

-- 1. Helper Function (Security Definer to break recursion)
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

-- 2. ACCOUNTS TABLE
-- Drop all existing policies to ensure a clean slate
drop policy if exists "Accounts viewable by members" on accounts;
drop policy if exists "Accounts insertable by authenticated users" on accounts;
drop policy if exists "Accounts updatable by owner" on accounts;
drop policy if exists "Enable insert for authenticated users only" on accounts;

-- Recreate Policies
create policy "Accounts viewable by members" on accounts for select using (
  id in (select get_my_account_ids())
);

create policy "Accounts insertable by authenticated users" on accounts for insert with check (
  auth.uid() = owner_id
);

create policy "Accounts updatable by owner" on accounts for update using (
  auth.uid() = owner_id
);

-- 3. ACCOUNT_MEMBERS TABLE
drop policy if exists "Members viewable by account members" on account_members;
drop policy if exists "Owners can add members" on account_members;

create policy "Members viewable by account members" on account_members for select using (
  account_id in (select get_my_account_ids())
);

create policy "Owners can add members" on account_members for insert with check (
  exists (
    select 1 from accounts a
    where a.id = account_id
    and a.owner_id = auth.uid()
  )
);
