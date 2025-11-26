-- Fix RLS Recursion Issues

-- 1. Create a helper function to get user's accounts 
-- SECURITY DEFINER means this runs with system privileges, bypassing RLS to avoid recursion
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

-- 2. Drop existing recursive policies
drop policy if exists "Members viewable by account members" on account_members;
drop policy if exists "Accounts viewable by members" on accounts;
drop policy if exists "Expenses viewable by account members" on expenses;
drop policy if exists "Shares viewable by account members" on expense_shares;

-- 3. Create new simplified policies using the helper function

-- ACCOUNTS
create policy "Accounts viewable by members" on accounts for select using (
  id in (select get_my_account_ids())
);

-- ACCOUNT MEMBERS
create policy "Members viewable by account members" on account_members for select using (
  account_id in (select get_my_account_ids())
);

-- EXPENSES
create policy "Expenses viewable by account members" on expenses for select using (
  account_id in (select get_my_account_ids())
);

-- EXPENSE SHARES
create policy "Shares viewable by account members" on expense_shares for select using (
  exists (
    select 1 from expenses e
    where e.id = expense_shares.expense_id
    and e.account_id in (select get_my_account_ids())
  )
);
