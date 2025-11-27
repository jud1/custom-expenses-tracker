-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- PROFILES (Public profile info)
create table profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text,
  full_name text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- ACCOUNTS (Groups of expenses)
create table accounts (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  name text not null,
  owner_id uuid references profiles(id) not null
);

-- ACCOUNT_MEMBERS (Many-to-Many)
create table account_members (
  id uuid default uuid_generate_v4() primary key,
  account_id uuid references accounts(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(account_id, user_id)
);

-- EXPENSES
create table expenses (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  account_id uuid references accounts(id) on delete cascade not null,
  created_by uuid references profiles(id) not null,
  title text not null,
  amount numeric not null,
  date date not null
);

-- EXPENSE_SHARES (Who owes what)
create table expense_shares (
  id uuid default uuid_generate_v4() primary key,
  expense_id uuid references expenses(id) on delete cascade not null,
  user_id uuid references profiles(id) not null,
  amount numeric not null,
  status text check (status in ('PENDING', 'PAID')) default 'PENDING',
  unique(expense_id, user_id)
);

-- RLS POLICIES (Row Level Security)
alter table profiles enable row level security;
alter table accounts enable row level security;
alter table account_members enable row level security;
alter table expenses enable row level security;
alter table expense_shares enable row level security;

-- Profiles: Publicly viewable, editable by self
create policy "Public profiles are viewable by everyone" on profiles for select using (true);
create policy "Users can insert their own profile" on profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Accounts: Viewable if owner or member
create policy "Accounts viewable by members" on accounts for select using (
  auth.uid() = owner_id or 
  exists (select 1 from account_members where account_id = accounts.id and user_id = auth.uid())
);
create policy "Accounts insertable by authenticated users" on accounts for insert with check (auth.uid() = owner_id);
create policy "Accounts updatable by owner" on accounts for update using (auth.uid() = owner_id);

-- Account Members: Viewable by members of the same account
create policy "Members viewable by account members" on account_members for select using (
  exists (
    select 1 from account_members am 
    where am.account_id = account_members.account_id 
    and am.user_id = auth.uid()
  ) or 
  exists (
    select 1 from accounts a
    where a.id = account_members.account_id
    and a.owner_id = auth.uid()
  )
);
create policy "Owners can add members" on account_members for insert with check (
  exists (
    select 1 from accounts a
    where a.id = account_id
    and a.owner_id = auth.uid()
  )
);

-- Expenses: Viewable by account members
create policy "Expenses viewable by account members" on expenses for select using (
  exists (
    select 1 from account_members am 
    where am.account_id = expenses.account_id 
    and am.user_id = auth.uid()
  ) or
  exists (
    select 1 from accounts a 
    where a.id = expenses.account_id 
    and a.owner_id = auth.uid()
  )
);
create policy "Expenses insertable by account members" on expenses for insert with check (
  exists (
    select 1 from account_members am 
    where am.account_id = account_id 
    and am.user_id = auth.uid()
  ) or
  exists (
    select 1 from accounts a 
    where a.id = account_id 
    and a.owner_id = auth.uid()
  )
);
create policy "Expenses updatable by creator or owner" on expenses for update using (
  created_by = auth.uid() or
  exists (
    select 1 from accounts a 
    where a.id = account_id 
    and a.owner_id = auth.uid()
  )
);

-- Expense Shares: Viewable by account members
create policy "Shares viewable by account members" on expense_shares for select using (
  exists (
    select 1 from expenses e
    left join account_members am on am.account_id = e.account_id
    left join accounts a on a.id = e.account_id
    where e.id = expense_shares.expense_id
    and (am.user_id = auth.uid() or a.owner_id = auth.uid())
  )
);
create policy "Shares insertable by expense creator" on expense_shares for insert with check (
  exists (
    select 1 from expenses e
    where e.id = expense_id
    and e.created_by = auth.uid()
  )
);
create policy "Shares updatable by involved user or expense creator" on expense_shares for update using (
  user_id = auth.uid() or
  exists (
    select 1 from expenses e
    where e.id = expense_id
    and e.created_by = auth.uid()
  )
);

-- TRIGGER for New User Profile
create or replace function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
