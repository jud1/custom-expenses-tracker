import React, { useState, useEffect } from 'react';
import { Plus, LogOut, ArrowLeft, Settings, UserCog } from 'lucide-react';
import { DashboardLayout } from './components/Layout/DashboardLayout';
import { SummaryCard } from './components/Dashboard/SummaryCard';
import { ReconciliationWidget } from './components/Dashboard/ReconciliationWidget';
import { ExpenseList } from './components/Expenses/ExpenseList';
import { AddExpenseModal } from './components/Expenses/AddExpenseModal';
import { AccountSelection } from './components/Accounts/AccountSelection';
import { LoginScreen } from './components/Auth/LoginScreen';
import { EditAccountModal } from './components/Accounts/EditAccountModal';
import { ProfileSettingsModal } from './components/Auth/ProfileSettingsModal';
import { ImportExpensesModal } from './components/Expenses/ImportExpensesModal';
import { AVATAR_ICONS } from './components/UserAvatar';
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
    deleteExpense,
    deleteExpenses,
    balances
  } = useExpenses(activeAccount);

  const { updateAccount, deleteAccount } = useAccounts(currentUser?.id);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
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

        // Check if avatar is missing or is a legacy URL (Dicebear/Google)
        // We want to enforce random icons for everyone eventually, or at least for defaults
        // If it's a URL, we might want to replace it if it's a default one, but let's be safe
        // and only replace if it's null or explicitly a dicebear one we generated before.
        // Actually, user said "replace avatars taken from google".
        // So if it's NOT an icon: string, we should probably replace it?
        // But maybe they selected a custom one?
        // Let's stick to: if it's null OR it looks like a default dicebear URL.
        // Or better: if it's NOT starting with 'icon:', assign a random one.
        // Wait, existing users might have Google photos they want to keep?
        // User said: "quiero que estos iconos remplacen los avatar sacados de google"
        // This implies we should migrate them.
        // Let's check if it starts with 'http'. If so, replace with random icon.

        let avatar = data.avatar_url;
        let shouldUpdate = false;

        if (!avatar || avatar.startsWith('http')) {
          const iconNames = Object.keys(AVATAR_ICONS);
          const randomIcon = iconNames[Math.floor(Math.random() * iconNames.length)];
          avatar = `icon:${randomIcon}`;
          shouldUpdate = true;
        }

        if (shouldUpdate) {
          console.log("Migrating user to random icon:", avatar);
          await supabase.from('profiles').update({ avatar_url: avatar }).eq('id', user.id);
        }

        setCurrentUser({
          id: data.id,
          name: data.full_name || data.email,
          avatar: avatar
        });
      } else {
        // 2. Fallback: Create new profile with random icon
        console.warn("Profile not found in DB, creating new one");

        const iconNames = Object.keys(AVATAR_ICONS);
        const randomIcon = iconNames[Math.floor(Math.random() * iconNames.length)];

        const fallbackProfile = {
          id: user.id,
          name: user.user_metadata.full_name || user.email,
          avatar: `icon:${randomIcon}`
        };
        setCurrentUser(fallbackProfile);

        try {
          await supabase.from('profiles').insert({
            id: user.id,
            email: user.email,
            full_name: fallbackProfile.name,
            avatar_url: fallbackProfile.avatar
          });
          console.log("Created missing profile in DB with random icon");
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

  const handleUpdateProfile = (updatedUser) => {
    setCurrentUser(updatedUser);

    if (activeAccount) {
      setActiveAccount(prev => ({
        ...prev,
        members: prev.members.map(m =>
          m.id === updatedUser.id
            ? { ...m, name: updatedUser.name, avatar: updatedUser.avatar }
            : m
        )
      }));
    }
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

  const handleAccountSelect = (account) => {
    // Patch the current user's details in the account members to ensure they are up to date
    // This fixes the issue where the account list might have stale user data after a profile update
    const updatedMembers = account.members.map(m =>
      m.id === currentUser.id
        ? { ...m, name: currentUser.name, avatar: currentUser.avatar }
        : m
    );
    setActiveAccount({ ...account, members: updatedMembers });
  };

  // 2. Account Selection
  if (!activeAccount) {
    return (
      <>
        <AccountSelection
          onSelect={handleAccountSelect}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />
        <ProfileSettingsModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          currentUser={currentUser}
          onUpdate={handleUpdateProfile}
        />
      </>
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

  const handleDeleteAccount = async (accountId) => {
    try {
      await deleteAccount(accountId);
      setIsAccountModalOpen(false);
      setActiveAccount(null); // Go back to account selection
    } catch (error) {
      console.error("Failed to delete account:", error);
      alert("Failed to delete account. Please try again.");
    }
  };

  const handleImportExpenses = async (importedExpenses) => {
    try {
      for (const expense of importedExpenses) {
        // 1. Parse Date: DD-MM-YYYY -> YYYY-MM-DD
        const [day, month, year] = expense.date.split('-');
        const formattedDate = `${year}-${month}-${day}`;

        // 2. Calculate Shares
        if (!expense.participants || expense.participants.length === 0) {
          continue;
        }

        const amount = parseFloat(expense.amount);
        const shareAmount = amount / expense.participants.length;

        const shares = expense.participants.map(userId => ({
          user_id: userId,
          amount: shareAmount,
          status: 'PENDING'
        }));

        // 3. Add Expense
        await addExpense({
          title: expense.title,
          amount: amount,
          date: formattedDate,
          shares: shares
        });
      }
      setIsImportModalOpen(false);
    } catch (error) {
      console.error("Import failed:", error);
      alert("Failed to import expenses. Please try again.");
    }
  };

  return (
    <>
      <DashboardLayout currentUser={currentUser}>
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
            <div className="flex items-center gap-2 ml-9">
              <p className="text-gray-500 text-sm">
                Logged in as <span className="font-bold text-primary">{currentUser.name}</span>
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 px-4 py-2 rounded-xl font-medium shadow-sm transition-all active:scale-95"
            >
              Import
            </button>
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
            onToggleShare={toggleShareStatus}
            onEdit={handleEditExpense}
            onDelete={deleteExpense}
            onDeleteMultiple={deleteExpenses}
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
          onDelete={handleDeleteAccount}
          account={activeAccount}
          currentUser={currentUser}
        />
      </DashboardLayout>

      <ProfileSettingsModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        onUpdate={handleUpdateProfile}
      />

      <ImportExpensesModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        account={activeAccount}
        onImport={handleImportExpenses}
      />
    </>
  );
}

export default App;
