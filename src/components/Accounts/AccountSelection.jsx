import React, { useState } from 'react';
import { Plus, ChevronRight, Users, LogOut } from 'lucide-react';
import { CreateAccountModal } from './CreateAccountModal';
import { useAccounts } from '../../hooks/useExpenses';

export function AccountSelection({ onSelect, currentUser, onLogout, onOpenProfile }) {
    const { accounts, loading, createAccount } = useAccounts(currentUser.id);
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-md space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Hello, {currentUser.name}</h1>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-gray-500">Select an account to continue</p>
                            <button
                                onClick={onOpenProfile}
                                className="text-primary text-sm font-medium hover:underline"
                            >
                                Edit Profile
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={onLogout}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        title="Logout"
                    >
                        <LogOut size={20} />
                    </button>
                </div>

                <div className="space-y-4">
                    {accounts.map(account => (
                        <button
                            key={account.id}
                            onClick={() => onSelect(account)}
                            className="w-full bg-white p-4 rounded-2xl shadow-sm border border-gray-200 hover:border-primary hover:shadow-md transition-all group flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-xl bg-indigo-50 flex items-center justify-center text-primary font-bold text-xl">
                                    {account.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-primary transition-colors">{account.name}</h3>
                                    <div className="flex items-center gap-1 text-sm text-gray-500">
                                        <Users size={14} />
                                        <span>{account.members.length} members</span>
                                    </div>
                                </div>
                            </div>
                            <ChevronRight className="text-gray-300 group-hover:text-primary transition-colors" />
                        </button>
                    ))}

                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="w-full p-4 rounded-2xl border-2 border-dashed border-gray-300 hover:border-primary hover:bg-indigo-50/50 text-gray-500 hover:text-primary transition-all flex items-center justify-center gap-2 font-medium"
                    >
                        <Plus size={20} />
                        Create New Account
                    </button>
                </div>
            </div>

            <CreateAccountModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onCreate={createAccount}
                currentUser={currentUser}
            />
        </div>
    );
}
