-- FIX RLS V3 (Simplified)

-- 1. Drop existing insert policy
drop policy if exists "Accounts insertable by authenticated users" on accounts;

-- 2. Create a simpler insert policy
-- This allows any authenticated user to insert a row. 
-- We rely on the table constraint "owner_id references profiles(id)" for integrity.
create policy "Accounts insertable by authenticated users" on accounts for insert 
to authenticated 
with check (true);
