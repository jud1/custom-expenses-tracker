
// Mock Data
const USERS = [
    { id: 'u1', name: 'Liin', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Liin' },
    { id: 'u2', name: 'Hose', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hose' },
];

let ACCOUNTS = [
    {
        id: 'acc1',
        name: 'Liin & Hose Home',
        owner_id: 'u1',
        member_ids: ['u1', 'u2']
    }
];

let expenses = [
    {
        id: 'e1',
        account_id: 'acc1',
        title: 'Dinner at Mario\'s',
        amount: 1200,
        date: '2023-10-25',
        created_by: 'u1',
        shares: [
            { user_id: 'u1', amount: 600, status: 'PAID' },
            { user_id: 'u2', amount: 600, status: 'PENDING' },
        ]
    }
];

// Simulate API delay
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const expenseService = {
    getUsers: async () => {
        await delay(200);
        return USERS;
    },

    getAccounts: async (userId) => {
        await delay(300);
        // Return accounts where user is owner OR member
        return ACCOUNTS.filter(acc =>
            acc.owner_id === userId || acc.member_ids.includes(userId)
        ).map(acc => ({
            ...acc,
            // Hydrate members
            members: USERS.filter(u => acc.member_ids.includes(u.id))
        }));
    },

    createAccount: async (name, ownerId, memberIds) => {
        await delay(500);
        const newAccount = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            owner_id: ownerId,
            member_ids: [...new Set([ownerId, ...memberIds])] // Ensure owner is member
        };
        ACCOUNTS = [...ACCOUNTS, newAccount];

        // Return hydrated account
        return {
            ...newAccount,
            members: USERS.filter(u => newAccount.member_ids.includes(u.id))
        };
    },

    updateAccount: async (accountId, updates) => {
        await delay(300);
        ACCOUNTS = ACCOUNTS.map(acc => {
            if (acc.id === accountId) {
                return { ...acc, ...updates };
            }
            return acc;
        });

        const updatedAccount = ACCOUNTS.find(acc => acc.id === accountId);
        return {
            ...updatedAccount,
            members: USERS.filter(u => updatedAccount.member_ids.includes(u.id))
        };
    },

    getExpenses: async (accountId) => {
        await delay(500);
        return expenses.filter(e => e.account_id === accountId);
    },

    addExpense: async (expenseData) => {
        await delay(500);
        const newExpense = {
            id: Math.random().toString(36).substr(2, 9),
            ...expenseData,
        };
        expenses = [newExpense, ...expenses];
        return newExpense;
    },

    updateExpense: async (expenseId, updates) => {
        await delay(300);
        expenses = expenses.map(exp => {
            if (exp.id === expenseId) {
                return { ...exp, ...updates };
            }
            return exp;
        });
        return expenses.find(e => e.id === expenseId);
    },

    updateShareStatus: async (expenseId, userId, status) => {
        await delay(300);
        expenses = expenses.map(exp => {
            if (exp.id === expenseId) {
                return {
                    ...exp,
                    shares: exp.shares.map(share =>
                        share.user_id === userId ? { ...share, status } : share
                    )
                };
            }
            return exp;
        });
        return true;
    }
};
