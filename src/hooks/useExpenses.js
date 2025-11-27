import { useState, useEffect, useMemo } from 'react';
import { expenseService } from '../services/expenseService';

export function useAccounts(userId) {
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!userId) return;
        loadAccounts();
    }, [userId]);

    const loadAccounts = async () => {
        setLoading(true);
        try {
            const data = await expenseService.getAccounts(userId);
            setAccounts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const createAccount = async (name, memberIds) => {
        const newAccount = await expenseService.createAccount(name, userId, memberIds);
        setAccounts(prev => [...prev, newAccount]);
        return newAccount;
    };

    const updateAccount = async (accountId, updates) => {
        const updatedAccount = await expenseService.updateAccount(accountId, updates);
        setAccounts(prev => prev.map(acc => acc.id === accountId ? updatedAccount : acc));
        return updatedAccount;
    };

    return { accounts, loading, createAccount, updateAccount };
}

export function useExpenses(account) {
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!account) return;

        const loadData = async () => {
            setLoading(true);
            try {
                const expensesData = await expenseService.getExpenses(account.id);
                setExpenses(expensesData);
            } catch (err) {
                setError(err);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [account?.id]);

    const addExpense = async (expenseData) => {
        try {
            const newExpense = await expenseService.addExpense({
                ...expenseData,
                account_id: account.id
            });
            setExpenses(prev => [newExpense, ...prev]);
            return newExpense;
        } catch (err) {
            console.error("Failed to add expense", err);
            throw err;
        }
    };

    const updateExpense = async (expenseId, updates) => {
        try {
            const updatedExpense = await expenseService.updateExpense(expenseId, updates);
            setExpenses(prev => prev.map(exp => exp.id === expenseId ? updatedExpense : exp));
            return updatedExpense;
        } catch (err) {
            console.error("Failed to update expense", err);
            throw err;
        }
    };

    const toggleShareStatus = async (expenseId, userId, currentStatus) => {
        const newStatus = currentStatus === 'PAID' ? 'PENDING' : 'PAID';

        // Optimistic update
        setExpenses(prev => prev.map(exp => {
            if (exp.id === expenseId) {
                return {
                    ...exp,
                    shares: exp.shares.map(share =>
                        share.user_id === userId ? { ...share, status: newStatus } : share
                    )
                };
            }
            return exp;
        }));

        try {
            await expenseService.updateShareStatus(expenseId, userId, newStatus);
        } catch (err) {
            console.error("Failed to update status", err);
        }
    };

    const deleteExpense = async (expenseId) => {
        try {
            await expenseService.deleteExpense(expenseId);
            setExpenses(prev => prev.filter(exp => exp.id !== expenseId));
        } catch (err) {
            console.error("Failed to delete expense", err);
            throw err;
        }
    };

    const deleteExpenses = async (expenseIds) => {
        try {
            await expenseService.deleteExpenses(expenseIds);
            setExpenses(prev => prev.filter(exp => !expenseIds.includes(exp.id)));
        } catch (err) {
            console.error("Failed to delete expenses", err);
            throw err;
        }
    };

    const balances = useMemo(() => {
        if (!account) return { totalPending: 0, userBalances: [] };

        const totalPending = expenses.reduce((acc, exp) => {
            const pendingShares = exp.shares.filter(s => s.status === 'PENDING');
            return acc + pendingShares.reduce((sum, s) => sum + s.amount, 0);
        }, 0);

        const userBalances = account.members.map(user => {
            const pendingAmount = expenses.reduce((acc, exp) => {
                const userShare = exp.shares.find(s => s.user_id === user.id);
                if (userShare && userShare.status === 'PENDING') {
                    return acc + userShare.amount;
                }
                return acc;
            }, 0);
            return { ...user, pendingAmount };
        });

        return { totalPending, userBalances };
    }, [expenses, account]);

    return {
        expenses,
        loading,
        error,
        addExpense,
        updateExpense,
        toggleShareStatus,
        deleteExpense,
        deleteExpenses,
        balances
    };
}
