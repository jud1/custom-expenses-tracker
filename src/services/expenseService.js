import { supabase } from '../lib/supabase';

export const expenseService = {
    getUsers: async () => {
        const { data, error } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url');

        if (error) throw error;

        return data.map(u => ({
            id: u.id,
            name: u.full_name,
            avatar: u.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.full_name}`
        }));
    },

    getAccounts: async (userId) => {
        // Get accounts where user is owner or member
        const { data: accounts, error } = await supabase
            .from('accounts')
            .select(`
        *,
        owner:profiles!owner_id(*),
        account_members!inner(user_id)
      `)
            .eq('account_members.user_id', userId);

        if (error) throw error;

        // Fetch members for these accounts
        const accountsWithMembers = await Promise.all(accounts.map(async (acc) => {
            const { data: members } = await supabase
                .from('account_members')
                .select('user:profiles(*)')
                .eq('account_id', acc.id);

            const memberProfiles = members.map(m => ({
                id: m.user.id,
                name: m.user.full_name,
                avatar: m.user.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.user.full_name}`
            }));

            // Ensure owner is in the list if not already
            const ownerProfile = {
                id: acc.owner.id,
                name: acc.owner.full_name,
                avatar: acc.owner.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${acc.owner.full_name}`
            };

            if (!memberProfiles.find(m => m.id === ownerProfile.id)) {
                memberProfiles.push(ownerProfile);
            }

            return {
                ...acc,
                members: memberProfiles,
                member_ids: memberProfiles.map(m => m.id)
            };
        }));

        return accountsWithMembers;
    },

    createAccount: async (name, ownerId, memberIds) => {
        // 1. Create Account
        const { data: account, error: accError } = await supabase
            .from('accounts')
            .insert({ name, owner_id: ownerId })
            .select()
            .single();

        if (accError) throw accError;

        // 2. Add Members (include owner)
        const allMemberIds = [...new Set([ownerId, ...memberIds])];

        const membersToAdd = allMemberIds.map(id => ({
            account_id: account.id,
            user_id: id
        }));

        if (membersToAdd.length > 0) {
            const { error: memError } = await supabase
                .from('account_members')
                .insert(membersToAdd);

            if (memError) throw memError;
        }

        // 3. Fetch Profiles for return value
        const { data: profiles } = await supabase
            .from('profiles')
            .select('*')
            .in('id', allMemberIds);

        return {
            ...account,
            members: profiles?.map(p => ({
                id: p.id,
                name: p.full_name,
                avatar: p.avatar_url
            })) || [],
            member_ids: allMemberIds
        };
    },

    updateAccount: async (accountId, updates) => {
        // Update name
        if (updates.name) {
            await supabase.from('accounts').update({ name: updates.name }).eq('id', accountId);
        }

        // Update members (Add only as per restriction)
        if (updates.member_ids) {
            const { data: currentMembers } = await supabase
                .from('account_members')
                .select('user_id')
                .eq('account_id', accountId);

            const currentIds = currentMembers.map(m => m.user_id);
            const newIds = updates.member_ids.filter(id => !currentIds.includes(id));

            // We also need to check if the new IDs include the owner, if so, skip adding to account_members
            // But we don't have owner_id here easily without fetching. 
            // However, the policy handles duplicates usually or we can fetch account first.
            // Let's just try to insert new ones.

            const membersToAdd = newIds.map(id => ({
                account_id: accountId,
                user_id: id
            }));

            if (membersToAdd.length > 0) {
                await supabase.from('account_members').insert(membersToAdd).select();
            }
        }

        // Return updated object
        // For now, we might just return the updates merged, but ideally we fetch fresh
        return { id: accountId, ...updates }; // Simplified, hook reloads usually
    },

    getExpenses: async (accountId) => {
        const { data: expenses, error } = await supabase
            .from('expenses')
            .select(`
        *,
        shares:expense_shares(*)
      `)
            .eq('account_id', accountId)
            .order('date', { ascending: false });

        if (error) throw error;

        return expenses;
    },

    addExpense: async (expenseData) => {
        // 1. Insert Expense
        const { data: expense, error: expError } = await supabase
            .from('expenses')
            .insert({
                account_id: expenseData.account_id,
                created_by: (await supabase.auth.getUser()).data.user.id,
                title: expenseData.title,
                amount: expenseData.amount,
                date: expenseData.date
            })
            .select()
            .single();

        if (expError) throw expError;

        // 2. Insert Shares
        const shares = expenseData.shares.map(s => ({
            expense_id: expense.id,
            user_id: s.user_id,
            amount: s.amount,
            status: s.status
        }));

        const { data: createdShares, error: shareError } = await supabase
            .from('expense_shares')
            .insert(shares)
            .select();

        if (shareError) throw shareError;

        return {
            ...expense,
            shares: createdShares
        };
    },

    updateExpense: async (expenseId, updates) => {
        // 1. Update Expense Fields
        const { data: expense, error: expError } = await supabase
            .from('expenses')
            .update({
                title: updates.title,
                amount: updates.amount,
                date: updates.date
            })
            .eq('id', expenseId)
            .select()
            .single();

        if (expError) throw expError;

        // 2. Update Shares (Delete and Re-insert is easiest for full replacement, or Upsert)
        // Since we might change participants, delete/insert is safer for consistency
        await supabase.from('expense_shares').delete().eq('expense_id', expenseId);

        const shares = updates.shares.map(s => ({
            expense_id: expenseId,
            user_id: s.user_id,
            amount: s.amount,
            status: s.status
        }));

        const { data: createdShares, error: shareError } = await supabase
            .from('expense_shares')
            .insert(shares)
            .select();

        if (shareError) throw shareError;

        return {
            ...expense,
            shares: createdShares
        };
    },

    updateShareStatus: async (expenseId, userId, status) => {
        const { error } = await supabase
            .from('expense_shares')
            .update({ status })
            .eq('expense_id', expenseId)
            .eq('user_id', userId);

        if (error) throw error;
        return true;
    }
};
