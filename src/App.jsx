import React, { useState, useEffect } from 'react';
import { Plus, LogOut, ArrowLeft, Settings } from 'lucide-react';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { SummaryCard } from './components/Dashboard/SummaryCard';
import { ReconciliationWidget } from './components/Dashboard/ReconciliationWidget';
import { ExpenseList } from './components/Expenses/ExpenseList';
import { AddExpenseModal } from './components/Expenses/AddExpenseModal';
import { AccountSelection } from './components/Accounts/AccountSelection';
import { LoginScreen } from './components/Auth/LoginScreen';
import { EditAccountModal } from './components/Accounts/EditAccountModal';
import { useExpenses, useAccounts } from './hooks/useExpenses';
import { supabase } from './lib/supabase';

function App() {
  const [session, setSession] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [activeAccount, setActiveAccount] = useState(null);

  const {
    expenses,
    loading: expensesLoading,
    addExpense,
    updateExpense,
    toggleShareStatus,
    balances
  } = useExpenses(activeAccount);

  const { updateAccount } = useAccounts(currentUser?.id);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  useEffect(() => {
    // Check active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setProfileLoading(false);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      console.log("Auth Event:", _event);
      setSession(session);
      if (session?.user) {
        fetchProfile(session.user);
      } else {
        setCurrentUser(null);
        setActiveAccount(null);
        setProfileLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (user) => {
    try {
      setProfileLoading(true);
      console.log("Fetching profile for:", user.id);

      // 1. Try to get from DB
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (data) {
        console.log("Profile found in DB:", data);
        setCurrentUser({
          id: data.id,
          name: data.full_name || data.email,
          avatar: data.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`
        });
      } else {
        // 2. Fallback: Use Auth Metadata if DB profile is missing
        // This happens if the trigger failed or hasn't run yet
        console.warn("Profile not found in DB, using Auth Metadata");
        const fallbackProfile = {
          id: user.id,
          name: user.user_metadata.full_name || user.email,
          avatar: user.user_metadata.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`
        };
        setCurrentUser(fallbackProfile);

        // Optional: Attempt to create it client-side to fix the DB
        try {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: fallbackProfile.name,
            avatar_url: fallbackProfile.avatar
          });
          console.log("Created missing profile in DB");
        } catch (insertError) {
          console.error("Failed to auto-create profile:", insertError);
        }
      }
    } catch (err) {
      console.error("Profile fetch exception:", err);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setCurrentUser(null);
    setActiveAccount(null);
  };

  // 0. Loading State (Global)
  if (profileLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50 flex-col gap-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="text-gray-500">Loading user profile...</p>
      </div>
    );
  }

  // 1. Login Screen
  if (!session || !currentUser) {
    return <LoginScreen />;
  }

  // 2. Account Selection
  if (!activeAccount) {
    return (
      <AccountSelection
        onSelect={setActiveAccount}
        currentUser={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  // 3. Dashboard
  if (expensesLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleEditExpense = (expense) => {
    setExpenseToEdit(expense);
    setIsExpenseModalOpen(true);
  };

  const handleCloseExpenseModal = () => {
    setIsExpenseModalOpen(false);
    setExpenseToEdit(null);
  };

  const handleUpdateAccount = async (id, updates) => {
    const updated = await updateAccount(id, updates);
    setActiveAccount(updated);
  };

  return (
    <DashboardLayout>
      {/* Header Actions */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button
              onClick={() => setActiveAccount(null)}
              className="p-1 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
            >
              <ArrowLeft size={20} />
            </button>
            <h2 className="text-2xl font-bold text-gray-800">{activeAccount.name}</h2>
            <button
              onClick={() => setIsAccountModalOpen(true)}
              className="p-1.5 text-gray-400 hover:text-primary hover:bg-indigo-50 rounded-lg transition-colors"
              title="Edit Account"
            >
              <Settings size={18} />
            </button>
          </div>
          <p className="text-gray-500 text-sm ml-9">
            Logged in as <span className="font-bold text-primary">{currentUser.name}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsExpenseModalOpen(true)}
            className="flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-5 py-2 rounded-xl font-medium shadow-lg shadow-primary/30 transition-all active:scale-95"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Summary Section */}
      <section>
        <SummaryCard
          totalPending={balances.totalPending}
          userBalances={balances.userBalances}
        />
      </section>

      {/* Reconciliation Section */}
      <section>
        <ReconciliationWidget totalPending={balances.totalPending} />
      </section>

      {/* Expenses List Section */}
      <section>
        <ExpenseList
          expenses={expenses}
          users={activeAccount.members}
          onToggleShare={toggleShareStatus}
          onEdit={handleEditExpense}
        />
      </section>

      <AddExpenseModal
        isOpen={isExpenseModalOpen}
        onClose={handleCloseExpenseModal}
        onAdd={addExpense}
        onUpdate={updateExpense}
        users={activeAccount.members}
        expenseToEdit={expenseToEdit}
      />

      <EditAccountModal
        isOpen={isAccountModalOpen}
        onClose={() => setIsAccountModalOpen(false)}
        onUpdate={handleUpdateAccount}
        account={activeAccount}
        currentUser={currentUser}
      />
    </DashboardLayout>
  );
}

export default App;
