-- Add status column to account_members
ALTER TABLE account_members 
ADD COLUMN IF NOT EXISTS status text CHECK (status IN ('PENDING', 'ACCEPTED')) DEFAULT 'PENDING';

-- Update existing members to ACCEPTED so current users don't get locked out
UPDATE account_members SET status = 'ACCEPTED' WHERE status = 'PENDING';

-- Policy updates might be needed if PENDING users shouldn't see everything, 
-- but for now keeping it simple: PENDING members can see the account to accept/reject it.
-- We might want to restrict expenses view? 
-- The user request didn't specify strict visibility for pending members content-wise, 
-- just that they need to accept. But "Privacy by Default" implies they shouldn't see data yet.
-- Let's update RLS for expenses/shares to only include ACCEPTED members.

-- Update Expenses Policy: Only ACCEPTED members can see expenses
DROP POLICY IF EXISTS "Expenses viewable by account members" ON expenses;
CREATE POLICY "Expenses viewable by account members" ON expenses FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM account_members am 
    WHERE am.account_id = expenses.account_id 
    AND am.user_id = auth.uid()
    AND am.status = 'ACCEPTED'
  ) OR
  EXISTS (
    SELECT 1 FROM accounts a 
    WHERE a.id = expenses.account_id 
    AND a.owner_id = auth.uid()
  )
);

-- Update Account Members Policy: PENDING members can see the account metadata (via the account join)
-- This is already covered by "Members viewable by account members" which relies on existence in table.
