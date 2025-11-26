-- EMERGENCY UNBLOCK
-- This script DISABLES Row Level Security on the affected tables.
-- This means NO policies will be checked. The app will just work.
-- We can re-enable security later once you are up and running.

alter table accounts disable row level security;
alter table account_members disable row level security;
alter table expenses disable row level security;
alter table expense_shares disable row level security;
