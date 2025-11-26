import React, { useState } from 'react';
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

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeAccount, setActiveAccount] = useState(null);

  const {
    expenses,
    loading,
    addExpense,
    updateExpense,
    toggleShareStatus,
    balances
  } = useExpenses(activeAccount);

  const { updateAccount } = useAccounts(currentUser?.id);

  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isAccountModalOpen, setIsAccountModalOpen] = useState(false);
  const [expenseToEdit, setExpenseToEdit] = useState(null);

  // 1. Login Screen
  if (!currentUser) {
    return <LoginScreen onLogin={setCurrentUser} />;
  }

  // 2. Account Selection
  if (!activeAccount) {
    return (
      <AccountSelection
        onSelect={setActiveAccount}
        currentUser={currentUser}
        onLogout={() => setCurrentUser(null)}
      />
    );
  }

  // 3. Dashboard
  if (loading) {
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
    setActiveAccount(updated); // Update local state to reflect changes immediately
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
